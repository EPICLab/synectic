import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import * as path from 'path';
import parsePath from 'parse-path';
import isUUID from 'validator/lib/isUUID';
import { isWebUri } from 'valid-url';
import parseGitConfig from 'parse-git-config';
import getGitConfigPath from 'git-config-path';

import * as io from './io';
import { Repository, GitStatus } from '../types';
import { shouldBeHiddenSync } from 'hidefile';

export type BranchDiffResult = {
  path: string,
  type: 'equal' | 'modified' | 'added' | 'removed'
}

/**
 * Get the name of the branch currently pointed to by *.git/HEAD*; this function is a wrapper to inject the 
 * fs parameter in to the *isomorphic-git/currentBranch* function.
 * @param dir The working tree directory path.
 * @param gitdir The git directory path.
 * @param fullname Boolean option to return the full path (e.g. "refs/heads/master") instead of the 
 * abbreviated form.
 * @param test Boolean option to return 'undefined' if the current branch doesn't actually exist 
 * (such as 'master' right after git init).
 * @return A Promise object containing the current branch name, or undefined if the HEAD is detached.
 */
export const currentBranch = ({ dir, gitdir, fullname, test }: {
  dir?: string;
  gitdir?: string;
  fullname?: boolean;
  test?: boolean;
}): Promise<string | void> => isogit.currentBranch({ fs: fs, dir: dir, gitdir: gitdir, fullname: fullname, test: test });

/**
 * Show the commit delta between two branches (i.e. the commits not contained in the overlapping subset). Although git refers
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
 * @return A Promise object containing a list of file paths and a status indicator, where the possible status values for each file are:
 *
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"equal"`             | file is unchanged between both branches                                               |
 * | `"modified"`          | file has modifications, but exists in both branches                                   |
 * | `"added"`             | file does not exist in branch A, but was added in branch B                            |
 * | `"removed"`           | file exists in branch A, but was removed in branch B                                  |
 */
export const branchDiff = async (dir: fs.PathLike, branchA: string, branchB: string, filter?: (result: BranchDiffResult) => boolean): Promise<BranchDiffResult[]> => {
  const hashA = (await isogit.log({ fs: fs, dir: dir.toString(), ref: `heads/${branchA}`, depth: 1 }))[0].oid;
  const hashB = (await isogit.log({ fs: fs, dir: dir.toString(), ref: `heads/${branchB}`, depth: 1 }))[0].oid;
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
 * Merge things...
 * @param base 
 * @param compare 
 * @param dryRun 
 */
export const merge = async (dir: fs.PathLike, base: string, compare: string, dryRun?: boolean): Promise<isogit.MergeResult & { missingConfigs?: string[] }> => {
  if (dryRun) {
    const name: { path: string, value: string | undefined } = { path: 'user.name', value: await isogit.getConfig({ fs: fs, dir: dir.toString(), path: 'user.name' }) };
    const email: { path: string, value: string | undefined } = { path: 'user.email', value: await isogit.getConfig({ fs: fs, dir: dir.toString(), path: 'user.email' }) };
    const missing: string[] = [name, email].filter(config => typeof config.value !== 'undefined').map(config => config.path);
    const mergeResult = await isogit.merge({ fs: fs, dir: dir.toString(), ours: base, theirs: compare, dryRun: true });
    const final = { missingConfigs: missing, ...mergeResult };
    return final;
  }

  return await isogit.merge({ fs: fs, dir: dir.toString(), ours: base, theirs: compare });
}

/**
 * Determines the Git tracking status of a specific file or directory path.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing undefined if the path is not contained within a Git repository, or a status indicator 
 * for whether the path has been changed according to Git; the possible resolve values are:
 *
 * | status                | description                                                                           |
 * | --------------------- | ------------------------------------------------------------------------------------- |
 * | `"ignored"`           | file ignored by a .gitignore rule                                                     |
 * | `"unmodified"`        | file unchanged from HEAD commit                                                       |
 * | `"*modified"`         | file has modifications, not yet staged                                                |
 * | `"*deleted"`          | file has been removed, but the removal is not yet staged                              |
 * | `"*added"`            | file is untracked, not yet staged                                                     |
 * | `"absent"`            | file not present in HEAD commit, staging area, or working dir                         |
 * | `"modified"`          | file has modifications, staged                                                        |
 * | `"deleted"`           | file has been removed, staged                                                         |
 * | `"added"`             | previously untracked file, staged                                                     |
 * | `"*unmodified"`       | working dir and HEAD commit match, but index differs                                  |
 * | `"*absent"`           | file not present in working dir or HEAD commit, but present in the index              |
 * | `"*undeleted"`        | file was deleted from the index, but is still in the working dir                      |
 * | `"*undeletemodified"` | file was deleted from the index, but is present with modifications in the working dir |
 */
export const getStatus = async (filepath: fs.PathLike): Promise<GitStatus | undefined> => {
  const repoRoot = await getRepoRoot(filepath);
  if (!repoRoot) return undefined; // no root Git directory indicates that the filepath is not part of a Git repo
  // isomorphic-git provides `status()` for individual files, but requires `statusMatrix()` for directories 
  // (per: https://github.com/isomorphic-git/isomorphic-git/issues/13)
  const isDirectory = await io.isDirectory(filepath);
  if (isDirectory) {
    const statuses = await isogit.statusMatrix({ fs: fs, dir: repoRoot ? repoRoot : '/', filter: f => !shouldBeHiddenSync(f) });
    const changed = statuses
      .filter(row => row[1] !== row[2])   // filter for files that have been changed since the last commit
      .map(row => row[0]);                // return the filenames only
    return (changed.length > 0) ? 'modified' : 'unmodified';
  }
  return isogit.status({ fs: fs, dir: repoRoot ? repoRoot : '/', filepath: path.relative(repoRoot ? repoRoot : '/', filepath.toString()) });
}

/**
 * Find the root Git directory. Starting at filepath, walks upward until it finds a directory that 
 * contains a *.git* subdirectory.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root Git directory path, or undefined if no root Git
 * directory exists for the filepath (i.e. the filepath is not part of a Git repository).
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
 * @return A Promise object containing true if filepath contains a .git subdirectory (or points 
 * directly to the .git directory), and false otherwise.
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
 * @param repo A Repository object
 * @return A boolean indicating a well-formed Repository on true, and false otherwise.
 */
export const isValidRepository = (repo: Repository): boolean => (
  isUUID(repo.id, 4)
  && repo.name.length > 0
  && (isWebUri(repo.corsProxy.href) ? true : false)
  && ((isWebUri(repo.url.href) ? true : false) || (/((git|ssh?)|(git@[\w.]+))(:(\/\/)?)([\w.@:/\-~]+)(\.git)(\/)?/.test(repo.url.href)))
);

/** 
 * Recursively searches all keys within a JSON-like structure (including JavaScript Objects) and returns the matches as an 
 * array of the corresponding values.
 * @param obj The nested object to traverse. 
 * @param keyToFind The key to use to search for corresponding values. 
 * @return A string array of all the values within the given object corresponding to the given key. 
 */
const findAllByKey = (obj: parseGitConfig.Config, keyToFind: string): string[] => {
  return Object.entries(obj)
    .reduce((acc: string[], [key, value]) => (key === keyToFind)
      ? acc.concat(value)
      : (typeof value === 'object')
        ? acc.concat(findAllByKey(value, keyToFind))
        : acc
      , []);
}

/** 
 * Finds the global .gitconfig file path, then asynchronously constructs a parseGitConfig.Config object containing all of the fields 
 * found within the global .gitconfig file in a format similar to JSON. 
 * @return A parseGitConfig.Config object containing the entire .gitconfig layout, or NULL if the process fails. This return type is
 * from the parse-git-config library, which can be found here: https://www.npmjs.com/package/parse-git-config.
 */
const getGlobalGitConfig = async () => {
  const globalGitConfigPath = getGitConfigPath('global');
  const parsedConfig = await parseGitConfig({
    path: globalGitConfigPath
  });
  return parsedConfig;
};

/**
 * Replaces the global gitConfig key value with another given value.
 * @param obj The gitConfig object to overwrite. 
 * @param path The key within gitConfig to overwrite. 
 * @param val The value to replace the given key's value with. 
 * @return A parseGitConfig.Config object containing the entire .gitconfig layout, or NULL if the process fails. This return type is
 * from the parse-git-config library, which can be found here: https://www.npmjs.com/package/parse-git-config.
 */
const replaceObjKey = async (path: string, val: string | boolean | number | undefined) => {
  if (!path.includes(".")) return null;

  const gitConfig = await getGlobalGitConfig();
  if (!gitConfig) return null;

  const pathPieces = path.split(".");
  const lastPiece = pathPieces[pathPieces.length - 1];

  pathPieces
    .reduce(
      (acc, curr) => {
        if (acc[curr] === undefined && curr !== lastPiece) acc[curr] = {};

        if (curr === lastPiece) acc[curr] = val;

        return acc[curr];
      }, gitConfig);

  return gitConfig;
}

/**
 * Replaces the value of the corresponding given gitconfig key path with the given value. Then, correctly formats a string from the updated
 * gitconfig object to write to the global .gitconfig file. 
 * @param path The key of the git config entry.
 * @param val The value to store at the provided path. Use undefined to delete the entry. 
 */
const setGlobalGitConfig = async (path: string, val: string | boolean | number | undefined) => {
  const globalGitConfigPath = getGitConfigPath('global');

  // Replace the given key with the given value
  const gitConfig = await replaceObjKey(path, val);
  if (!gitConfig) return;

  // Iterate over the gitConfig object and format the string correctly
  let reWrite = "";
  for (const header in gitConfig) {
    reWrite += `[${header}]\n`;
    for (const property in gitConfig[header]) {
      if (gitConfig[header][property]) reWrite += `${property} = ${gitConfig[header][property]}\n`;
    }
  }

  // Overwrite the global .gitconfig file
  io.writeFileAsync(globalGitConfigPath, reWrite);
}

/**
 * Override version of isomorphic-git's getConfig function. First checks for the provided path in the local .gitconfig file. Failing that,
 * it checks for the provided path in the global .gitconfig file. If that also fails, it returns undefined. 
 * @param dir The working tree directory path.
 * @param path The key of the git config entry.
 * @return A promise for either the requested git config entry, or undefined. 
 */
export const getConfig = async (dir: fs.PathLike, path: string): Promise<string | undefined> => {
  // Check local .gitconfig file
  const result = await isogit.getConfig({ fs: fs, dir: dir.toString(), path: path });
  if (result) return result;

  // If above fails, check global .gitconfig file
  const gitConfig = await getGlobalGitConfig();

  if (gitConfig) {
    const configInfo = findAllByKey(gitConfig, path.split(".")[-1]);
    if (configInfo.length > 0) return configInfo[0];
  }

  // If above fails, return undefined
  return undefined;
};

/**
 * Override version of isomorphic-git's setConfig function. First, it checks for the provided path in the local .gitconfig file to replace. If it 
 * isn't found, it checks the global .gitconfig file. If it still isn't found, it may add a new entry depending on the value of the newEntry 
 * parameter. If newEntry == 'local', it adds the entry to the local .gitconfig file. If newEntry == 'global', it adds the entry to the global 
 * .gitconfig file. If newEntry is undefined, this function does nothing and returns. If the val parameter is undefined, it deletes the entry.
 * @param path The key of the git config entry. 
 * @param val The value to store at the provided path. Use undefined to delete the entry. 
 * @param dir The local working tree directory path. 
 * @param newEntry A string indicating where a new entry should be added. If undefined, no new entry shall be added. 
 * @return Resolves successfully when the operation is completed. 
 */
export const setConfig = async (path: string, val: string | boolean | number | undefined, dir: fs.PathLike, newEntry?: 'local' | 'global'): Promise<void> => {
  // If the path is found in the local .gitconfig file provided in dir, then replace the corresponding value with val
  const local = await isogit.getConfig({ fs: fs, dir: dir.toString(), path: path });
  if (local) {
    await isogit.setConfig({ fs: fs, dir: dir.toString(), path: path, value: val });
    return;
  }

  // If the above fails, then try and find the path in the global .gitconfig file and replace that corresponding value with val
  const global = await getConfig(dir, path);
  if (global) {
    setGlobalGitConfig(path, val);
    return;
  }

  // If the path cannot be found anywhere, then add it to either the local or global .gitconfig depending on the newEntry parameter
  if (newEntry == 'local') {
    await isogit.setConfig({ fs: fs, dir: dir.toString(), path: path, value: val });
    return;
  }

  if (newEntry == 'global') {
    setGlobalGitConfig(path, val);
    return;
  }

  // If the path cannot be found and newEntry is not set, then just return
  return;
};