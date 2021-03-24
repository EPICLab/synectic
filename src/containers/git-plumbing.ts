import * as fs from 'fs-extra';
import * as path from 'path';
import * as isogit from 'isomorphic-git';
import parsePath from 'parse-path';
import isUUID from 'validator/lib/isUUID';
import ignore, { Ignore } from 'ignore';
import { isWebUri } from 'valid-url';
import { toHTTPS } from 'git-remote-protocol';

import type { Repository } from '../types';
import * as io from './io';
import { isLinkedWorktree, resolveLinkToRoot } from './git-worktree';
import { getRepoRoot } from './git-porcelain';

export type BranchDiffResult = { path: string, type: 'equal' | 'modified' | 'added' | 'removed' };

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
};

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

/**
 * Resolve a ref to its SHA-1 object id for a specific filepath contained within a git branch. The response represents an oid that 
 * can be provided directly to `resolveRef` in order to obtain a blob string containing the latest version on a particular branch 
 * (i.e. for determining whether the file has diverged from the latest version in git).
 * @param dir The working tree directory path.
 * @param branch The branch to reference for resolving the indicated filepath.
* @param relativeFilepath The relative path from a git root (either linked or main worktree) to the target file.
 * @returns A Promise object containing the SHA-1 hash associated with the filepath in the latest commit on the indicated branch.
 */
export const resolveOid = async (filepath: fs.PathLike, branch: string): Promise<string | undefined> => {
  const repoRoot = await getRepoRoot(filepath);
  if (!repoRoot) return undefined;
  const dir = (await isLinkedWorktree({ dir: repoRoot })) ? (await resolveLinkToRoot(repoRoot)) : repoRoot;
  if (!dir) return undefined;

  const relativePath = path.relative(repoRoot, filepath.toString());
  const commit = await resolveRef({ dir: dir, ref: branch });
  const tree = (await isogit.readCommit({ fs: fs, dir: dir, oid: commit })).commit.tree;
  const entry = (await isogit.readTree({ fs: fs, dir: dir, oid: tree })).tree.find(entry => entry.path === relativePath);
  return entry ? entry.oid : undefined;
}

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
        console.log('Something weird happened:', { A, B });
      }

      return (!filter) || (filter && filter(result)) ? result : null;
    },
  });
  return files;
}

/**
 * Locate and parse ignore rules from all `.gitignore` files within a directory. Retuns an Ignore class instance from the
 * [`ignore`](https://github.com/kaelzhang/node-ignore) library, where `.filter` and `.ignores` functions can then be used
 * to determine whether a git command should operate on a given filepath.
 * @param dir The relative or absolute directory path to search.
 * @returns A Promise object containing a Ignore object that can be interacted with according to the 
 * [`ignore`](https://github.com/kaelzhang/node-ignore) API documentation.
 */
export const getIgnore = async (dir: fs.PathLike): Promise<Ignore> => {
  const ignoreFiles = (await io.readDirAsyncDepth(dir)).filter(filename => io.extractFilename(filename) === '.gitignore');
  const ignoreManager = ignore();
  ignoreFiles.map(async ignoreFile => {
    const content = await io.readFileAsync(ignoreFile, { encoding: 'utf-8' });
    ignoreManager.add(content);
  });
  return ignoreManager;
}