import * as path from 'path';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs';
import { v4 } from 'uuid';
import { removeUndefined } from '../../containers/format';
import { currentBranch, getBranchRoot, getConfig, getRepoRoot } from '../../containers/git-porcelain';
import { isLinkedWorktree, resolveLinkToRoot } from '../../containers/git-worktree';
import type { Branch } from '../../types';
import { AppThunkAPI } from '../hooks';
import { fetchParentMetafile, FilebasedMetafile } from './metafiles';

export const fetchBranchByFilepath = createAsyncThunk<Branch | undefined, PathLike, AppThunkAPI>(
    'branches/fetchByFilepath',
    async (filepath, thunkAPI) => {
        const root = await getRepoRoot(filepath);
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

        const root = await getRepoRoot(metafile.path);
        return root ? await thunkAPI.dispatch(fetchLocalBranch({ root: root })).unwrap() : undefined;
    }
);

/**
 * Async thunk for generating a new local-scoped Branch object. This function is capable of resolving `root` paths for 
 * branches that exist on a linked worktree. Resolving to `fulfilled` state results in the `branchesSlice.extraReducer` 
 * automatically adding the new Branch to the Redux store.
 * @param root The working tree directory path of a valid branch in a git repository.
 * @param branchName An optional branch name to restrict the 
 * @return A remote-scoped Branch object.
 */
export const fetchLocalBranch = createAsyncThunk<Branch | undefined, { root: PathLike, branchName?: string }, AppThunkAPI>(
    'branches/fetchLocalBranch',
    async (input, thunkAPI) => {
        const mainRoot = (await isLinkedWorktree({ dir: input.root })) ? await resolveLinkToRoot(input.root) : input.root;
        if (!mainRoot) {
            thunkAPI.rejectWithValue(`No repository found at root directory: ${input.root.toString()}`);
            return undefined;
        }
        const branchRoot = input.branchName ? await getBranchRoot(mainRoot, input.branchName) : mainRoot;
        const current = branchRoot ? await currentBranch({ dir: branchRoot, fullname: false }) : undefined;
        const branch = !current ? 'HEAD' : current;
        const config = branch !== 'HEAD' ? await getConfig({ dir: mainRoot, keyPath: `branch.${branch}.remote` }) : undefined;
        const remote = (config && config.scope !== 'none') ? config.value : 'origin';

        return {
            id: v4(),
            scope: 'local',
            ref: branch,
            root: branchRoot ? branchRoot : '',
            gitdir: mainRoot ? path.join(mainRoot.toString(), '.git') : '',
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
        const mainRoot = (await isLinkedWorktree({ dir: input.root })) ? await resolveLinkToRoot(input.root) : input.root;
        if (!mainRoot) {
            thunkAPI.rejectWithValue(`No repository found at root directory: ${input.root.toString()}`);
            return undefined;
        }
        const config = await getConfig({ dir: mainRoot, keyPath: `branch.${input.branchName}.remote` });
        const remote = (config.scope !== 'none') ? config.value : 'origin';

        return {
            id: v4(),
            scope: 'remote',
            ref: input.branchName,
            root: mainRoot,
            gitdir: path.join(mainRoot.toString(), '.git'),
            remote: remote
        };
    }
);