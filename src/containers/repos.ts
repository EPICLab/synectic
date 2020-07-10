import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import { PathLike } from 'fs-extra';
import { ThunkAction } from 'redux-thunk';
import { Repository, NarrowType, Card, Metafile, Error, UUID } from '../types';
import { RootState } from '../store/root';
import { AnyAction } from 'redux';
import { getRepoRoot, isValidRepository, extractRepoName, extractFromURL } from './git';
import { v4 } from 'uuid';
import parsePath from 'parse-path';
import { Action, ActionKeys } from '../store/actions';
import { getMetafile } from './metafiles';

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
* Action Creator for composing a valid UPDATE_CARD Redux Action which updates the associated Metafile information.
* @param card A `Card` object containing new field values to be updated.
* @param metafile: A `Metafile` object that represents the new metafile information for the card.
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

/**
 * Thunk Action Creator for examining and updating the list of Git branch refs associated with a Repository
 * in the Redux store. Any local or remote branches are captured and added to the associated fields in the
 *  Repository, and the Redux store is updated to reflect these changes.
 * @param root The root Git directory path associated with the `Repository` object.
 * @param repo The `Repository` object that needs to be updated with the latest branch `refs` list.
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and return the updated `Repository object 
 * from the Redux store.
 */
export const updateBranches = (repo: Repository): ThunkAction<Promise<Repository>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const localBranches = await isogit.listBranches({ fs: fs, dir: repo.root.toString() });
    const remoteBranches = await isogit.listBranches({ fs: fs, dir: repo.root.toString(), remote: 'origin' });
    dispatch(updateRepository({ ...repo, local: localBranches, remote: remoteBranches }));
    return getState().repos[repo.id];
  };

/**
* Thunk Action Creator for switching Git branches (or commit hash) and updating the associated metafile and card. Multiple cards
* can be associated with a single metafile, therefore switching branches requires a new (or at least different) metafile that
* refers to a new combination of `Repository` and `ref`.
* @param metafile A `Metafile` object containing information necessary for switching Git branches.
* @param branch Git branch name or commit hash; defaults to 'master'.
* @param cardId The UUID associated with the original metafile, and updated to refer to the updated metafile.
* @param progress Boolean switch to print phase progress information from `isomorphic-git.checkout()` to console
* @return An updated `Metafile` after all Redux Actions have been dispatched.
*/
export const checkoutBranch = (metafile: Metafile, branch: string, cardId: UUID, progress?: boolean): ThunkAction<Promise<Metafile>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const repo = metafile.repo ? getState().repos[metafile.repo] : undefined;
    if (!repo) dispatch(repositoryMissingError(metafile));
    if (repo && metafile.path) {
      const baseRef = metafile.branch;
      if (progress) await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: branch, onProgress: (e) => console.log(e.phase) });
      else await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: branch });

      const updatedMetafile = await dispatch(getMetafile(metafile.path));
      dispatch(switchCardMetafile(getState().cards[cardId], updatedMetafile));

      // after updating the metafile, we need to switch the branch back
      await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: baseRef });
      console.log(`checkout complete...`);
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
    if (existing) return dispatch(updateBranches(existing)); // the associated repository is already available in the Redux store

    const username = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'user.name' }) : undefined;
    const password = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'credential.helper' }) : undefined;
    const repo: Repository = {
      id: v4(),
      name: url ? extractRepoName(url.href) : '',
      root: root,
      corsProxy: new URL('https://cors-anywhere.herokuapp.com'),
      url: url ? url : parsePath(''),
      local: [],
      remote: [],
      oauth: oauth ? oauth : 'github',
      username: username ? username : '',
      password: password ? password : '',
      token: ''
    }

    if (isValidRepository(repo)) {
      dispatch(addRepository(repo));
      return dispatch(updateBranches(repo));
    }
    return undefined; // the constructed repository was malformed and not added to the Redux store
  };