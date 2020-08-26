import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import { PathLike } from 'fs-extra';
import { ThunkAction } from 'redux-thunk';
import { Repository, Card, Metafile, Error, UUID } from '../types';
import { RootState } from '../store/root';
import { AnyAction } from 'redux';
import { getRepoRoot, isValidRepository, extractRepoName, extractFromURL } from './git';
import { v4 } from 'uuid';
import parsePath from 'parse-path';
import { ActionKeys, NarrowActionType, Action } from '../store/actions';
import { getMetafile, metafileMissingError } from './metafiles';

type AsyncThunkUpdateRepoAction = ThunkAction<Promise<NarrowActionType<ActionKeys.UPDATE_REPO> | undefined>, RootState, undefined, Action>;

/**
 * Action Creator for composing a valid ADD_REPO Redux Action.
 * @param repo A Repository object containing a valid UUID.
 * @return An `AddRepoAction` object that can be dispatched via Redux.
 */
const addRepository = (root: string, { url, oauth }: Partial<ReturnType<typeof extractFromURL>>, username?: string, password?: string):
  NarrowActionType<ActionKeys.ADD_REPO | ActionKeys.ADD_ERROR> => {
  const repo: Repository = {
    id: v4(),
    name: url ? extractRepoName(url.href) : '',
    root: root,
    corsProxy: new URL('https://cors-anywhere.herokuapp.com'), // TODO: This is just a stubbed URL for now, but eventually we need to support Cross-Origin Resource Sharing (CORS) since isomorphic-git requires it
    url: url ? url : parsePath(''),
    local: [],
    remote: [],
    oauth: oauth ? oauth : 'github',
    username: username ? username : '',
    password: password ? password : '',
    token: ''
  };
  if (!isValidRepository(repo)) return malformedRepositoryError(repo);
  return {
    type: ActionKeys.ADD_REPO,
    id: repo.id,
    repo: repo
  };
}

/**
 * Action Creator for composing a valid UPDATE_REPO Redux Action. If the current Redux store does not contain a 
 * matching repository (based on UUID) for the passed parameter, then dispatching this action will not result in any
 * changes in the Redux store state.
 * @param repo A Repository object containing new field values to be updated.
 * @return An `UpdateRepoAction` object that can be dispatched via Redux.
 */
const updateRepository = (repo: Repository): NarrowActionType<ActionKeys.UPDATE_REPO> => {
  return {
    type: ActionKeys.UPDATE_REPO,
    id: repo.id,
    repo: repo
  }
}

/**
 * Action Creator for composing a valid ADD_ERROR Redux Action for malformed repositories.
 * @param metafile A `Repository` object that does not adhere to the requirements for id, name, and the URLS for
 * repository remote and CORS proxy associated with a specific repository.
 * @return An `AddErrorAction` object that can be dispatched via Redux.
 */
const malformedRepositoryError = (repo: Repository): NarrowActionType<ActionKeys.ADD_ERROR> => {
  const error: Error = {
    id: v4(),
    type: 'MalformedRepositoryError',
    target: repo.id,
    message: `Malformed repository '${repo.name}' cannot be added to the Redux store`
  };
  return {
    type: ActionKeys.ADD_ERROR,
    id: error.id,
    error: error
  };
}

/**
 * Action Creator for composing a valid ADD_ERROR Redux Action for missing repositories.
 * @param metafile A `Metafile` object that does not contain a valid `repo' field.
 * @return An `AddErrorAction` object that can be dispatched via Redux.
 */
const repositoryMissingError = (metafile: Metafile): NarrowActionType<ActionKeys.ADD_ERROR> => {
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
* Action Creator for composing a valid UPDATE_CARD Redux Action which changes the Metafile associated with the card.
* @param card A `Card` object containing new field values to be updated.
* @param metafile: A `Metafile` object that represents the new metafile information for the card.
* @return An `UpdateCardAction` object that can be dispatched via Redux.
*/
const switchCardMetafile = (card: Card, metafile: Metafile): NarrowActionType<ActionKeys.UPDATE_CARD> => {
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
export const updateBranches = (id: UUID): AsyncThunkUpdateRepoAction =>
  async (dispatch, getState) => {
    const repo = getState().repos[id];
    if (!repo) throw new Error('Redux Error: Cannot update a repository that does not exist in the store.');
    const localBranches = await isogit.listBranches({ fs: fs, dir: repo.root.toString() });
    const remoteBranches = await isogit.listBranches({ fs: fs, dir: repo.root.toString(), remote: 'origin' });
    return dispatch(updateRepository({ ...repo, local: localBranches, remote: remoteBranches }));
  };

/**
* Thunk Action Creator for switching Git branches (or commit hash) and updating the associated metafile and card. Multiple cards
* can be associated with a single metafile, therefore switching branches requires a new (or at least different) metafile that
* refers to a new combination of `Repository` and `ref`. Since `isomorphic-git.checkout()` switches all files within a repository,
* we switch to the target branch and read the specific file, before switching back to the original branch.
* @param cardId The UUID associated with the card that will display the updated content.
* @param metafileId The UUID associated with the original metafile.
* @param branch Git branch name or commit hash; defaults to 'master'.
* @param progress Boolean switch to print phase progress information from `isomorphic-git.checkout()` to console.
* @return An Thunk that can be executed to get a Metafile associated with a new Git branch and updates the card.
*/
export const checkoutBranch = (cardId: UUID, metafileId: UUID, branch: string, progress?: boolean):
  ThunkAction<Promise<Metafile | undefined>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    if (!getState().cards[cardId]) throw new Error('Redux Error: Cannot update a card that does not exist in the store.');
    const metafile = getState().metafiles[metafileId];
    if (!metafile) throw new Error('Redux Error: Cannot update a metafile that does not exist in the store.');

    const repo = metafile.repo ? getState().repos[metafile.repo] : undefined;
    if (!repo) dispatch(repositoryMissingError(metafile));
    if (repo && metafile.path) {
      const baseRef = metafile.branch;
      // change the repository branch to the new branch
      if (progress) await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: branch, onProgress: (e) => console.log(e.phase) });
      else await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: branch });

      // get an updated metafile based on the new branch
      const updated = await dispatch(getMetafile({ filepath: metafile.path }));
      if (!updated) {
        dispatch(metafileMissingError(metafile.path.toString()));
        return undefined;
      }
      // update the metafile details (including file content) for the card
      dispatch(switchCardMetafile(getState().cards[cardId], updated));

      // change the repository branch back to the old branch
      await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: baseRef });
      if (progress) console.log(`checkout complete...`);
    }
    return getState().metafiles[metafile.id];
  };

/**
 * Thunk Action Creator for retrieving a `Repository` object associated with the given filepath. If the filepath is not under version
 * control (i.e. not contained within a Git repository), or the associated Git repository is malformed, then no valid response can be 
 * given. Otherwise, the correct Repository object is returned and the Redux store is updated with the latest set of branches.
 * @param filepath The relative or absolute path to evaluate.
 * @return  A Thunk that can be executed to simultaneously dispatch Redux updates (as needed) and retrieve a `Repository` object, if
 * the filepath is untracked or results in a malformed Git repository then `undefined` will be returned instead.
 */
export const getRepository = (filepath: PathLike): ThunkAction<Promise<Repository | undefined>, RootState, undefined, Action> =>
  async (dispatch, getState) => {
    const root = await getRepoRoot(filepath);
    if (!root) return undefined; // if there is no root, then filepath is not under version control

    const remoteOriginUrls: string[] | undefined = root ?
      await isogit.getConfigAll({ fs: fs, dir: root.toString(), path: 'remote.origin.url' }) : undefined;
    const { url, oauth } = (remoteOriginUrls && remoteOriginUrls?.length > 0) ?
      extractFromURL(remoteOriginUrls[0]) : { url: undefined, oauth: undefined };
    const existing = url ? Object.values(getState().repos).find(r => r.name === extractRepoName(url.href) && r.url.href === url.href) : undefined;
    if (existing) {
      // the associated repository is already available in the Redux store
      await dispatch(updateBranches(existing.id));
      return getState().repos[existing.id];
    }
    const username = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'user.name' }) : undefined;
    const password = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'credential.helper' }) : undefined;

    const action = addRepository(root, { url, oauth }, username, password);
    dispatch(action); // dispatches either AddRepoAction or AddError
    if (action.type === ActionKeys.ADD_REPO) {
      await dispatch(updateBranches(action.id));
      return getState().repos[action.id];
    }
    return undefined; // the constructed repository was malformed and not added to the Redux store
  };