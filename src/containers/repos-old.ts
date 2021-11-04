import * as fs from 'fs-extra';
import * as isogit from 'isomorphic-git';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import * as path from 'path';
import type { Repository, Card, Metafile, UUID } from '../types';
import type { Nullable } from './format';
import * as worktree from './git-worktree';
import { extractFilename, isDirectory, readFileAsync } from './io';
import { clone, getConfig, getRemoteInfo, getRepoRoot } from './git-porcelain';
import { isValidRepository, extractRepoName, extractFromURL, isGitRepo } from './git-plumbing';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { repoAdded, repoUpdated } from '../store/slices/repos';
import { AppThunkAPI } from '../store/hooks';
import { cardUpdated } from '../store/slices/cards';
import { fetchMetafileById, fetchMetafilesByFilepath } from '../store/slices/metafiles';
import { fetchReposByName } from '../store/thunks/repos';

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
const appendRepository = createAsyncThunk<UUID | undefined, {
  root: string, protocol: Nullable<Partial<ReturnType<typeof extractFromURL>>>,
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
    return undefined;
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
 * Async Thunk action creator for creating a local repository by cloning a remote repository.
 * @param url A repository URL string.
 * @param root The relative or absolute path to clone into.
 * @param onProgress Callback for listening to GitProgressEvent occurrences during cloning.
 * @return  A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed. Returns a repository that was cloned and 
 * updated based on the filesystem and version control system.
 */
export const cloneRepository = createAsyncThunk<Repository | undefined, { url: URL | string, root: PathLike, onProgress?: isogit.ProgressCallback }, AppThunkAPI>(
  'repos/cloneRepository',
  async (param, thunkAPI) => {
    const existing = await isGitRepo(param.root);
    if (existing) { // if root points to a current repository, do not clone over it
      console.log(`Existing repository found at '${param.root.toString()}', use getRepository() to retrieve`);
      // thunkAPI.rejectWithValue(`Existing repository found at '${param.root.toString()}', use getRepository() to retrieve`);
      // return undefined;
    }
    const { url, oauth } = extractFromURL(param.url);
    const username = await getConfig('user.name', true);
    const password = await getConfig('credential.helper', true);
    const id = await thunkAPI.dispatch(appendRepository({
      root: param.root.toString(),
      protocol: { url: url, oauth: oauth },
      username: username.scope !== 'none' ? username.value : '',
      password: password.scope !== 'none' ? password.value : ''
    })).unwrap();
    const repo = id ? thunkAPI.getState().repos.entities[id] : undefined;
    if (id && repo) {
      const info = await getRemoteInfo({ url: repo.url });
      if (!info.HEAD) return thunkAPI.rejectWithValue('Repository not configured; HEAD is disconnected or not configured');
      const defaultBranch = info.HEAD.substring(info.HEAD.lastIndexOf('/') + 1);
      thunkAPI.dispatch(repoUpdated({
        ...repo,
        remote: [defaultBranch]
      }));
      await clone({ repo: repo, dir: repo.root, noCheckout: true, depth: 10, onProgress: param.onProgress });
      await thunkAPI.dispatch(updateBranches(id));
      return thunkAPI.getState().repos.entities[id];
    } else {
      thunkAPI.rejectWithValue('Unable to clone and generate new repository');
    }
  }
);

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
* @param overwrite Enable changing the branch for the main worktree; will prevent any new linked worktrees from being created.
* @return A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed.
*/
export const checkoutBranch = createAsyncThunk<Metafile | undefined, {
  metafileId: UUID, branch: string, progress?: boolean, overwrite?: boolean
}, AppThunkAPI>(
  'repos/checkoutBranch',
  async (param, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles.entities[param.metafileId];
    const repo = (metafile && metafile.repo) ? thunkAPI.getState().repos.entities[metafile.repo] : undefined;
    if (!metafile) return thunkAPI.rejectWithValue(`Cannot update non-existing metafile for id:'${param.metafileId}'`);
    if (!metafile.path) return thunkAPI.rejectWithValue(`Cannot checkout branches for virtual metafile:'${param.metafileId}'`);
    if (!repo) return thunkAPI.rejectWithValue(`Repository missing for metafile id:'${param.metafileId}'`);
    if (!metafile || !repo) return undefined;

    let updated: Metafile | undefined;
    if (param.overwrite) {
      // checkout the target branch into the main worktree; this is destructive to any uncommitted changes in the main worktree
      if (param.progress) await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: param.branch, onProgress: (e) => console.log(e.phase) });
      else await isogit.checkout({ fs: fs, dir: repo.root.toString(), ref: param.branch });

      updated = await thunkAPI.dispatch(fetchMetafileById(metafile.id)).unwrap();
    } else {
      // create a new linked worktree and checkout the target branch into it; non-destructive to uncommitted changes in the main worktree
      const oldWorktree = metafile.branch ? await worktree.resolveWorktree(repo, metafile.branch) : undefined;
      const newWorktree = await worktree.resolveWorktree(repo, param.branch);
      if (!oldWorktree || !newWorktree)
        return thunkAPI.rejectWithValue(`No worktree could be resolved for either current or new worktree: repo='${repo.name}', old/new branch='${metafile.branch}'/'${param.branch}'`);

      const relative = path.relative(oldWorktree.path.toString(), metafile.path.toString());
      const updates = await thunkAPI.dispatch(fetchMetafilesByFilepath(path.join(newWorktree.path.toString(), relative))).unwrap();
      if (updates.length > 0) updated = updates[0];
    }
    // get an updated metafile based on the updated worktree path
    if (!updated) return thunkAPI.rejectWithValue(`Cannot locate updated metafile with new branch for path:'${metafile.path}'`);

    if (param.progress) console.log('checkout complete...');
    return thunkAPI.getState().metafiles.entities[updated.id];
  }
)

// Descriminated union type for emulating a `mutually exclusive or` (XOR) operation between parameter types
// Ref: https://github.com/microsoft/TypeScript/issues/14094#issuecomment-344768076
type RepositoryGettableFields =
  { id: UUID, filepath?: never } |
  { id?: never, filepath: PathLike };

/**
 * Async Thunk action creator for simplifying the process of obtaining an updated repository from the Redux store.
 * If the filepath is not under version control (i.e. not contained within a Git repository), or the associated Git repository 
 * is malformed, then no valid response can be given. Otherwise, the correct Repository object is returned and the Redux 
 * store is updated with the latest set of branches.
 * @param id The UUID corresponding to the repository that should be updated and returned.
 * @param filepath The relative or absolute path to a git-tracked file or directory that is associated with a repository.
 * @return  A Thunk that can be executed via `store/hooks/useAppDispatch` to update the Redux store state; automatically 
 * wrapped in a [Promise Lifecycle](https://redux-toolkit.js.org/api/createAsyncThunk#promise-lifecycle-actions)
 * that generates `pending`, `fulfilled`, and `rejected` actions as needed. Returns a repository that was either created or 
 * retrieved and updated based on the filesystem and version control system, or `undefined` if unable to find the new/existing
 * repository from the Redux store.
 */
export const getRepository = createAsyncThunk<Repository | undefined, RepositoryGettableFields, AppThunkAPI & { rejectValue: string }>(
  'repos/getRepository',
  async (retrieveBy, thunkAPI) => {
    console.log(`[${retrieveBy.id ? 'cheap' : 'EXPENSIVE'}] Repository for ${JSON.stringify(retrieveBy)}`);
    if (retrieveBy.id) {
      const existing = await thunkAPI.dispatch(updateBranches(retrieveBy.id));
      return existing ? thunkAPI.getState().repos.entities[retrieveBy.id] : undefined;
    }
    if (retrieveBy.filepath) {
      let root = await getRepoRoot(retrieveBy.filepath);
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
        await thunkAPI.dispatch(fetchReposByName({ name: name, url: url.href })).unwrap() :
        await thunkAPI.dispatch(fetchReposByName({ name: name })).unwrap();
      if (existing.length > 0) {
        await thunkAPI.dispatch(updateBranches(existing[0].id));
        return thunkAPI.getState().repos.entities[existing[0].id];
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
    return thunkAPI.rejectWithValue('Failed to match any containers/repos/getRepository parameter types');
  }
)