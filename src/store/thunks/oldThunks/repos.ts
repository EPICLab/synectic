import parsePath from 'parse-path';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppThunkAPI } from '../../hooks';
import { repoAdded, Repository } from '../../slices/repos';
import repoSelectors from '../../selectors/repos';
import { FilebasedMetafile, isVersionedMetafile } from '../../slices/metafiles';
import { extractRepoName, extractFromURL, getWorktreePaths } from '../../../containers/git';
import { defaultBranch, getConfig, getRemoteInfo, GitConfig } from '../../../containers/old-git/git-porcelain';

import { extractFilename } from '../../../containers/io';
import { createMetafile, fetchParentMetafile, updateConflicted } from '../metafiles';
import { fetchBranches, updateRepository } from './branches';
import { ProgressCallback } from 'isomorphic-git';
import { DateTime } from 'luxon';
import { buildCard } from '../cards';
import { ExactlyOne } from '../../../containers/utils';
import { checkProject, resolveConflicts } from '../../../containers/old-git/merges';
import { modalAdded } from '../../slices/modals';
import * as repos from '../repos'; // eslint-disable-line @typescript-eslint/no-unused-vars
import { cloneRepo } from '../../../containers/git/git-clone';

/**
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link repos.fetchRepo} instead.
 */
export const fetchRepo = createAsyncThunk<Repository | undefined, ExactlyOne<{ filepath: PathLike, metafile: FilebasedMetafile }>, AppThunkAPI>(
    'repos/fetchRepo',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();
        const filepath: PathLike = input.metafile ? input.metafile.path : input.filepath;

        if (input.metafile) {
            // if metafile already has a repo UUID, check for matching repository
            let repo = input.metafile.repo ? repoSelectors.selectById(state, input.metafile.repo) : undefined;
            const parent = !repo ? await thunkAPI.dispatch(fetchParentMetafile(input.metafile)).unwrap() : undefined;
            // otherwise if parent metafile already has a repo UUID, check for matching repository
            repo = (parent && isVersionedMetafile(parent)) ? repoSelectors.selectById(state, parent.repo) : repo;
            if (repo) return repo;
        }
        // if filepath has a root path, check for matching repository
        const { dir, worktreeDir } = await getWorktreePaths(filepath);
        let repo = dir ? repoSelectors.selectByRoot(state, dir) : undefined;

        // otherwise create a new repository
        const root = worktreeDir ? worktreeDir : dir;
        repo = (!repo && root) ? await thunkAPI.dispatch(createRepo(root)).unwrap() : repo;
        return repo;
    }
);

/**
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link repos.buildRepo} instead.
 */
export const createRepo = createAsyncThunk<Repository, PathLike, AppThunkAPI>(
    'repos/createRepo',
    async (filepath, thunkAPI) => {
        const { dir } = await getWorktreePaths(filepath);
        const { url, oauth } = await getRemoteConfig(dir);
        const branches = dir ? await thunkAPI.dispatch(fetchBranches(dir)).unwrap() : { local: [], remote: [] };
        const { local, remote } = { local: branches.local.map(branch => branch.id), remote: branches.remote.map(branch => branch.id) };
        const { username, password } = await getCredentials(dir);
        return thunkAPI.dispatch(repoAdded({
            id: v4(),
            name: url ? extractRepoName(url.href) : (dir ? extractFilename(dir) : ''),
            root: dir ? dir : '',
            /**
             * TODO: The corsProxy is just a stubbed URL for now, but eventually we need to support Cross-Origin 
             * Resource Sharing (CORS) since isomorphic-git requires it
             */
            corsProxy: 'https://cors-anywhere.herokuapp.com',
            url: url ? url.href : '',
            default: dir ? await defaultBranch({ dir: dir }) : '',
            local: local,
            remote: remote,
            oauth: oauth ? oauth : 'github',
            username: username,
            password: password,
            token: ''
        })).payload;
    }
);

/**
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link repos.getRemoteConfig} instead.
 * @param dir Worktree root directory.
 */
const getRemoteConfig = async (dir: PathLike | undefined)
    : Promise<{ url: parsePath.ParsedPath | undefined; oauth: Repository['oauth'] | undefined }> => {
    const remoteConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'remote.origin.url' }) : { scope: 'none' };
    return (remoteConfig.scope !== 'none') ? extractFromURL(remoteConfig.value) : { url: undefined, oauth: undefined };
};

/**
 * @deprecated This implementation uses old-git functions that rely on isomorphic-git, please use {@link repos.getCredentials} instead.
 * @param dir Worktree root directory.
 */
const getCredentials = async (dir: PathLike | undefined): Promise<{ username: string; password: string }> => {
    const usernameConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'user.name' }) : { scope: 'none' };
    const passwordConfig: GitConfig = dir ? await getConfig({ dir: dir, keyPath: 'credential.helper' }) : { scope: 'none' };
    return {
        username: usernameConfig.scope === 'none' ? '' : usernameConfig.value,
        password: passwordConfig.scope === 'none' ? '' : passwordConfig.value
    };
};

/** Create a local repository by cloning a remote repository. */
export const cloneRepository = createAsyncThunk<Repository | undefined, { url: URL, root: PathLike, onProgress?: ProgressCallback }, AppThunkAPI<string>>(
    'repos/clone',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();
        const existing = repoSelectors.selectByRoot(state, input.root);
        // if root points to a current repository, do not clone over it and instead use `fetchRepo`
        if (existing) return thunkAPI.rejectWithValue(`Existing repository found at '${input.root.toString()}', open the root directory instead`);

        const info = await getRemoteInfo({ url: input.url.toString() });
        if (!info.HEAD) return thunkAPI.rejectWithValue('Repository not configured; HEAD is disconnected or not configured');
        // const cloned = await clone({ url: input.url, dir: input.root, depth: 10, onProgress: input.onProgress });
        const cloned = await cloneRepo({ repo: input.url, dir: input.root });
        if (!cloned) return thunkAPI.rejectWithValue(`Clone failed for '${input.url.toString()}'; possibly unsupported URL type`);

        return await thunkAPI.dispatch(createRepo(input.root)).unwrap();
    }
);

// TODO: Refactor this fetch to be an automated process via the listenerMiddleware
export const fetchConflictManagers = createAsyncThunk<void, void, AppThunkAPI>(
    'metafiles/fetchConflictManagers',
    async (_, thunkAPI) => {
        const repos = repoSelectors.selectAll(thunkAPI.getState());
        let hasConflicts = false;

        await Promise.all(repos.map(async repo => {
            const updated = await thunkAPI.dispatch(updateRepository(repo)).unwrap(); // update in case local/remote branches have changed
            await Promise.all(updated.local.map(async branchId => {
                const branch = thunkAPI.getState().branches.entities[branchId];
                const conflicts = branch ? await checkProject(branch.root, branch.ref) : undefined;

                if (branch && conflicts && conflicts.length > 0) {
                    hasConflicts = true;
                    await thunkAPI.dispatch(updateConflicted(conflicts));
                    const { base, compare } = await resolveConflicts(branch.root);
                    const conflictManager = await thunkAPI.dispatch(createMetafile({
                        metafile: {
                            name: `Conflicts`,
                            modified: DateTime.local().valueOf(),
                            handler: 'ConflictManager',
                            filetype: 'Text',
                            loading: [],
                            repo: updated.id,
                            path: branch.root,
                            merging: { base: (base ? base : branch.ref), compare: compare }
                        }
                    })).unwrap();
                    await thunkAPI.dispatch(buildCard({ metafile: conflictManager }));
                }
            }));
        }));

        if (!hasConflicts) thunkAPI.dispatch(modalAdded({
            id: v4(), type: 'Notification',
            options: { 'message': `No conflicts found` }
        }))
    }
);