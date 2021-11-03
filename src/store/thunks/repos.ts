import * as fs from 'fs-extra';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs';
import { getConfigAll, listBranches } from 'isomorphic-git';
import { v4 } from 'uuid';
import { AppThunkAPI } from '../hooks';
import type { Repository, UUID } from '../../types';
import { extractFromURL, extractRepoName } from '../../containers/git-plumbing';
import { getConfig, getRepoRoot, GitConfig } from '../../containers/git-porcelain';
import { extractFilename } from '../../containers/io';
import { fetchParentMetafile, FilebasedMetafile } from './metafiles';
import { removeUndefined } from '../../containers/format';

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

        // if no existing repo can be found, create and return a new repository
        const root = await getRepoRoot(metafile.path);
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
)