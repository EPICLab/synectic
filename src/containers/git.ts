import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import { v4 } from 'uuid';
import parsePath from 'parse-path';
import pako from 'pako';
import sha1 from 'sha1';

import * as io from './io';
import { Repository, NarrowType } from '../types';
import { ActionKeys, Action } from '../store/actions';
import { getRepoRoot, currentBranch } from './git2';

type AddOrUpdateRepoActions = NarrowType<Action, ActionKeys.ADD_REPO | ActionKeys.UPDATE_REPO>;
type RepoPayload = { repo: (Repository | undefined); action: (AddOrUpdateRepoActions | undefined); branchRef: (string | undefined) };

export * from 'isomorphic-git';

/**
 * @deprecated
 * @param filepath The relative or absolute path of a file compressed and prepended with git head and tail.
 */
export const extractGitCompressed = async (filepath: fs.PathLike): Promise<string> => {
  const rawBuffer = await io.readFileAsync(path.resolve(filepath.toString()));
  const compressed = pako.deflate(rawBuffer, { level: 1 });
  const decompressed = pako.inflate(compressed, { to: 'string' });
  return decompressed;
};

/**
 * @deprecated
 * @param input 
 */
export const base64ToUint8Array = (input: string): Uint8Array => {
  const raw = atob(input);
  const array = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) {
    array[i] = raw.charCodeAt(i);
  }
  return array;
}

/**
 * @deprecated
 * Read and return the Uint8Array representation of the file contents, which translates into an array of numbers representing
 * the binary content of the file. Good for inserting into Buffer.from() in order to mock up these *Git Object* files.
 * @deprecated Will remove in the future, since this is just syntactic sugar for constructing a mock Git-tracked project.
 * @param filepath A valid *Git Object* filename or path to read from.
 * @return A Promise object containing a Uint8Array of the binary file content.
 */
export const readGitObjectToUint8Array = async (filepath: fs.PathLike): Promise<Uint8Array> => {
  const compressed = await io.readFileAsync(filepath);
  let decompressed: Uint8Array;
  try {
    decompressed = pako.inflate(compressed);
  } catch (error) {
    decompressed = pako.inflate(pako.deflate(compressed, { level: 1 }));
  }
  return decompressed;
}

/**
 * @deprecated
 * @param filepath 
 */
export const explodeHash = async (filepath: fs.PathLike): Promise<string> => {
  const decoded = io.decompressBinaryObject(await io.readFileAsync(filepath))
  const hash = sha1(decoded);
  return hash;
}

/**
 * @deprecated
 * @param filepath 
 */
export const explodeGitFile = async (filepath: fs.PathLike): Promise<{
  file: string;
  targetHash: string;
  binary: Uint8Array;
  decoded: string;
  hash: string;
}> => {
  const targetHash = io.extractDirname(filepath) + io.extractFilename(filepath);
  const binary = await readGitObjectToUint8Array(filepath);
  const decoded = io.decompressBinaryObject(await io.readFileAsync(filepath))
  const hash = sha1(decoded);
  return { file: filepath.toString(), targetHash: targetHash, binary: binary, decoded: decoded, hash: hash };
}

/**
 * @deprecated
 * @param files 
 */
export const explodeGitFiles = async (files: fs.PathLike[]): Promise<{
  file: string;
  targetHash: string;
  binary: Uint8Array;
  decoded: string;
  hash: string;
}[]> => {
  return await Promise.all(files.map(file => explodeGitFile(file)));
};

/**
 * @deprecated
 * @param dirPath 
 */
export const pipelinePathToExploded = async (dirPath: fs.PathLike): Promise<{
  file: string;
  targetHash: string;
  binary: Uint8Array;
  decoded: string;
  hash: string;
}[]> => {
  const fsObjects = await io.readDirAsyncDeep(dirPath, false);
  const files = await io.filterReadArray(fsObjects, true);
  const gitFiles = await explodeGitFiles(files);
  return gitFiles;
}

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
export const getStatus = async (filepath: fs.PathLike): Promise<"modified" | "ignored" | "unmodified" | "*modified" | "*deleted" | "*added" | "absent" | "deleted" | "added" | "*unmodified" | "*absent" | "*undeleted" | "*undeletemodified"> => {
  const repoRoot = await getRepoRoot(filepath);
  return isogit.status({ fs: fs, dir: '/', gitdir: repoRoot, filepath: filepath.toString() });
}

/**
 * @deprecated
 * Extract all necessary Git repository metadata from the root Git directory associated with the filepath, either 
 * by locating an existing repository and branch ref in the Redux state or creating Redux actions to add and 
 * update the state as needed.
 * @param filepath The relative or absolute path to evaluate; must be resolvable to a root Git directory.
 * @param repos The list of currently known Git repositories found in the Redux store.
 * @return A Promise object for a new or existing `Repository` object related to the root Git directory of the 
 * filepath, any Redux actions that update state for either a new repository or an updated repository with a new 
 * branch ref, and the current branch ref. If the `repo` field is undefined, either no root Git directory exists 
 * or no remote origin URL has been set for the repo. If the `action` field is undefined, no updates to the Redux 
 * store are necessary.
 */
export const extractRepo = async (filepath: fs.PathLike, repos: Repository[]): Promise<RepoPayload> => {
  const rootDir = await getRepoRoot(filepath);
  if (!rootDir) return { repo: undefined, action: undefined, branchRef: undefined };
  const branchRef = await currentBranch({ dir: rootDir, fullname: false });
  const ref = branchRef ? branchRef : 'HEAD';

  const remoteOriginUrls: string[] = await isogit.getConfigAll({ fs: fs, dir: rootDir.toString(), path: 'remote.origin.url' });
  if (remoteOriginUrls.length <= 0) return { repo: undefined, action: undefined, branchRef: undefined };
  const { url, oauth } = extractFromURL(remoteOriginUrls[0]);
  const remoteBranches = await isogit.listBranches({ fs: fs, dir: rootDir.toString(), remote: 'origin' });
  const localBranches = await isogit.listBranches({ fs: fs, dir: rootDir.toString() });
  const branches = localBranches.concat(remoteBranches.filter(remote => localBranches.indexOf(remote) < 0));
  const username = await isogit.getConfig({ fs: fs, dir: rootDir.toString(), path: 'user.name' });
  const password = await isogit.getConfig({ fs: fs, dir: rootDir.toString(), path: 'credential.helper' });

  const newRepo: Repository = {
    id: v4(),
    name: extractRepoName(url.href),
    root: rootDir,
    corsProxy: new URL('https://cors-anywhere.herokuapp.com/'),
    url: url,
    refs: branches,
    oauth: oauth,
    username: username ? username : '',
    password: password ? password : '',
    token: ''
  };

  const existingRepo = repos.find(r => r.name === newRepo.name);
  const existingRef = existingRepo ? existingRepo.refs.find(r => r === ref) : undefined;

  if (existingRepo && existingRef) {
    return { repo: existingRepo, action: undefined, branchRef: ref };
  } else if (existingRepo && !existingRef) {
    const updatedRepo = { ...existingRepo, refs: [...existingRepo.refs, ref], branchRef: ref };
    return { repo: updatedRepo, action: { type: ActionKeys.UPDATE_REPO, id: existingRepo.id, repo: updatedRepo }, branchRef: ref };
  } else {
    const updatedBranches = branches.find(branch => branch === ref) ? branches : [...branches, ref];
    const updatedRepo = { ...newRepo, refs: updatedBranches };
    return { repo: updatedRepo, action: { type: ActionKeys.ADD_REPO, id: newRepo.id, repo: updatedRepo }, branchRef: ref };
  }
}