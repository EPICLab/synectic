import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { ReadCommitResult } from 'isomorphic-git';
import { PURGE } from 'redux-persist';
import { UUID } from '../types';

export type Branch = {
    /** The UUID for Branch object. */
    readonly id: UUID;
    /** The name of branch. */
    readonly ref: string;
    /** The relative or absolute path to the working tree directory path. This is the worktree root directory in the case of linked worktrees,
     * and the parent of the root directory (.git) in the main worktree otherwise. */
    readonly root: PathLike;
    /** The relative or absolute path to the git root directory (.git) in the main worktree. */
    readonly gitdir: PathLike;
    /** The reference scope of the branch; typically a branch will have an instance of both a `local` and `remote` branch. */
    readonly scope: 'local' | 'remote';
    /** The name of the remote to fetch from/push to using `git fetch` and `git push` commands for this branch; default is `origin`. */
    readonly remote: string;
    /** The list of commit descriptions for commits within this branch. */
    readonly commits: ReadCommitResult[];
    /** The SHA-1 hash of the commit pointed to by HEAD on this branch. */
    readonly head: string;
}

export const branchAdapter = createEntityAdapter<Branch>();

export const branchSlice = createSlice({
    name: 'branches',
    initialState: branchAdapter.getInitialState(),
    reducers: {
        branchAdded: branchAdapter.addOne,
        branchRemoved: branchAdapter.removeOne,
        branchUpdated: branchAdapter.upsertOne
    },
    extraReducers: (builder) => {
        builder
            .addCase(PURGE, (state) => {
                branchAdapter.removeAll(state);
            })
    }
});

export const { branchAdded, branchRemoved, branchUpdated } = branchSlice.actions;

export default branchSlice.reducer;