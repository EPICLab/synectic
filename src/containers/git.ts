import * as fs from 'fs-extra';
import * as path from 'path';
import parsePath from 'parse-path';
import * as isogit from 'isomorphic-git';
isogit.plugins.set('fs', fs);

import * as io from './io';
import { Repository } from '../types';
// import { ActionKeys, Actions } from '../store/actions';

export * from 'isomorphic-git';

/**
 * Find the root Git directory. Starting at filepath, walks upward until it finds a directory that 
 * contains a subdirectory called '.git'.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root Git directory path, or undefined if no root Git
 * directory exists for the filepath (i.e. the filepath is not part of a Git repo).
 */
export const getRepoRoot = async (filepath: fs.PathLike) => {
  try {
    const root = await isogit.findRoot({ filepath: filepath.toString() });
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
export const isGitRepo = async (filepath: fs.PathLike) => {
  const stats = await io.extractStats(filepath);
  const directory = stats?.isDirectory() ? filepath.toString() : path.dirname(filepath.toString());
  if (directory === undefined) return false;
  const gitPath = (path.basename(directory) === '.git') ? directory : path.join(directory, '/.git');
  const gitStats = await io.extractStats(gitPath);
  if (gitStats === undefined) return false;
  else return true;
}

/**
 * Parses a URL to extract components and protocols, along with the OAuth resource authority 
 * (GitHub, BitBucket, or GitLab) for processing with the isomorphic-git library module.
 * @param url The URL to evaluate; can use http, https, ssh, file, or git protocols.
 * @returns A tuple containing the parsePath.ParsedPath object and OAuth resource name.
 */
export const extractFromURL = (url: URL | string): [parsePath.ParsedPath, Repository['oauth']] => {
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
  return [parsedPath, oauth];
}

/**
 * Determines whether a specific file is currently tracked by Git version control.
 * @param filepath The relative or absolute path to evaluate.
 */
export const isGitTracked = async (filepath: fs.PathLike) => {
  const repoRoot = await getRepoRoot(filepath);
  return isogit.status({ dir: '/', gitdir: repoRoot, filepath: filepath.toString() });
}

/**
 * Checks whether a Git repository associated with a repository name and branch ref exists in the Redux state, 
 * and if not provides a Redux action to add the repository to the Redux state.
 * @param name The Git repository name (e.g. 'EPICLab/synectic'); for GitHub repos the name is 
 * composed of GitHub account name and repository name (others only use the repository name).
 * @param ref The Git branch name (e.g. 'master').
 * @param repos The list of currently known Git repositories found in the Redux state.
 * @returns A Promise object containing a 
 * 
 * Redux action for adding the new Repository object, 
 * @return A Promise that either returns a Repository object known to the Redux state, or a Redux action
 * to update the Redux state with a new Repository and returns that Repository object afterwards.
 */
export const extractRepo = async (rootDir: fs.PathLike, repos: Repository[], ref = 'HEAD') => {
  const currentBranch = await isogit.currentBranch({ dir: rootDir.toString() });
  const configs = await isogit.config({ dir: rootDir.toString(), path: 'user.name', all: true });
  console.log(`currentBranch: '${currentBranch}'`);
  console.log(`configs:`);
  console.log(configs);
  console.log(`repos:`);
  console.log(repos);
  console.log(`ref: '${ref}'`);
  /**
   * State 1: Repository exists and ref is known
   * Return a tuple containing a Repository object, and no Redux action.
   * 
   * State 2: Repository exists and ref is unknown
   * Return a tuple containing a Repository object, and a Redux action to update the refs for it.
   * 
   * State 3: No repository exists
   * Return a tuple containing a Repository object, and a Redux action to add a new repo.
   */
  // const existingRepo = repos.find(repo => repo.name === name);
  // const existingRef = existingRepo ? existingRepo.refs.some(ref => ref === ref) : false;

  // if (existingRepo && existingRef) {
  //   return [existingRepo, null];
  // }

  // if (existingRepo && !existingRef) {
  //   const action: Actions = { type: ActionKeys.UPDATE_REPO, id: existingRepo.id, repo: { refs: [...existingRepo.refs, ref] } };
  //   return [existingRepo, action];
  // }

  // const remotes = await isogit.listRemotes({ dir: root.toString() });
  // const url = remotes.length > 0 ? remotes[0].url : '';

  // const newRepo: Repository = {
  //   id: v4(),
  //   name: name,
  //   corsProxy: ?,
  //   url: ?,
  //   refs: ?,
  //   oauth: ?,
  //   username: ?,
  //   password: ?,
  //   token: ?
  // }

  // *****************************************************

  // const repo = repos.find(repo => (repo.url url && repo.refs[0] === ref))
  // repos.map(repo => console.log(repo.url.href));


  // const config = await isogit.config({ dir: root.toString(), path: 'user.name', all: true });
  // console.log(`config:`);
  // console.log(config);
  // // TODO: Figure out the correct way of matching metafile information (such as root path?) to Git repository
  // const repo = repos.find(repo => ( repo. ));
  // if (repo) console.log(repo);
  // else console.log(`repo could not be found for: '${config}'`);
}