import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs';
import { v4 } from 'uuid';
import { removeUndefined } from '../../containers/format';
import { currentBranch, getConfig } from '../../containers/git-porcelain';
import type { Branch, UUID } from '../../types';
import { AppThunkAPI } from '../hooks';
import { fetchParentMetafile, FilebasedMetafile } from './metafiles';
import { getBranchRoot, getRoot, getWorktreePaths } from '../../containers/git-path';

export const fetchBranchById = createAsyncThunk<Branch | undefined, UUID, AppThunkAPI>(
    'repos/fetchById',
    async (id, thunkAPI) => {
        return thunkAPI.getState().branches.entities[id];
    }
);

export const fetchBranchByFilepath = createAsyncThunk<Branch | undefined, PathLike, AppThunkAPI>(
    'branches/fetchByFilepath',
    async (filepath, thunkAPI) => {
        const root = await getRoot(filepath);
        const branches = removeUndefined(Object.values(thunkAPI.getState().branches.entities)
            .filter(branch => branch && branch.root.toString() == root));
        return branches.length > 0 ? branches[0] : undefined;
    }
);

export const fetchBranch = createAsyncThunk<Branch | undefined, FilebasedMetafile, AppThunkAPI>(
    'branches/fetchBranch',
    async (metafile, thunkAPI) => {
        // if metafile already has a branch UUID, return the matching branch
        if (metafile.branch) {
            const branch = thunkAPI.getState().branches.entities[metafile.branch];
            if (branch) return branch;
        }

        // if parent already has a branch UUID, return the matching branch
        const parent = await thunkAPI.dispatch(fetchParentMetafile(metafile)).unwrap();
        if (parent && parent.branch) {
            const branch = thunkAPI.getState().branches.entities[parent.branch];
            if (branch) return branch;
        }

        // if root path matches an existing branch, return the matching branch
        const branch = await thunkAPI.dispatch(fetchBranchByFilepath(metafile.path)).unwrap();
        if (branch) return branch;

        const root = await getRoot(metafile.path);
        return root ? await thunkAPI.dispatch(fetchLocalBranch({ root: root })).unwrap() : undefined;
    }
);

/**
 * Async thunk for generating a new local-scoped Branch object. This function is capable of resolving `root` paths for 
 * branches that exist on a linked worktree. Resolving to `fulfilled` state results in the `branchesSlice.extraReducer` 
 * automatically adding the new Branch to the Redux store.
 * @param root The worktree root directory of a valid branch in a git repository.
 * @param branchName An optional branch name to restrict the 
 * @return A remote-scoped Branch object.
 */
export const fetchLocalBranch = createAsyncThunk<Branch | undefined, { root: PathLike, branchName?: string }, AppThunkAPI>(
    'branches/fetchLocalBranch',
    async (input, thunkAPI) => {
        const { dir, gitdir } = await getWorktreePaths(input.root);
        if (!dir) {
            thunkAPI.rejectWithValue(`No repository found at root directory: ${input.root.toString()}`);
            return undefined;
        }
        const branchRoot = input.branchName ? await getBranchRoot(dir, input.branchName) : dir;
        const current = branchRoot ? await currentBranch({ dir: branchRoot, fullname: false }) : undefined;
        const branch = input.branchName ? input.branchName : !current ? 'HEAD' : current;
        const config = branch !== 'HEAD' ? await getConfig({ dir: dir, keyPath: `branch.${branch}.remote` }) : undefined;
        const remote = (config && config.scope !== 'none') ? config.value : 'origin';

        return {
            id: v4(),
            scope: 'local',
            ref: branch,
            root: branchRoot ? branchRoot : '',
            gitdir: gitdir ? gitdir : '',
            remote: remote
        };
    }
);

/**
 * Async thunk for generating a new remote-scoped Branch object. This function is capable of resolving `root` paths for 
 * branches that exist on a linked worktree. Resolving to `fulfilled` state results in the `branchesSlice.extraReducer` 
 * automatically adding the new Branch to the Redux store.
 * @param root The working tree directory path of a valid branch in a git repository.
 * @param branchName The branch name.
 * @return A remote-scoped Branch object.
 */
export const fetchRemoteBranch = createAsyncThunk<Branch | undefined, { root: PathLike, branchName: string }, AppThunkAPI>(
    'branches/fetchRemoteBranch',
    async (input, thunkAPI) => {
        const { dir, gitdir } = await getWorktreePaths(input.root);
        if (!dir || !gitdir) {
            thunkAPI.rejectWithValue(`No repository found at root directory: ${input.root.toString()}`);
            return undefined;
        }
        const config = await getConfig({ dir: dir, keyPath: `branch.${input.branchName}.remote` });
        const remote = (config.scope !== 'none') ? config.value : 'origin';

        return {
            id: v4(),
            scope: 'remote',
            ref: input.branchName,
            root: dir,
            gitdir: gitdir,
            remote: remote
        };
    }
);