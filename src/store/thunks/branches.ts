import * as fs from 'fs-extra';
import * as path from 'path';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs';
import { v4 } from 'uuid';
import { removeUndefined } from '../../containers/format';
import { currentBranch, getBranchRoot, getRepoRoot } from '../../containers/git-porcelain';
import { isLinkedWorktree, resolveLinkToRoot } from '../../containers/git-worktree';
import type { Branch } from '../../types';
import { AppThunkAPI } from '../hooks';
import { fetchParentMetafile, FilebasedMetafile } from './metafiles';
import { listBranches } from 'isomorphic-git';

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
            const root = await getRepoRoot(metafile.path);
            const current = root ? await currentBranch({ dir: root, fullname: false }) : undefined;
            if (branch && current && branch.name === current) return branch;
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
        return root ? await thunkAPI.dispatch(fetchNewBranch(root)).unwrap() : undefined;
    }
);

export const fetchBranches = createAsyncThunk<Branch[], PathLike, AppThunkAPI>(
    'branches/fetchBranches',
    async (root, thunkAPI) => {
        const mainRoot = (await isLinkedWorktree({ dir: root })) ? await resolveLinkToRoot(root) : root;
        const local = await listBranches({ fs: fs, dir: root.toString() });

        const getBranch = async (branchName: string): Promise<Branch | undefined> => {
            const branchRoot = mainRoot ? await getBranchRoot(mainRoot, branchName) : undefined;
            const existing = branchRoot ? await thunkAPI.dispatch(fetchBranchByFilepath(branchRoot)).unwrap() : undefined;
            if (existing) return existing;
            return branchRoot ? await thunkAPI.dispatch(fetchNewBranch(branchRoot)).unwrap() : undefined;
        }
        return removeUndefined(await Promise.all(local.map(b => getBranch(b))));
    }
);

export const fetchNewBranch = createAsyncThunk<Branch, PathLike>(
    'branches/fetchNew',
    async (root) => {
        const current = await currentBranch({ dir: root, fullname: false });
        const branch = !current ? 'HEAD' : current;
        const dir = (await isLinkedWorktree({ dir: root })) ? await resolveLinkToRoot(root) : root.toString();

        return {
            id: v4(),
            name: branch,
            root: root,
            gitdir: dir ? path.join(dir, '.git') : ''
        };
    }
);