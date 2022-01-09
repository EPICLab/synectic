import * as fs from 'fs-extra';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs';
import { checkout, listBranches, ProgressCallback } from 'isomorphic-git';
import { v4 } from 'uuid';
import { AppThunkAPI } from '../hooks';
import type { Card, Metafile, Repository, UUID } from '../../types';
import { extractFromURL, extractRepoName, isGitRepo } from '../../containers/git-plumbing';
import { clone, getConfig, getRemoteInfo, getRepoRoot, GitConfig } from '../../containers/git-porcelain';
import { extractFilename } from '../../containers/io';
import { fetchMetafile, fetchMetafileById, fetchParentMetafile, fetchVersionControl, FilebasedMetafile, isFilebasedMetafile } from './metafiles';
import { removeUndefined } from '../../containers/format';
import { cardUpdated } from '../slices/cards';
import { repoUpdated } from '../slices/repos';
import { isLinkedWorktree, resolveLinkToRoot, resolveWorktree } from '../../containers/git-worktree';
import { join, relative } from 'path';
import { metafileUpdated } from '../slices/metafiles';
import { fetchBranches } from './branches';

export const fetchRepoById = createAsyncThunk<Repository | undefined, UUID, AppThunkAPI>(
    'repos/fetchById',
    async (id, thunkAPI) => {
        return thunkAPI.getState().repos.entities[id];
    }
);

export const fetchReposByName = createAsyncThunk<Repository[], { name: string, url?: string }, AppThunkAPI>(
    'repos/fetchByName',
    async (input, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().repos.entities)
            .filter(repo => repo && repo.name === input.name && (input.url ? repo.url === input.url : true)));
    }
);

export const fetchRepoByFilepath = createAsyncThunk<Repository | undefined, PathLike, AppThunkAPI>(
    'repos/fetchByFilepath',
    async (filepath, thunkAPI) => {
        const root = await getRepoRoot(filepath);
        const mainRoot = root ? (
            (await isLinkedWorktree({ dir: root })) ? await resolveLinkToRoot(root) : root)
            : undefined;
        const repos = removeUndefined(Object.values(thunkAPI.getState().repos.entities)
            .filter(repo => repo && repo.root.toString() === mainRoot));
        return repos.length > 0 ? repos[0] : undefined;
    }
);

/** Transitive potential to trigger the reposSlice.extraReducers to update Redux state */
export const fetchRepo = createAsyncThunk<Repository | undefined, FilebasedMetafile, AppThunkAPI>(
    'repos/fetchRepo',
    async (metafile, thunkAPI) => {
        // if metafile already has a repo UUID, return the matching repository
        if (metafile.repo) {
            const repo = thunkAPI.getState().repos.entities[metafile.repo];
            if (repo) return repo;
        }

        // if parent metafile already has a repo UUID, return the matching repository
        const parent = await thunkAPI.dispatch(fetchParentMetafile(metafile)).unwrap();
        if (parent && parent.repo) {
            const repo = thunkAPI.getState().repos.entities[parent.repo];
            if (repo) return repo;
        }

        // if root path matches an existing repo, return the matching repository
        const repo = await thunkAPI.dispatch(fetchRepoByFilepath(metafile.path)).unwrap();
        if (repo) return repo;

        // if no existing repo can be found, create and return a new repository
        const root = await getRepoRoot(metafile.path);
        return root ? await thunkAPI.dispatch(fetchNewRepo(root)).unwrap() : undefined;
    }
);

/** Triggers the reposSlice.extraReducers to update Redux state */
export const fetchNewRepo = createAsyncThunk<Repository, PathLike, AppThunkAPI>(
    'repos/fetchNew',
    async (root, thunkAPI) => {
        const remoteOriginUrl = await getConfig({ dir: root, keyPath: 'remote.origin.url' });
        const { url, oauth } = (remoteOriginUrl.scope !== 'none') ?
            extractFromURL(remoteOriginUrl.value) :
            { url: undefined, oauth: undefined };
        const extractGitConfigValue = (gitConfig: GitConfig): string => {
            return (gitConfig.scope === 'none') ? '' : gitConfig.value;
        };
        const { local, remote } = await thunkAPI.dispatch(fetchRepoBranches(root)).unwrap();
        return {
            id: v4(),
            name: url ? extractRepoName(url.href) : (root ? extractFilename(root) : ''),
            root: root,
            /** TODO: The corsProxy is just a stubbed URL for now, but eventually we need to support Cross-Origin 
             * Resource Sharing (CORS) since isomorphic-git requires it */
            corsProxy: 'https://cors-anywhere.herokuapp.com',
            url: url ? url.href : '',
            local: local,
            remote: remote,
            oauth: oauth ? oauth : 'github',
            username: extractGitConfigValue(await getConfig({ dir: root, keyPath: 'user.name' })),
            password: extractGitConfigValue(await getConfig({ dir: root, keyPath: 'credential.helper' })),
            token: ''
        };
    }
);

export const fetchRepoBranches = createAsyncThunk<Pick<Repository, 'local' | 'remote'>, PathLike, AppThunkAPI>(
    'repos/fetchBranches',
    async (root, thunkAPI) => {
        const localBranches = (await thunkAPI.dispatch(fetchBranches(root)).unwrap()).map(b => b.id);
        const remoteBranches = await listBranches({ fs: fs, dir: root.toString(), remote: 'origin' });
        return { local: localBranches, remote: remoteBranches };
    }
);

/** Async thunk action creator for changing the Metafile associated with a card. */
export const switchCardMetafile = createAsyncThunk<void, { card: Card, metafile: Metafile }, AppThunkAPI>(
    'repos/switchCardMetafile',
    async (param, thunkAPI) => {
        thunkAPI.dispatch(cardUpdated({
            ...param.card,
            name: param.metafile.name,
            modified: param.metafile.modified,
            metafile: param.metafile.id
        }));
    }
);

/** Async thunk action creator for creating a local repository by cloning a remote repository. */
export const cloneRepository = createAsyncThunk<Repository | undefined, { url: URL | string, root: PathLike, onProgress?: ProgressCallback }, AppThunkAPI>(
    'repos/cloneRepository',
    async (param, thunkAPI) => {
        const existing = await isGitRepo(param.root);
        if (existing) { // if root points to a current repository, do not clone over it
            console.log(`Existing repository found at '${param.root.toString()}', use 'fetchRepo' to retrieve`);
            return undefined;
        }
        const repo = await thunkAPI.dispatch(fetchNewRepo(param.root)).unwrap();
        if (repo) {
            const info = await getRemoteInfo({ url: repo.url });
            if (!info.HEAD) return thunkAPI.rejectWithValue('Repository not configured; HEAD is disconnected or not configured');
            const defaultBranch = info.HEAD.substring(info.HEAD.lastIndexOf('/') + 1);
            thunkAPI.dispatch(repoUpdated({
                ...repo,
                remote: [defaultBranch]
            }));
            await clone({ repo: repo, dir: repo.root, noCheckout: true, depth: 10, onProgress: param.onProgress });
            const branches = await thunkAPI.dispatch(fetchRepoBranches(repo.root)).unwrap();
            thunkAPI.dispatch(repoUpdated({ ...repo, ...branches }));
            return await thunkAPI.dispatch(fetchRepoById(repo.id)).unwrap();
        }
        return undefined;
    }
);

export const checkoutBranch = createAsyncThunk<Metafile | undefined, { metafileId: UUID, branch: string, progress?: boolean, overwrite?: boolean }, AppThunkAPI>(
    'repos/checkoutBranch',
    async (param, thunkAPI) => {
        const metafile = thunkAPI.getState().metafiles.entities[param.metafileId];
        const branch = (metafile && metafile.branch) ? thunkAPI.getState().branches.entities[metafile.branch] : undefined;
        const repo = (metafile && metafile.repo) ? thunkAPI.getState().repos.entities[metafile.repo] : undefined;
        if (!metafile) return thunkAPI.rejectWithValue(`Cannot update non-existing metafile for id:'${param.metafileId}'`);
        if (!metafile.path) return thunkAPI.rejectWithValue(`Cannot checkout branches for virtual metafile:'${param.metafileId}'`);
        if (!branch) return thunkAPI.rejectWithValue(`Branch missing for metafile id:'${param.metafileId}'`);
        if (!repo) return thunkAPI.rejectWithValue(`Repository missing for metafile id:'${param.metafileId}'`);
        if (!metafile || !repo) return undefined;

        let updated: Metafile | undefined;
        if (param.overwrite) {
            // checkout the target branch into the main worktree; this is destructive to any uncommitted changes in the main worktree
            if (param.progress) await checkout({ fs: fs, dir: repo.root.toString(), ref: param.branch, onProgress: (e) => console.log(e.phase) });
            else await checkout({ fs: fs, dir: repo.root.toString(), ref: param.branch });
            updated = await thunkAPI.dispatch(fetchMetafileById(metafile.id)).unwrap();
        } else {
            // create a new linked worktree and checkout the target branch into it; non-destructive to uncommitted changes in the main worktree
            const oldWorktree = await resolveWorktree(repo, branch.name);
            const newWorktree = await resolveWorktree(repo, param.branch);
            if (!oldWorktree || !newWorktree)
                return thunkAPI.rejectWithValue(`No worktree could be resolved for either current or new worktree: repo='${repo.name}', old/new branch='${metafile.branch}'/'${param.branch}'`);
            const relativePath = relative(oldWorktree.path.toString(), metafile.path.toString());
            updated = await thunkAPI.dispatch(fetchMetafile({ filepath: join(newWorktree.path.toString(), relativePath) })).unwrap();
        }
        // get an updated metafile based on the updated worktree path
        if (!updated) return thunkAPI.rejectWithValue(`Cannot locate updated metafile with new branch for path:'${metafile.path}'`);

        if (isFilebasedMetafile(updated)) {
            const vcs = await thunkAPI.dispatch(fetchVersionControl(updated)).unwrap();
            updated = thunkAPI.dispatch(metafileUpdated({ ...updated, ...vcs })).payload;
        }
        if (param.progress) console.log('checkout complete...');
        return updated;
    }
)