import * as fs from 'fs-extra';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs';
import { checkout, getConfigAll, listBranches, ProgressCallback } from 'isomorphic-git';
import { v4 } from 'uuid';
import { AppThunkAPI } from '../hooks';
import type { Card, Metafile, Repository, UUID } from '../../types';
import { extractFromURL, extractRepoName, isGitRepo } from '../../containers/git-plumbing';
import { clone, getConfig, getRemoteInfo, getRepoRoot, GitConfig } from '../../containers/git-porcelain';
import { extractFilename } from '../../containers/io';
import { fetchMetafile, fetchMetafileById, fetchParentMetafile, FilebasedMetafile } from './metafiles';
import { removeUndefined } from '../../containers/format';
import { cardUpdated } from '../slices/cards';
import { repoUpdated } from '../slices/repos';
import { resolveWorktree } from '../../containers/git-worktree';
import { join, relative } from 'path';

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

export const fetchReposByFilepath = createAsyncThunk<Repository[], PathLike, AppThunkAPI>(
    'repos/fetchByFilepath',
    async (filepath, thunkAPI) => {
        const root = await getRepoRoot(filepath);
        return removeUndefined(Object.values(thunkAPI.getState().repos.entities)
            .filter(repo => repo && repo.root.toString() === root));
    }
);

/** Transitive potential to trigger the reposSlice.extraReducers to update Redux state */
export const fetchRepo = createAsyncThunk<Repository | undefined, FilebasedMetafile, AppThunkAPI>(
    'repos/fetchRepo',
    async (metafile, thunkAPI) => {
        console.log(`fetchRepo`, { metafile });
        // if metafile already has a repo UUID, return the matching repository
        if (metafile.repo) {
            console.log(`finding repo from existing UUID: ${metafile.repo}`);
            const repo = thunkAPI.getState().repos.entities[metafile.repo];
            if (repo) return repo;
        }

        // if parent metafile already has a repo UUID, return the matching repository
        const parent = await thunkAPI.dispatch(fetchParentMetafile(metafile)).unwrap();
        console.log(`finding repo from parent:`, { parent });
        if (parent && parent.repo) {
            const repo = thunkAPI.getState().repos.entities[parent.repo];
            if (repo) return repo;
        }

        // if root path matches an existing repo, return the matching repository
        const root = await getRepoRoot(metafile.path);
        if (root) {
            console.log(`finding repo from root path: ${root}`);
            const repo = Object.values(thunkAPI.getState().repos.entities).find(r => r?.root.toString() === root);
            if (repo) return repo;
        }

        // if no existing repo can be found, create and return a new repository
        console.log('returning a new repository');
        return root ? await thunkAPI.dispatch(fetchNewRepo(root)).unwrap() : undefined;
    }
);

/** Triggers the reposSlice.extraReducers to update Redux state */
export const fetchNewRepo = createAsyncThunk<Repository, PathLike, AppThunkAPI>(
    'repos/fetchNew',
    async (root, thunkAPI) => {
        const remoteOriginUrls: string[] = await getConfigAll({ fs: fs, dir: root.toString(), path: 'remote.origin.url' });
        const { url, oauth } = (remoteOriginUrls.length > 0) ?
            extractFromURL(remoteOriginUrls[0]) :
            { url: undefined, oauth: undefined };
        const extractGitConfigValue = (gitConfig: GitConfig): string => {
            return (gitConfig.scope === 'none') ? '' : gitConfig.value;
        };
        const { local, remote } = await thunkAPI.dispatch(fetchRepoBranches(root)).unwrap();
        return {
            id: v4(),
            name: url ?
                extractRepoName(url.href) :
                (root ? extractFilename(root) : ''),
            root: root,
            /** TODO: The corsProxy is just a stubbed URL for now, but eventually we need to support Cross-Origin 
             * Resource Sharing (CORS) since isomorphic-git requires it */
            corsProxy: 'https://cors-anywhere.herokuapp.com',
            url: url ? url.href : '',
            local: local,
            remote: remote,
            oauth: oauth ? oauth : 'github',
            username: extractGitConfigValue(await getConfig('user.name')),
            password: extractGitConfigValue(await getConfig('credential.helper')),
            token: ''
        };
    }
);

export const fetchRepoBranches = createAsyncThunk<Pick<Repository, 'local' | 'remote'>, PathLike>(
    'repos/fetchBranches',
    async (root) => {
        const localBranches = await listBranches({ fs: fs, dir: root.toString() });
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
        const repo = (metafile && metafile.repo) ? thunkAPI.getState().repos.entities[metafile.repo] : undefined;
        if (!metafile) return thunkAPI.rejectWithValue(`Cannot update non-existing metafile for id:'${param.metafileId}'`);
        if (!metafile.path) return thunkAPI.rejectWithValue(`Cannot checkout branches for virtual metafile:'${param.metafileId}'`);
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
            const oldWorktree = metafile.branch ? await resolveWorktree(repo, metafile.branch) : undefined;
            const newWorktree = await resolveWorktree(repo, param.branch);
            if (!oldWorktree || !newWorktree)
                return thunkAPI.rejectWithValue(`No worktree could be resolved for either current or new worktree: repo='${repo.name}', old/new branch='${metafile.branch}'/'${param.branch}'`);
            const relativePath = relative(oldWorktree.path.toString(), metafile.path.toString());
            updated = await thunkAPI.dispatch(fetchMetafile({ filepath: join(newWorktree.path.toString(), relativePath) })).unwrap();
        }
        // get an updated metafile based on the updated worktree path
        if (!updated) return thunkAPI.rejectWithValue(`Cannot locate updated metafile with new branch for path:'${metafile.path}'`);

        if (param.progress) console.log('checkout complete...');
        return updated;
    }
)