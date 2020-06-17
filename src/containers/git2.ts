import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import * as path from 'path';
import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import parsePath from 'parse-path';
import isUUID from 'validator/lib/isUUID';
import { isWebUri } from 'valid-url';

import * as io from './io';
import { Repository, NarrowType, Metafile, Error, UUID, Card } from '../types';
import { RootState } from '../store/root';
import { extractFromURL } from './git';
import { Action, ActionKeys } from '../store/actions';
import { getMetafile } from './metafile2';

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
 * Find the root Git directory. Starting at filepath, walks upward until it finds a directory that 
 * contains a *.git* subdirectory.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Promise object containing the root Git directory path, or undefined if no root Git
 * directory exists for the filepath (i.e. the filepath is not part of a Git repo).
 */
export const getRepoRoot = async (filepath: fs.PathLike) => {
  try {
    const root = await isogit.findRoot({ fs: fs, filepath: filepath.toString() });
    return root;
  }
  catch (e) {
    return undefined;
  }
};

/**
 * Parse a URL to extract Git repository name, typically based on the remote origin URL.
 * @param url The URL to evaluate; can use http, https, ssh, or git protocols.
 * @returns The repository name (e.g. 'username/repo').
 */
export const extractRepoName = (url: URL | string) => {
  const parsedPath = (typeof url === 'string') ? parsePath(url) : parsePath(url.href);
  return parsedPath.pathname.replace(/^(\/*)(?:snippets\/)?/, '').replace(/\.git$/, '');
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
};

/**
 * Examines a Repository object to determine if it is well-formed. The `id` field is validated to be compliant 
 * with UUID version 4 (RFC4122), the `corsProxy` and `url` fields are validated to be well-formed HTTP or 
 * HTTPS URI (RFC3986).
 * @param repo A Repository object
 * @return A boolean indicating a well-formed Repository on true, and false otherwise.
 */
export const isValidRepository = (repo: Repository): boolean => (
  isUUID(repo.id, 4)
  && repo.name.length > 0
  && (isWebUri(repo.corsProxy.href) ? true : false)
  && (isWebUri(repo.url.href) ? true : false)
);

/**
 * Action Creator for composing a valid ADD_REPO Redux Action.
 * @param repo A Repository object containing a valid UUID.
 * @return An `AddRepoAction` object that can be dispatched via Redux.
 */
const addRepository = (repo: Repository): NarrowType<Action, ActionKeys.ADD_REPO> => {
  return {
    type: ActionKeys.ADD_REPO,
    id: repo.id,
    repo: repo
  }
}

/**
 * Action Creator for composing a valid UPDATE_REPO Redux Action. If the current Redux store does not contain a 
 * matching repository (based on UUID) for the passed parameter, then dispatching this action will not result in any
 * changes in the Redux store state.
 * @param repo A Repository object containing new field values to be updated.
 * @return An `UpdateRepoAction` object that can be dispatched via Redux.
 */
const updateRepository = (repo: Repository): NarrowType<Action, ActionKeys.UPDATE_REPO> => {
  return {
    type: ActionKeys.UPDATE_REPO,
    id: repo.id,
    repo: repo
  }
}

/**
 * Action Creator for composing a valid ADD_ERROR Redux Action.
 * @param metafile A `Metafile` object that does not contain a valid `handler` field.
 * @return An `AddErrorAction` object that can be dispatched via Redux.
 */
const repositoryMissingError = (metafile: Metafile): NarrowType<Action, ActionKeys.ADD_ERROR> => {
  const error: Error = {
    id: v4(),
    type: 'RepositoryMissingError',
    target: metafile.id,
    message: `Repository missing for metafile '${metafile.name}'`
  };
  return {
    type: ActionKeys.ADD_ERROR,
    id: error.id,
    error: error
  };
}

/**
 * Thunk Action Creator for examining and updating the list of Git branch refs associated with a Repository
 * in the Redux store. Any local or remote branches are captured and added to the Repository `refs` field,
 * and the Redux store is updated.
 * @param root The root Git directory path associated with the `Repository` object.
 * @param repo The `Repository` object that needs to be updated with the latest branch `refs` list.
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and return the updated `Repository object 
 * from the Redux store.
 */
export const updateBranches = (root: PathLike, repo: Repository): ThunkAction<Promise<Repository>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const remoteBranches = root ? await isogit.listBranches({ fs: fs, dir: root.toString(), remote: 'origin' }) : undefined;
    const localBranches = root ? await isogit.listBranches({ fs: fs, dir: root.toString() }) : undefined;
    const branches = (remoteBranches && localBranches) ? localBranches.concat(remoteBranches.filter(remote => localBranches.indexOf(remote) < 0)) : [];
    dispatch(updateRepository({ ...repo, refs: branches }));
    return getState().repos[repo.id];
  };

/**
* Action Creator for composing a valid UPDATE_CARD Redux Action. If the current Redux store does not contain a
* matching card (based on UUID) for the passed parameter, then dispatching this action will not result in any
* changes in the Redux state.
* @param card A `Card` object containing new field values to be updated.
* @return An `UpdateCardAction` object that can be dispatched via Redux.
*/
const switchCardMetafile = (card: Card, metafile: Metafile): NarrowType<Action, ActionKeys.UPDATE_CARD> => {
  return {
    type: ActionKeys.UPDATE_CARD,
    id: card.id,
    card: {
      ...card,
      name: metafile.name,
      modified: metafile.modified,
      related: [metafile.id]
    }
  }
}

export const checkoutRef = (metafile: Metafile, ref: string, cardId: UUID): ThunkAction<Promise<Metafile>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const repo = metafile.repo ? getState().repos[metafile.repo] : undefined;
    if (!repo) dispatch(repositoryMissingError(metafile));
    if (repo && metafile.path) {
      console.log(`isomorphic-git.checkout(dir: ${repo.root.toString()})`);
      // await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: ref, remote: 'refs/heads', filepaths: [metafile.path.toString()] });
      await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: ref });
      console.log(`checkout complete...`);
      const updatedMetafile = await dispatch(getMetafile(metafile.path));
      dispatch(switchCardMetafile(getState().cards[cardId], updatedMetafile));
    }
    return getState().metafiles[metafile.id];
  };


/**
 * Thunk Action Creator for retrieving a `Repository` object associated with the given filepath. If the filepath is not under version
 * control (i.e. not contained within a Git repository), or the associated Git repository is not well-formed, then no valid
 * response can be given. Otherwise, the correct Repository object is returned and the Redux store is updated to include any
 * repositories that were previously unknown.
 * @param filepath The relative or absolute path to evaluate.
 * @return  A Thunk that can be executed to simultaneously dispatch Redux updates (as needed) and retrieve a `Repository` object;
 * or undefined if filepath is not part of a valid Git repository.
 */
export const getRepository = (filepath: PathLike): ThunkAction<Promise<Repository | undefined>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const root = await getRepoRoot(filepath);
    if (!root) return undefined; // if there is no root, then filepath is not under version control

    const repos = Object.values(getState().repos);
    const remoteOriginUrls: string[] | undefined = root ? await isogit.getConfigAll({ fs: fs, dir: root.toString(), path: 'remote.origin.url' }) : undefined;
    const { url, oauth } = (remoteOriginUrls && remoteOriginUrls?.length > 0) ? extractFromURL(remoteOriginUrls[0]) : { url: undefined, oauth: undefined };
    const existing = url ? repos.find(r => r.name === extractRepoName(url.href) && r.url.href === url.href) : undefined;
    if (existing) return dispatch(updateBranches(root, existing)); // the associated repository is already available in the Redux store

    const username = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'user.name' }) : undefined;
    const password = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'credential.helper' }) : undefined;
    const repo: Repository = {
      id: v4(),
      name: url ? extractRepoName(url.href) : '',
      root: root,
      corsProxy: new URL('https://cors-anywhere.herokuapp.com'),
      url: url ? url : parsePath(''),
      refs: [],
      oauth: oauth ? oauth : 'github',
      username: username ? username : '',
      password: password ? password : '',
      token: ''
    }

    if (isValidRepository(repo)) {
      dispatch(addRepository(repo));
      return dispatch(updateBranches(root, repo));
    }
    return undefined; // the constructed repository was malformed and not added to the Redux store
  };