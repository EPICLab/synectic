import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import * as path from 'path';
import type { Repository, Card, Metafile, UUID } from '../types';
import * as worktree from './git-worktree';
import { getMetafile } from './metafiles';
import { extractFilename, isDirectory, readFileAsync } from './io';
import { getRepoRoot } from './git-porcelain';
import { isValidRepository, extractRepoName, extractFromURL } from './git-plumbing';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { getRepoByName, repoAdded, repoUpdated } from '../store/slices/repos';
import { AppThunkAPI } from '../store/hooks';
import { cardUpdated } from '../store/slices/cards';

/**
 * Async Thunk action creator for composing and validating a new Repository object before adding to the Redux store.
 * @param root The relative or absolute path to the git root directory.
 * @param {url, oauth} urlProtocol The URL and type of OAuth authentication required based on remote-hosting service.
 * @param username The authentication username associated with an account on the remote-hosting service.
 * @param password The authentication password associated with an account on the remote-hosting service.
 * @param token The authentication token associated with an account on the remote-hosting service.
 * @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
const appendRepository = createAsyncThunk<UUID, {
  root: string, protocol: Partial<ReturnType<typeof extractFromURL>>,
  username?: string, password?: string, token?: string
}, AppThunkAPI>(
  'repos/appendRepository',
  async (param, thunkAPI) => {
    const repo: Repository = {
      id: v4(),
      name: param.protocol.url ? extractRepoName(param.protocol.url.href) : extractFilename(param.root),
      root: param.root,
      corsProxy: 'https://cors-anywhere.herokuapp.com', // TODO: This is just a stubbed URL for now, but eventually we need to support Cross-Origin Resource Sharing (CORS) since isomorphic-git requires it
      url: param.protocol.url ? param.protocol.url.href : '',
      local: [],
      remote: [],
      oauth: param.protocol.oauth ? param.protocol.oauth : 'github',
      username: param.username ? param.username : '',
      password: param.password ? param.password : '',
      token: param.token ? param.token : ''
    };
    const valid = param.protocol.url ? isValidRepository(repo) : true;
    if (valid) {
      thunkAPI.dispatch(repoAdded(repo));
      return repo.id;
    }
    return '';
  }
);

/**
* Async Thunk action creator for changing the Metafile associated with a card.
* @param card A `Card` object containing new field values to be updated.
* @param metafile: A `Metafile` object that represents the new metafile information for the card.
* @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
*/
export const switchCardMetafile = createAsyncThunk<void, { card: Card, metafile: Metafile }, AppThunkAPI>(
  'repos/switchCardMetafile',
  async (param, thunkAPI) => {
    thunkAPI.dispatch(cardUpdated({
      ...param.card,
      name: param.metafile.name,
      modified: param.metafile.modified,
      metafile: param.metafile.id
    }))
  }
)

/**
 * Async Thunk action creator for examining and updating the list of Git branch refs associated with a Repository
 * in the Redux store. Any local or remote branches are captured and added to the associated fields in the
 *  Repository, and the Redux store is updated to reflect these changes.
 * @param id The UUID of a valid `Repository` object that needs to be updated with the latest branch `refs` list.
 * @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
 */
export const updateBranches = createAsyncThunk<void, UUID, AppThunkAPI & { rejectValue: string }>(
  'repos/updateBranches',
  async (id, thunkAPI) => {
    const repo = thunkAPI.getState().repos.entities[id];
    if (!repo) return thunkAPI.rejectWithValue(`Cannot update non-existing repo for id:'${id}'`);
    else {
      const localBranches = await isogit.listBranches({ fs: fs, dir: repo.root.toString() });
      const remoteBranches = await isogit.listBranches({ fs: fs, dir: repo.root.toString(), remote: 'origin' });
      thunkAPI.dispatch(repoUpdated({
        ...repo,
        local: localBranches,
        remote: remoteBranches
      }));
    }
  }
)

/**
* Async Thunk action creator for switching Git branches (or commit hash) and updating the associated metafile. Multiple cards
* can be associated with a single metafile, therefore switching branches requires a new (or at least different) metafile that
* refers to a new combination of `Repository` and `ref`. Since `isomorphic-git.checkout()` switches all files within a repository,
* we switch to the target branch and read the specific file, before switching back to the original branch. Returns a Metafile
* that can be used to switch with an existing card (via `switchCardMetafile`) or loaded into a new card 
* (via `containers/handlers.loadCard`).
* @param metafileId The UUID associated with the original metafile.
* @param branch Git branch name or commit hash; defaults to 'master'.
* @param progress Enable printing progress information from `isomorphic-git.checkout()` to console.
* @param update Enable changing the branch for the main worktree; will prevent any new linked worktrees from being created.
* @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
*/
export const checkoutBranch = createAsyncThunk<Metafile | undefined, {
  metafileId: UUID, branch: string, progress?: boolean, update?: boolean
}, AppThunkAPI>(
  'repos/checkoutBranch',
  async (param, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles.entities[param.metafileId];
    const repo = (metafile && metafile.repo) ? thunkAPI.getState().repos.entities[metafile.repo] : undefined;
    if (!metafile) return thunkAPI.rejectWithValue(`Cannot update non-existing metafile for id:'${param.metafileId}'`);
    if (!repo) return thunkAPI.rejectWithValue(`Repository missing for metafile id:'${param.metafileId}'`);
    if (!metafile || !repo) return undefined;
    if (!metafile.path) return thunkAPI.rejectWithValue(`Cannot checkout branches for virtual metafile:'${param.metafileId}'`);

    let updated: Metafile | undefined;
    if (param.update) {
      // checkout the target branch into the main worktree; this is destructive to any uncommitted changes in the main worktree
      if (param.progress) await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: param.branch, onProgress: (e) => console.log(e.phase) });
      else await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: param.branch });
      updated = await thunkAPI.dispatch(getMetafile({ filepath: metafile.path })).unwrap();
    } else {
      // create a new linked worktree and checkout the target branch into it; non-destructive to uncommitted changes in the main worktree
      const oldWorktree = metafile.branch ? await worktree.resolveWorktree(repo, metafile.branch) : undefined;
      const newWorktree = await worktree.resolveWorktree(repo, param.branch);
      if (!oldWorktree || !newWorktree)
        return thunkAPI.rejectWithValue(`No worktree could be resolved for either current or new worktree: repo='${repo.name}', old/new branch='${metafile.branch}'/'${param.branch}'`);

      const relative = path.relative(oldWorktree.path.toString(), metafile.path.toString());
      updated = await thunkAPI.dispatch(getMetafile({ filepath: path.join(newWorktree.path.toString(), relative) })).unwrap();
    }
    // get an updated metafile based on the updated worktree path
    if (!updated) return thunkAPI.rejectWithValue(`Cannot locate updated metafile with new branch for path:'${metafile.path}'`);

    if (param.progress) console.log('checkout complete...');
    return thunkAPI.getState().metafiles.entities[updated.id];
  }
)

/**
 * Async Thunk action creator for retrieving a `Repository` object associated with the given filepath. If the filepath is not under version
 * control (i.e. not contained within a Git repository), or the associated Git repository is malformed, then no valid response can be 
 * given. Otherwise, the correct Repository object is returned and the Redux store is updated with the latest set of branches.
 * @param filepath The relative or absolute path to evaluate.
 * @return  A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed. Returns a repository that was either created or retrieved
 * and updated based on the filesystem and version control system.
 */
export const getRepository = createAsyncThunk<Repository | undefined, PathLike, AppThunkAPI & { rejectValue: string }>(
  'repos/getRepository',
  async (filepath, thunkAPI) => {
    let root = await getRepoRoot(filepath);
    if (!root) {
      thunkAPI.rejectWithValue('No root found'); // if there is no root, then filepath is not under version control
      return undefined;
    }
    if (!(await isDirectory(`${root}/.git`))) {
      // root points to a linked worktree, so root needs to be updated to point to the main worktree path
      const gitdir = (await readFileAsync(`${root}/.git`, { encoding: 'utf-8' })).slice('gitdir: '.length).trim();
      root = await getRepoRoot(gitdir);
      if (!root) {
        thunkAPI.rejectWithValue('No root found'); // if there is no root, then the main worktree path is corrupted
        return undefined;
      }
    }
    const remoteOriginUrls: string[] | undefined = root ?
      await isogit.getConfigAll({ fs: fs, dir: root, path: 'remote.origin.url' }) : undefined;
    const { url, oauth } = (remoteOriginUrls && remoteOriginUrls.length > 0) ?
      extractFromURL(remoteOriginUrls[0]) :
      { url: undefined, oauth: undefined };
    const name = url ? extractRepoName(url.href) : (root ? extractFilename(root) : '');
    const existing = url ?
      await thunkAPI.dispatch(getRepoByName({ name: name, url: url.href })).unwrap() :
      await thunkAPI.dispatch(getRepoByName({ name: name })).unwrap();
    if (existing) {
      await thunkAPI.dispatch(updateBranches(existing.id));
      return thunkAPI.getState().repos.entities[existing.id];
    }
    const username = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'user.name' }) : undefined;
    const password = root ? await isogit.getConfig({ fs: fs, dir: root.toString(), path: 'credential.helper' }) : undefined;
    const id = root ? await thunkAPI.dispatch(appendRepository({ root: root, protocol: { url: url, oauth: oauth }, username: username, password: password })).unwrap() : undefined;
    if (id) {
      await thunkAPI.dispatch(updateBranches(id));
      return thunkAPI.getState().repos.entities[id];
    } else {
      thunkAPI.rejectWithValue('Unable to generate new repository');
    }
  }
)
