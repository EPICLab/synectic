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
 * Determines the Git tracking status of a specific file.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing a status indicator for whether a file has been changed; the possible 
 * resolve values are:
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
export const getStatus = async (filepath: fs.PathLike): Promise<GitStatus> => {
  // isomorphic-git.status() does not handle directories, per: https://github.com/isomorphic-git/isomorphic-git/issues/13
  // TODO: we currently returned a status of `unmodified` for directories, but need to implement a isomorphic-git.statusMatrix() path for directories
  if (io.isDirectory(filepath)) return 'unmodified';
  const repoRoot = await getRepoRoot(filepath);
  return isogit.status({ fs: fs, dir: repoRoot ? repoRoot : '/', filepath: path.relative(repoRoot ? repoRoot : '/', filepath.toString()) });
}

/**
 * Find the root Git directory. Starting at filepath, walks upward until it finds a directory that 
 * contains a *.git* subdirectory.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root Git directory path, or undefined if no root Git
 * directory exists for the filepath (i.e. the filepath is not part of a Git repo).
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
 * Recursively finds all values within a given nested object that correspond to a given key. 
 * @param obj The nested object to traverse. 
 * @param keyToFind The key to use to search for corresponding values. 
 * @return A ConcatArray<never> array of all the values within the given object corresponding to the given key. 
 */
const findAllByKey = (obj: parseGitConfig.Config, keyToFind: string): ConcatArray<never> => {
  return Object.entries(obj)
    .reduce((acc, [key, value]) => (key === keyToFind)
      ? acc.concat(value)
      : (typeof value === 'object')
        ? acc.concat(findAllByKey(value, keyToFind))
        : acc
      , [])
}

/** 
 * Finds the global .gitconfig file path, then asynchronously constructs a parseGitConfig.Config object containing all of the fields 
 * found within the global .gitconfig file in a format similar to JSON. 
 * @return A parseGitConfig.Config object containing the entire .gitconfig layout, or NULL if the process fails. 
 */
const getGlobalGitAuthorInfo = async () => {
  const globalGitConfigPath = getGitConfigPath('global');
  const parsedConfig = await parseGitConfig({
    path: globalGitConfigPath
  });
  return parsedConfig;
};

/**
 * Replaces a given gitConfig key value with another given value.
 * @param obj The gitConfig object to overwrite. 
 * @param path The key within gitConfig to overwrite. 
 * @param val The value to replace the given key's value with. 
 */
const replaceObjKey = (obj: parseGitConfig.Config, path: string, val: string | boolean | number | undefined) => {
  const pathPieces = path.split(".");
  if (obj) {
    path.split('.')
      .reduce(
        (acc, curr) => {
          if (acc[curr] === undefined && curr !== pathPieces[pathPieces.length - 1]) acc[curr] = {};

          if (curr === pathPieces[pathPieces.length - 1]) acc[curr] = val;

          return acc[curr];
        }, obj);
  }
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
  const pathPieces = path.split(".");
  const gitConfig = await getGlobalGitAuthorInfo();

  if (gitConfig) {
    const configInfo = findAllByKey(gitConfig, pathPieces[pathPieces.length - 1]);
    if (configInfo.length > 0) return configInfo[0];
  }

  // If above fails, return undefined
  return undefined;
};

/**
 * Override version of isomorphic-git's setConfig function. Depending in the value of the which parameter, it writes to either 
 * the local .gitconfig file (which == 0), the global .gitconfig file (which == 1), or both (which == 2).
 * @param path The key of the git config entry. 
 * @param val The value to store at the provided path. Use undefined to delete the entry. 
 * @param which Specifies whether the value should be written to the local or global file, or both. 
 * @param dir The local working tree directory path. Optional in the case of writing only to the global .gitconfig file. 
 * @return Resolves successfully when the operation is completed. 
 */
export const setConfig = async (path: string, val: string | boolean | number | undefined, which: number, dir?: fs.PathLike): Promise<void> => {
  // Write to local .gitconfig file
  if (dir && (which == 0 || which == 2)) {
    await isogit.setConfig({ fs: fs, dir: dir.toString(), path: path, value: val });
  }

  // Write to global .gitconfig file
  if (which == 1 || which == 2) {
    const gitConfig = await getGlobalGitAuthorInfo();
    if (!gitConfig) return;
    const globalGitConfigPath = getGitConfigPath('global');

    // Replace the given key with the given value
    replaceObjKey(gitConfig, path, val);

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
};