import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import * as http from 'isomorphic-git/http/node';
import * as path from 'path';
import * as ini from 'ini';
import * as dot from 'ts-dot-prop';
import parsePath from 'parse-path';
import isUUID from 'validator/lib/isUUID';
import { isWebUri } from 'valid-url';
import getGitConfigPath from 'git-config-path';
import { toHTTPS } from 'git-remote-protocol';

import type { Repository, GitStatus } from '../types';
import * as io from './io';

export type BranchDiffResult = {
  path: string,
  type: 'equal' | 'modified' | 'added' | 'removed'
}

type GitConfig = { scope: 'none' } | { scope: 'local' | 'global', value: string };

/**
 * Get the value of a symbolic ref or resolve a ref to its SHA-1 object id; this is a wrapper to the *isomorphic-git/resolveRef* function 
 * to inject the `fs` parameter and extend with additional worktree path resolving functionality. If the `gitdir` parameter is a file, then
 * `.git` points to a file containing updated pathing to translate from the linked worktree to the main worktree and must be resolved 
 * before any refs can be resolved.
 * @param dir The working tree directory path.
 * @param gitdir The git directory path.
 * @param ref The ref to resolve.
 * @param depth How many symbolic references to follow before returning.
 * @return A Promise object containing the SHA-1 hash or branch name associated with the given `ref` depending on the `depth` parameter; 
 * e.g. `ref: 'HEAD', depth: 2` returns the current branch name, `ref: 'HEAD', depth: 1` returns the SHA-1 hash of the current commit 
 * pointed to by HEAD.
 */
export const resolveRef = async ({ dir, gitdir = path.join(dir.toString(), '.git'), ref, depth }: {
  dir: fs.PathLike;
  gitdir?: fs.PathLike;
  ref: string;
  depth?: number;
}): Promise<string> => {
  if (await io.isDirectory(gitdir)) {
    return isogit.resolveRef({ fs: fs, dir: dir.toString(), gitdir: gitdir.toString(), ref: ref, depth: depth });
  } else {
    const worktreedir = (await io.readFileAsync(gitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
    const commondir = (await io.readFileAsync(path.join(worktreedir, 'commondir'), { encoding: 'utf-8' })).trim();
    const linkedgitdir = path.normalize(`${worktreedir}/${commondir}`);
    const linkeddir = path.normalize(`${gitdir}/..`);
    const updatedRef = (ref === 'HEAD') ? (await io.readFileAsync(`${worktreedir}/HEAD`, { encoding: 'utf-8' })).trim() : ref;
    return isogit.resolveRef({ fs: fs, dir: linkeddir, gitdir: linkedgitdir, ref: updatedRef, depth: depth });
  }
}

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
}): Promise<string | void> => {
  return isogit.checkout({
    fs: fs, dir: dir.toString(), gitdir: gitdir.toString(), ref: ref, filepaths: filepaths,
    remote: remote, noCheckout: noCheckout, noUpdateHead: noUpdateHead, dryRun: dryRun, force: force
  });
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
    if (targetBranch !== existingBranch) await checkout({ dir: dir, ref: targetBranch, noCheckout: noCheckout });
    return;
  }
  return isogit.clone({
    fs: fs, http: http, dir: dir.toString(), url: repo.url.href, singleBranch: singleBranch, noCheckout: noCheckout,
    noTags: noTags, depth: depth, exclude: exclude,
    onProgress: (progress: isogit.GitProgressEvent) => console.log(`cloning objects: ${progress.loaded}/${progress.total}`)
  });
};

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
  // if (fs.statSync(gitdir).isDirectory()) {
  if (await io.isDirectory(gitdir)) {
    return await isogit.currentBranch({ fs: fs, dir: dir.toString(), gitdir: gitdir.toString(), fullname: fullname, test: test });
  } else {
    const worktreedir = (await io.readFileAsync(gitdir, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
    return await isogit.currentBranch({ fs: fs, dir: worktreedir, gitdir: worktreedir, fullname: fullname, test: test });
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

export const gitLog = async (dir: fs.PathLike, branch: string, depth: number): Promise<isogit.ReadCommitResult[]> => {
  return isogit.log({ fs: fs, dir: dir.toString(), ref: `heads/${branch}`, depth: depth });
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
 * Show the commit delta (i.e. the commits not contained in the overlapping subset) between two branches. Although git refers
 * to rev-lists of commits in a branch as trees, they are actually Directed Acyclic Graphs (DAG) where the directed paths can
 * diverge and rejoin at several points. Therefore, we must determine the symmetric difference between the rev-list arrays
 * from the branches. Operates comparably to the native git command: `git log <branch-1>...<branch-2>`
 * @param dir The working tree directory path.
 * @param branchA The base branch name.
 * @param branchB The compare branch name.
 * @return A Promise object containing a list of commits not found in both branches (i.e. the divergent set).
 */
export const branchLog = async (dir: fs.PathLike, branchA: string, branchB: string): Promise<isogit.ReadCommitResult[]> => {
  const logA = await isogit.log({ fs: fs, dir: dir.toString(), ref: `heads/${branchA}` });
  const logB = await isogit.log({ fs: fs, dir: dir.toString(), ref: `heads/${branchB}` });
  return logA
    .filter(commitA => !logB.some(commitB => commitA.oid === commitB.oid))
    .concat(logB.filter(commitB => !logA.some(commitA => commitB.oid === commitA.oid)));
}

/**
 * Show the names and status of changed files between two branches. Walks the trees of both branches and compares file OIDs between
 * branches to determine status. Operates comparably to the native git command: `git diff --name-status <tree-1>...<tree-2>`.
 * @param dir The working tree directory path. 
 * @param branchA The base branch.
 * @param branchB The compare branch.
 * @param filter An optional filter function for returning only specific file results (i.e. only modified files or only newly added files).
 * @return A Promise object containing a list of file paths and a status indicator, where the possible status values for each file are:
 *
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"equal"`             | file is unchanged between both branches                                               |
 * | `"modified"`          | file has modifications, but exists in both branches                                   |
 * | `"added"`             | file does not exist in branch A, but was added in branch B                            |
 * | `"removed"`           | file exists in branch A, but was removed in branch B                                  |
 */
export const branchDiff = async (
  dir: fs.PathLike, branchA: string, branchB: string, filter?: (result: BranchDiffResult) => boolean
): Promise<BranchDiffResult[]> => {
  const hashA = await resolveRef({ dir: dir, ref: `heads/${branchA}` });
  const hashB = await resolveRef({ dir: dir, ref: `heads/${branchB}` });
  const dirpath = dir.toString();
  const files = await isogit.walk({
    fs: fs,
    dir: dirpath,
    trees: [isogit.TREE({ ref: hashA }), isogit.TREE({ ref: hashB })],
    map: async (filepath: string, entries: Array<isogit.WalkerEntry> | null) => {
      if (!entries || entries.length < 2) return;
      const [A, B] = entries.slice(0, 2);

      if (filepath === '.') return;                                           // ignore directories
      if ((await A.type()) === 'tree' || (await B.type()) === 'tree') return; // ignore directories, known as trees in git lingo
      const Aoid = await A.oid();
      const Boid = await B.oid();

      const result: BranchDiffResult = {
        path: `/${filepath}`,
        type: 'equal'
      }
      if (Aoid !== Boid) result.type = 'modified';
      if (Aoid === undefined) result.type = 'added';
      if (Boid === undefined) result.type = 'removed';
      if (Aoid === undefined && Boid === undefined) {
        console.log('Something weird happened:');
        console.log(A);
        console.log(B);
      }

      return (!filter) || (filter && filter(result)) ? result : null;
    },
  });
  return files;
}

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
 * then the `.git` file in that worktree must be used to translate paths back to the main worktree for querying the index. Subsequent
 * calls to **isomorphic-git/status** and **isomorphic-git/statusMatrix** will use a `dir` parameter pointing to the linked worktree
 * root, and a `gitdir` parameter pointing to the `.git` directory in the main worktree.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing undefined if the path is not contained within a git repository, or a status indicator 
 * for whether the path has been changed according to git; the possible resolve values are described for the `GitStatus` type definition.
 */
export const getStatus = async (filepath: fs.PathLike): Promise<GitStatus | undefined> => {
  const repoRoot = await getRepoRoot(filepath);
  if (!repoRoot) return undefined; // no root Git directory indicates that the filepath is not part of a Git repo

  // parse the paths based on main or linked worktree structure
  const dir = repoRoot;
  const isLinked = !(await io.isDirectory(`${repoRoot}/.git`));
  const gitdir = isLinked ?
    (await io.readFileAsync(`${repoRoot}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim()   // linked worktree
    : path.join(dir, '.git');                                                                             // main worktree
  const relativePath = path.relative(dir, filepath.toString());

  /** isomorphic-git provides `status()` for individual files, but requires `statusMatrix()` for directories 
   * (per: https://github.com/isomorphic-git/isomorphic-git/issues/13) */
  if (await io.isDirectory(filepath)) {
    const statuses = await isogit.statusMatrix({ fs: fs, dir: dir, gitdir: gitdir, filter: f => !io.isHidden(f) });
    const changed = statuses
      .filter(row => row[1] !== row[2])   // filter for files that have been changed since the last commit
      .map(row => row[0]);                // return the filenames only
    return (changed.length > 0) ? 'modified' : 'unmodified';
  }

  /** TODO: The following status check is able to process linked worktree files, but is unable to provide meaningful status results.
   * Determining status should involve reading the `index` for the correct branch, in the case of linked worktrees that would be the
   * `index` file inside of the `.git/worktrees/{worktree-name}` directory. However, the `isomorphic-git.status` command is instead
   * comparing against the `index` file at `.git/index` (which is associated with the current branch on the main worktree). Therefore,
   * if a new file was added in the linked worktree, the status would return as `added` since the branch on the main worktree has no
   * records of that file being committed. */
  return isogit.status({ fs: fs, dir: dir, gitdir: gitdir, filepath: relativePath });
}

export const getRemoteInfo = ({ onAuth, onAuthFailure, onAuthSuccess, url = '', corsProxy, forPush = false, headers = {} }: {
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
 * Asynchronous check for presence of .git within directory to validate Git version control.
 * @param filepath The relative or absolute path to evaluate. 
 * @return A Promise object containing true if filepath contains a .git subdirectory (or points directly to the .git directory), 
 * and false otherwise.
 */
export const isGitRepo = async (filepath: fs.PathLike): Promise<boolean> => {
  const stats = await io.extractStats(filepath);
  const directory = stats?.isDirectory() ? filepath.toString() : path.dirname(filepath.toString());
  if (directory === undefined) return false;
  const gitPath = (path.basename(directory) === '.git') ? directory : path.join(directory, '/.git');
  const gitStats = await io.extractStats(gitPath);
  if (gitStats === undefined) return false;
  else return true;
};

/**
 * Parse a URL to extract Git repository name, typically based on the remote origin URL.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns The repository name (e.g. 'username/repo').
 */
export const extractRepoName = (url: URL | string): string => {
  const parsedPath = (typeof url === 'string') ? parsePath(url) : parsePath(url.href);
  return parsedPath.pathname.replace(/^(\/*)(?:snippets\/)?/, '').replace(/\.git$/, '');
};

/**
 * Parse a URL to extract components and protocols, along with the OAuth resource authority 
 * (GitHub, BitBucket, or GitLab) for processing with the isomorphic-git library module.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns A JavaScript object (key-value) with the parsePath.ParsedPath object and OAuth resource name.
 */
export const extractFromURL = (url: URL | string): { url: parsePath.ParsedPath; oauth: Repository['oauth'] } => {
  const parsedPath = (typeof url === 'string') ? parsePath(url) : parsePath(url.href);
  let oauth: Repository['oauth'] = 'github';
  switch (parsedPath.resource) {
    case (parsedPath.resource.match(/github\.com/) ? parsedPath.resource : undefined):
      oauth = 'github';
      break;
    case (parsedPath.resource.match(/bitbucket\.org/) ? parsedPath.resource : undefined):
      oauth = 'bitbucket';
      break;
    case (parsedPath.resource.match(/gitlab.*\.com/) ? parsedPath.resource : undefined):
      oauth = 'gitlab';
      break;
  }
  return { url: parsedPath, oauth: oauth };
}

/**
 * Examines a Repository object to determine if it is well-formed. The `id` field is validated to be compliant 
 * with UUID version 4 (RFC4122), the `corsProxy` and `url` fields are validated to be well-formed HTTP or 
 * HTTPS URI (RFC3986), or valid SSH URI (Provisional IANA format standard) in the case of the `url` field.
 * @param repo A Repository object.
 * @return A boolean indicating a well-formed Repository on true, and false otherwise.
 */
export const isValidRepository = (repo: Repository): boolean => (
  isUUID(repo.id, 4)
  && repo.name.length > 0
  && (isWebUri(repo.corsProxy.href) ? true : false)
  && ((isWebUri(repo.url.href) ? true : false) || (/((git|ssh?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(repo.url.href)))
);

/**
 * Checks for ssh or git protocols in use within a URL and converts to http/https. This is directly needed in order
 * to support **isomorphic-git** commands that require a URL, but do not currently support ssh or git protocols. See
 * https://github.com/isomorphic-git/isomorphic-git/issues/665 or https://github.com/isomorphic-git/isomorphic-git/issues/231.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns A string containing an https protocol URL that matches to the incoming URL variant.
 */
export const resolveURL = (url: parsePath.ParsedPath): string => {
  const isSSH = /((git|ssh?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(url.href);
  return isSSH ? toHTTPS(url.href) : url.href;
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