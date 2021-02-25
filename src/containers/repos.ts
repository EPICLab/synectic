import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import { PathLike } from 'fs-extra';
import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import { v4 } from 'uuid';
import parsePath from 'parse-path';
import * as path from 'path';

import type { Repository, Card, Metafile, Error, UUID } from '../types';
import * as worktree from './git-worktree';
import { RootState } from '../store/root';
import { ActionKeys, NarrowActionType, Action } from '../store/actions';
import { getMetafile } from './metafiles';
import { extractFilename, isDirectory, readFileAsync } from './io';
import { getRepoRoot, isValidRepository, extractRepoName, extractFromURL } from './git';
import { updateCard } from './cards';

type AddRepoAction = NarrowActionType<ActionKeys.ADD_REPO>;
type UpdateRepoAction = NarrowActionType<ActionKeys.UPDATE_REPO>;
type AddErrorAction = NarrowActionType<ActionKeys.ADD_ERROR>;
type UpdateCardAction = NarrowActionType<ActionKeys.UPDATE_CARD>;

/**
 * Action Creator for composing a valid ADD_REPO Redux Action.
 * @param root The relative or absolute path to the git root directory.
 * @param {url, oauth} urlProtocol The URL and type of OAuth authentication required based on remote-hosting service.
 * @param username The authentication username associated with an account on the remote-hosting service.
 * @param password The authentication password associated with an account on the remote-hosting service.
 * @param token The authentication token associated with an account on the remote-hosting service.
 * @return An `AddRepoAction` object that can be dispatched via Redux.
 */
const addRepository = (root: string, { url, oauth }: Partial<ReturnType<typeof extractFromURL>>,
  username?: string, password?: string, token?: string):
  AddRepoAction | AddErrorAction => {
  const repo: Repository = {
    id: v4(),
    name: url ? extractRepoName(url.href) : extractFilename(root),
    root: root,
    corsProxy: new URL('https://cors-anywhere.herokuapp.com'), // TODO: This is just a stubbed URL for now, but eventually we need to support Cross-Origin Resource Sharing (CORS) since isomorphic-git requires it
    url: url ? url : parsePath(''),
    local: [],
    remote: [],
    oauth: oauth ? oauth : 'github',
    username: username ? username : '',
    password: password ? password : '',
    token: token ? token : ''
  };
  if (url && !isValidRepository(repo)) return reposError(repo.id, `Malformed repository '${repo.name}' cannot be added to the Redux store`);
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
const updateRepository = (repo: Repository): UpdateRepoAction => {
  return {
    type: ActionKeys.UPDATE_REPO,
    id: repo.id,
    repo: repo
  }
}

/**
 * Action Creator for composing a valid ADD_ERROR Redux Action.
 * @param target Corresponds to the object or field originating the error.
 * @param message The error message to be displayed to the user.
 * @return An `AddErrorAction` object that can be dispatched via Redux.
 */
export const reposError = (target: string, message: string): AddErrorAction => {
  const error: Error = {
    id: v4(),
    type: 'ReposError',
    target: target,
    message: message
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
const switchCardMetafile = (card: Card, metafile: Metafile): UpdateCardAction => {
  return updateCard({
    ...card,
    name: metafile.name,
    modified: metafile.modified,
    metafile: metafile.id
  });
}

/**
 * Thunk Action Creator for examining and updating the list of Git branch refs associated with a Repository
 * in the Redux store. Any local or remote branches are captured and added to the associated fields in the
 *  Repository, and the Redux store is updated to reflect these changes.
 * @param root The root Git directory path associated with the `Repository` object.
 * @param repo The `Repository` object that needs to be updated with the latest branch `refs` list.
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and return the updated `Repository` object 
 * from the Redux store.
 */
export const updateBranches = (id: UUID): ThunkAction<Promise<UpdateRepoAction | AddErrorAction>, RootState, undefined, Action> =>
  async (dispatch, getState) => {
    const repo = getState().repos[id];
    if (!repo) return dispatch(reposError(id, `Cannot update non-existing repo for id:'${id}'`));
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
* @param progress Enable printing progress information from `isomorphic-git.checkout()` to console.
* @param update Enable changing the branch for the main worktree; will prevent any new linked worktrees from being created.
* @return A Thunk that can be executed to get a Metafile associated with a new Git branch and updates the card.
*/
export const checkoutBranch = (cardId: UUID, metafileId: UUID, branch: string, progress?: boolean, update?: boolean)
  : ThunkAction<Promise<Metafile | undefined>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    // verify card, metafile, and repo exist in Redux store before proceeding
    const card = getState().cards[cardId];
    const metafile = getState().metafiles[metafileId];
    const repo = (metafile && metafile.repo) ? getState().repos[metafile.repo] : undefined;
    if (!card) dispatch(reposError(metafileId, `Cannot update non-existing card for id:'${cardId}'`));
    if (!metafile) dispatch(reposError(metafileId, `Cannot update non-existing metafile for id:'${metafileId}'`));
    if (!repo) dispatch(reposError(metafileId, `Repository missing for metafile id:'${metafileId}'`));
    if (!card || !metafile || !repo) return undefined;
    if (!metafile.path) return undefined; // metafile cannot be virtual

    let updated: Metafile | undefined;
    if (update) {
      // checkout the target branch into the main worktree; this is destructive to any uncommitted changes in the main worktree
      if (progress) await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: branch, onProgress: (e) => console.log(e.phase) });
      else await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: branch });
      updated = await dispatch(getMetafile({ filepath: metafile.path }));
    } else {
      // create a new linked worktree and checkout the target branch into it; non-destructive to uncommitted changes in the main worktree
      const oldWorktree = metafile.branch ? await worktree.resolveWorktree(repo, metafile.branch) : undefined;
      const newWorktree = await worktree.resolveWorktree(repo, branch);
      if (!oldWorktree || !newWorktree) return undefined; // no worktree could be resolved for either current or new worktree

      const relative = path.relative(oldWorktree.path.toString(), metafile.path.toString());
      updated = await dispatch(getMetafile({ filepath: path.join(newWorktree.path.toString(), relative) }));
    }
    // get an updated metafile based on the updated worktree path
    if (!updated) {
      dispatch(reposError(metafile.id, `Cannot locate updated metafile with new branch for path:'${metafile.path}'`));
      return undefined;
    }

    // update the metafile details (including file content) for the card
    dispatch(switchCardMetafile(card, updated));
    if (progress) console.log('checkout complete...');
    return getState().metafiles[updated.id];
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
    let root = await getRepoRoot(filepath);
    if (!root) return undefined; // if there is no root, then filepath is not under version control

    if (!(await isDirectory(`${root}/.git`))) {
      // root points to a linked worktree, so we update root to point to the main worktree path
      const gitdir = (await readFileAsync(`${root}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
      root = await getRepoRoot(gitdir);
      if (!root) return undefined; // if there is no root, then the main worktree path is corrupted
    }

    const remoteOriginUrls: string[] | undefined = root ?
      await isogit.getConfigAll({ fs: fs, dir: root, path: 'remote.origin.url' }) : undefined;
    const { url, oauth } = (remoteOriginUrls && remoteOriginUrls?.length > 0) ?
      extractFromURL(remoteOriginUrls[0]) : { url: undefined, oauth: undefined };
    const name = url ? extractRepoName(url.href) : extractFilename(root);
    const existing = url ? Object.values(getState().repos).find(r => r.name === name && r.url.href === url.href)
      : Object.values(getState().repos).find(r => r.name === name);
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