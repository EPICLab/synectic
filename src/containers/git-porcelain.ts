import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import * as http from 'isomorphic-git/http/node';
import * as ini from 'ini';
import * as dot from 'ts-dot-prop';
import getGitConfigPath from 'git-config-path';

import type { Repository, GitStatus } from '../types';
import * as io from './io';
import { isLinkedWorktree } from './git-worktree';
import { matrixEntry, statusMatrix } from './git-plumbing';

type GitConfig = { scope: 'none' } | { scope: 'local' | 'global', value: string };

/**
 * Get the value of a symbolic ref or resolve a ref to its SHA1 object id; this function is a wrapper to the 
 * *isomorphic-git/resolveRef* function to inject the `fs` parameter and extend with additional special identifier
 * support (i.e. `HEAD` for the current commit, `HEAD~1` for the previous commit).
 * Ref: https://github.com/isomorphic-git/isomorphic-git/issues/1238#issuecomment-871220830
 * @param dir The relative or absolute path to the git root (i.e. `/Users/nelsonni/scratch/project`).
 * @param ref The git ref or symbolic-ref (i.e. `HEAD` or `HEAD~1`) to resolve against the current branch.
 * @returns A Promise object containing the SHA1 commit resolved from the provided ref.
 */
export const resolveRef = async (dir: fs.PathLike, ref: string): Promise<string> => {
  const re = /^HEAD~([0-9]+)$/;
  const match = ref.match(re);
  if (match) {
    const count = +match[1];
    const commits = await isogit.log({ dir: dir.toString(), fs, depth: count + 1 });
    return commits.pop().oid;
  }
  return isogit.resolveRef({ dir: dir.toString(), fs, ref });
}

/**
 * Find the root git directory. Starting at filepath, walks upward until it finds a directory that contains a *.git* subdirectory. In the 
 * case of separate working trees (see [git-worktree](https://git-scm.com/docs/git-worktree)), this will find and return a directory that 
 * contains a *.git* file instead.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root git directory path, or undefined if no root git directory exists for the filepath (i.e. 
 * the filepath is not part of a Git repository).
 */
export const getRepoRoot = async (filepath: fs.PathLike): Promise<string | undefined> => {
  try {
    const root = await isogit.findRoot({ fs: fs, filepath: filepath.toString() });
    return root;
  }
  catch (e) {
    return undefined;
  }
};

/**
 * Find the root git directory for a specific branch. For the current branch on the main worktree, this corresponds to calling *getRepoRoot*
 * function. For branches on linked worktrees, this corresponds to reading the `.git/worktrees/{branch}/gitdir` file to determine the file
 * location for the linked worktree directory.
 * @param repo Repository object corresponding to the target branch.
 * @param branch Name of the target branch.
 * @returns A Promise object containing the root git directory path, or undefined if no root git directory exists for the branch (i.e. the 
 * branch is remote-only and is not currently being tracked locally).
 */
export const getBranchRoot = async (repo: Repository, branch: string): Promise<string | undefined> => {
  // check to see if branch matches the main worktree
  const current = await currentBranch({ dir: repo.root });
  if (branch === current) return getRepoRoot(repo.root);

  // check to see if branch matches one of the linked worktrees
  const worktreePath = path.join(repo.root.toString(), '.git', 'worktrees');
  return fs.stat(worktreePath)
    .then(async () => {
      const worktreeBranches = await io.readDirAsync(worktreePath);
      const match = worktreeBranches.find(w => w === branch);
      if (match) {
        return path.dirname((await io.readFileAsync(path.join(worktreePath, match, 'gitdir'), { encoding: 'utf-8' })).trim());
      }
    })
    .catch(() => { return undefined });
}

/**
 * Clone a repository; this function is a wrapper to the *isomorphic-git/clone* function to inject the `fs` parameter and extend with
 * additional local-only branch functionality. If the `ref` parameter or the current branch do not exist on the remote repository, then the
 * local-only repository (including the *.git* directory) is copied using the *fs.copy* function (excluding the `node_modules` directory).
 * @param repo A Repository object to be cloned.
 * @param dir The working tree directory path to contain the cloned repo.
 * @param ref An optional branch name or SHA-1 hash to target cloning to that specific branch or commit.
 * @param singleBranch Instead of the default behavior of fetching all the branches, only fetch a single branch.
 * @param noCheckout Only fetch the repo without checking out a branch. Skipping checkout can save a lot of time normally spent writing
 * files to disk.
 * @param noTags Disables the default behavior of fetching all tags.
 * @param depth Set the maximum depth to retrieve from the git repository's history.
 * @param exclude A list of branches or tags which should be excluded from remote server responses; specifically any commits reachable
 * from these refs will be excluded.
 * @return A Promise object for the clone operation.
 */
export const clone = async ({ repo, dir, ref, singleBranch = false, noCheckout = false, noTags = false, depth, exclude }: {
  repo: Repository;
  dir: fs.PathLike;
  ref?: string;
  singleBranch?: boolean;
  noCheckout?: boolean;
  noTags?: boolean;
  depth?: number;
  exclude?: string[];
}): Promise<void> => {
  const existingBranch = await currentBranch({ dir: repo.root.toString(), fullname: false });
  const targetBranch = ref ? ref : existingBranch;
  if (targetBranch && !repo.remote.includes(targetBranch)) {
    await fs.copy(repo.root.toString(), dir.toString(), { filter: path => !(path.indexOf('node_modules') > -1) });
    if (targetBranch !== existingBranch)
      await checkout({ dir: dir, ref: targetBranch, noCheckout: noCheckout });
    return;
  }
  return isogit.clone({
    fs: fs, http: http, dir: dir.toString(), url: repo.url, singleBranch: singleBranch, noCheckout: noCheckout,
    noTags: noTags, depth: depth, exclude: exclude,
    onProgress: (progress: isogit.GitProgressEvent) => console.log(`cloning objects: ${progress.loaded}/${progress.total}`)
  });
};

/**
 * Checkout a branch; this function is a wrapper to inject the `fs` parameter in to the *isomorphic-git/checkout* function.
 * @param dir The working tree directory path.
 * @param gitdir The git directory path.
 * @param ref The branch name or SHA-1 commit hash to checkout files from; defaults to `HEAD`.
 * @param filepaths Limit the checkout to the given files and directories.
 * @param remote Which remote repository to use for the checkout process; defaults to `origin`.
 * @param noCheckout Optional flag to udate HEAD but not update the working directory; defaults to `false`.
 * @param noUpdateHead Optional flag to update the working directory but not update HEAD. Defaults to `false` when `ref` is provided, 
 * and `true` if `ref` is not provided.
 * @param dryRun Optional flag to simulate a checkout in order to test whether it would succeed; defaults to `false`.
 * @param force Optional flag where conflicts will be ignored and files will be overwritten regardless of local changes.
 * @returns A Promise object for the checkout operation.
 */
export const checkout = async ({
  dir, gitdir = path.join(dir.toString(), '.git'), ref = 'HEAD', filepaths, remote = 'origin',
  noCheckout = false, noUpdateHead = ref === undefined, dryRun = false, force = false
}: {
  dir: fs.PathLike;
  gitdir?: fs.PathLike;
  ref?: string;
  filepaths?: string[];
  remote?: string;
  noCheckout?: boolean;
  noUpdateHead?: boolean;
  dryRun?: boolean;
  force?: boolean;
}): Promise<void> => {
  return isogit.checkout({
    fs: fs, dir: dir.toString(), gitdir: gitdir.toString(), ref: ref, filepaths: filepaths,
    remote: remote, noCheckout: noCheckout, noUpdateHead: noUpdateHead, dryRun: dryRun, force: force
  });
}

/**
 * Get the name of the branch currently pointed to by *.git/HEAD*; this function is a wrapper to the *isomorphic-git/currentBranch* 
 * function to inject the `fs` parameter and extend with additional worktree path resolving functionality. If the `gitdir` parameter is a 
 * file, then `.git` points to a file containing updated pathing to translate from the linked worktree to the `.git/worktree` directory in 
 * the main worktree and this path must be used for branch checks.
 * @param dir The working tree directory path.
 * @param gitdir The git directory path.
 * @param fullname Boolean option to return the full path (e.g. "refs/heads/master") instead of the abbreviated form; default is false.
 * @param test Boolean option to return 'undefined' if the current branch doesn't actually exist (such as 'master' right after git init).
 * @return A Promise object containing the current branch name, or undefined if the HEAD is detached.
 */
export const currentBranch = async ({ dir, gitdir = path.join(dir.toString(), '.git'), fullname, test }: {
  dir: fs.PathLike;
  gitdir?: fs.PathLike;
  fullname?: boolean;
  test?: boolean;
}): Promise<string | void> => {
  if (await isLinkedWorktree({ gitdir: gitdir })) {
    const worktreedir = (await io.readFileAsync(gitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
    return await isogit.currentBranch({ fs: fs, dir: worktreedir, gitdir: worktreedir, fullname: fullname, test: test });
  } else {
    return await isogit.currentBranch({ fs: fs, dir: dir.toString(), gitdir: gitdir.toString(), fullname: fullname, test: test });
  }
}

/**
 * Delete a local branch; this function is a wrapper to inject the `fs` parameter in to the *isomorphic-git/deleteBranch* function.
 * @param dir The working tree directory path.
 * @param gitdir The git directory path.
 * @param ref The branch name to delete.
 * @return A Promise object for the branch deletion operation; succeeds when filesystem operations are complete.
 */
export const deleteBranch = ({ dir, gitdir = path.join(dir.toString(), '.git'), ref }: {
  dir: fs.PathLike;
  gitdir?: fs.PathLike;
  ref: string;
}): Promise<void> => {
  return isogit.deleteBranch({ fs: fs, dir: dir.toString(), gitdir: gitdir.toString(), ref: ref });
}

/**
* Get commit descriptions from the git history; this function is a wrapper to inject the `fs` parameter in to the 
* *isomorphic-git/log* function.
* @param dir The working tree directory path.
* @param ref The commit to begin walking backwards through the history from.
* @param depth Limit the number of commits returned. No limit by default.
* @param since Return history newer than the given date. Can be combined with `depth` to get whichever is shorter.
* @return A Promise object containing an array of `ReadCommitResult` objects (per https://isomorphic-git.org/docs/en/log).
*/
export const log = ({ dir, ref = 'HEAD', depth, since }: {
  dir: fs.PathLike;
  ref?: string;
  depth?: number;
  since?: Date;
}): Promise<isogit.ReadCommitResult[]> => isogit.log({ fs: fs, dir: dir.toString(), ref: ref, depth: depth, since: since });

/**
 * Merge two branches; this function is a wrapper to inject the fs parameter in to the *isomorphic-git/merge* function. The
 * `dryRun` option additionally checks for `user.name` and `user.email` from git-config, and injects a `missingConfig` return
 * object that indicates whether either git-config field is missing from the local configuration level 
 * (see https://www.atlassian.com/git/tutorials/setting-up-a-repository/git-config).
 * @param dir The working tree directory path.
 * @param base The base branch to merge delta commits into.
 * @param compare The compare branch to examine for delta commits.
 * @param dryRun Optional parameter for simulating a merge in order to preemptively test for a successful merge. 
 * @return A Promise object containing the merge results (per https://isomorphic-git.org/docs/en/merge) and any missing git-config
 * fields (only if fields are missing, undefined otherwise).
 */
export const merge = async (
  dir: fs.PathLike, base: string, compare: string, dryRun = false
): Promise<isogit.MergeResult & { missingConfigs?: string[] }> => {
  const name = { path: 'user.name', value: await isogit.getConfig({ fs: fs, dir: dir.toString(), path: 'user.name' }) };
  const email = { path: 'user.email', value: await isogit.getConfig({ fs: fs, dir: dir.toString(), path: 'user.email' }) };
  const missing: string[] = [name, email].filter(config => !config.value || config.value.length <= 0).map(config => config.path);
  const mergeResult = await isogit.merge({
    fs: fs,
    dir: dir.toString(),
    ours: base,
    theirs: compare,
    dryRun: dryRun,
    author: {
      name: name.value ? name.value : 'Mr. Test',
      email: email.value ? email.value : 'mrtest@example.com',
    }
  });
  const final = { missingConfigs: missing.length > 0 ? missing : undefined, ...mergeResult };
  return final;
}

/**
 * Determines the git tracking status of a specific file or directory path. If the `filepath` parameter points to a linked worktree,
 * then the `.git` file in that worktree will be used to translate paths back to the main worktree for querying the git trees 
 * (HEAD, WORKDIR, and STAGE).
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing undefined if the path is not contained within a directory under version control, or a git 
 * status indicator (see `GitStatus` type definition for all possible status values).
 */
export const getStatus = async (filepath: fs.PathLike): Promise<GitStatus | undefined> => {
  if (await io.isDirectory(filepath)) {
    const statuses = await statusMatrix(filepath);
    const changed = statuses ? statuses
      .filter(row => row[1] !== row[2])   // filter for files that have been changed since the last commit
      .map(row => row[0])                 // return the filenames only
      : [];                               // handle the case that `statusMatrix` returned undefined
    return (changed.length > 0) ? 'modified' : 'unmodified';
  }
  return matrixEntry(filepath);
}

/**
 * List a remote servers branches, tags, and capabilities; this function is a wrapper to inject the `fs` parameter in to the 
 * *isomorphic-git/getRemoteInfo* function.
 * @param http An HTTP client (i.e. *isomorphic-git* provides a client in `isomorphic-git/http/node`).
 * @param onAuth Optional auth fill callback.
 * @param onAuthFailure Optional auth rejection callback.
 * @param onAuthSuccess Optional auth approved callback.
 * @param url The URL of the remote repository. Will be retrieved from local `gitconfig` if absent.
 * @param corsProxy Optional CORS proxy. Overrides value in repo config.
 * @param forPush Optional flag to enable queries for `push` capabilities, otherwise queries are for `fetch` capabilities 
 * only; defaults to `false`.
 * @param headers Additional headers to include in the HTTP requests, similar to the `extraHeader` config in canonical git.
 * @returns 
 */
export const getRemoteInfo = ({ onAuth, onAuthFailure, onAuthSuccess, url = '', corsProxy, forPush = false, headers = { } }: {
  onAuth?: isogit.AuthCallback;
  onAuthFailure?: isogit.AuthFailureCallback;
  onAuthSuccess?: isogit.AuthSuccessCallback;
  url?: string;
  corsProxy?: string;
  forPush?: boolean;
  headers?: Record<string, string>;
}): Promise<isogit.GetRemoteInfoResult> => {
  return isogit.getRemoteInfo({
    http: http, onAuth: onAuth, onAuthFailure: onAuthFailure, onAuthSuccess: onAuthSuccess,
    url: url, corsProxy: corsProxy, forPush: forPush, headers: headers
  })
}

/**
 * Read an entry from the git-config files; modeled after the *isomorphic-git/getConfig* function, but includes additional functionality
 * to resolve global git-config files. The return object indicates the scope (`local` or `global`) in which the value was located, and the 
 * git-config value. If the optional `global` parameter is not enabled, then `getConfig` will default to checking the `local` scope followed
 * by the `global` scope (only if no value was found in `local`).
 * @param keyPath The dot notation path of the desired git config entry (i.e. `user.name` or `user.email`).
 * @param global Optional parameter for restricting the search to only the global git-config file (i.e. the `global` scope).
 * @return A Promise object containing the value and a scope indicating whether the entry was found in the `local` or `global` git-config
 * file, or only a scope of `none` if the value could not be found in any scope.
 */
export const getConfig = async (keyPath: string, global = false): Promise<GitConfig> => {
  const getConfigValue = async (key: string, scope: 'local' | 'global') => {
    const configPath = (scope == 'global') ? getGitConfigPath('global') : getGitConfigPath();
    if (!configPath) return null; // no git-config file exists for the requested scope
    if (scope == 'local' && !configPath.endsWith(path.normalize('.git/config'))) return null; // local scope requested, but global scope found
    const configFile = ini.parse(await io.readFileAsync(configPath, { encoding: 'utf-8' }));
    return dot.has(configFile, key) ? dot.get(configFile, key) as string : null;
  };

  const localValue = global ? null : await getConfigValue(keyPath, 'local');
  const globalValue = await getConfigValue(keyPath, 'global');

  if (global && globalValue) return { scope: 'global', value: globalValue };
  if (!global && localValue) return { scope: 'local', value: localValue };
  if (!global && !localValue && globalValue) return { scope: 'global', value: globalValue };
  return { scope: 'none' };
};

/**
 * Update an entry in the git-config files; modeled after the *isomorphic-git/setConfig* function, but includes additional functionality
 * to resolve global git-config files. The scope is strictly respected (i.e. if the entry exists only in `global` scope but `local` scope 
 * is specified, then a new entry will be added to the git-config file in `local` scope). Entries can be removed by setting value to
 * `undefined`; attempting to remove a non-existing entry will result in a null operation.
 * @param scope The scope indicating whether the entry update should occur in the `local` or `global` git-config file. 
 * @param keyPath The dot notation path of the desired git config entry (i.e. `user.name` or `user.email`).
 * @param value The value to be added, updated, or removed (by setting `undefined`) from the git-config file.
 * @return A Promise object containing a string in ini-format with the contents of the updated git-config file.
 */
export const setConfig = async (scope: 'local' | 'global', keyPath: string, value: string | boolean | number | undefined)
  : Promise<string | null> => {
  const configPath = (scope == 'global') ? getGitConfigPath('global') : getGitConfigPath();
  if (!configPath) return null;                                                 // no git-config file exists for the requested scope
  if (scope == 'local' && !configPath.endsWith(path.normalize('.git/config'))) return null; // local scope requested, but global scope found

  const configFile = ini.parse(await io.readFileAsync(configPath, { encoding: 'utf-8' }));
  if (value === undefined) dot.remove(configFile, keyPath);
  else dot.set(configFile, keyPath, value);

  const updatedConfig = ini.stringify(configFile, { section: '', whitespace: true });
  await io.writeFileAsync(configPath, updatedConfig);
  return updatedConfig;
}