import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { Override, isDefined } from '../../containers/utils';
import { BranchStatus, PathLike, UUID } from '../types';

/**
 * TODO: (bare) branches don't have a branch name, but have everything else (including possibly a
 * linked-worktree)
 * TODO: (detached HEAD) branches don't have a branch name
 */

export type Branch = {
  /** The UUID for Branch object. */
  readonly id: UUID;
  /** The name of branch, or `detached` if the branch points directly to a commit. */
  readonly ref: string | 'detached';
  /**
   * The branch exists in a linked worktree; i.e. the branch is not the current branch in the main
   * worktree directory.
   */
  readonly linked: boolean;
  /**
   * The branch is current branch in the repository root path; i.e. the main worktree contains
   * files tracked by this branch.
   */
  readonly current: boolean;
  /**
   * No working tree exists because the directory is part of a bare repository; i.e. commits
   * cannot be made to it.
   */
  readonly bare: boolean;
  /**
   * The relative or absolute path to the working tree directory path. This is the worktree
   * directory in the case of linked worktrees, and the parent of the root directory (.git) in the
   * main worktree otherwise.
   */
  readonly root: PathLike;
  /**
   * The relative or absolute path to the git root directory (.git) in the working tree directory
   * path. This is the worktree root directory in the case of linked worktrees, and the main
   * worktree git directory in the main worktree otherwise.
   */
  readonly gitdir: PathLike;
  /**
   * The reference scope of the branch; a branch can exist in either scope, or both scopes at the
   * same time.
   */
  readonly scope: 'local' | 'remote';
  /**
   * The name of the remote to fetch from/push to using `git fetch` and `git push` commands for
   * this branch; default is `origin`.
   */
  readonly remote: string;
  /** The latest Git branch status for this branch relative to index and any remote refs. */
  readonly status: BranchStatus;
  /** An array with all Commit object UUIDs for commit object refs associated with this branch. */
  readonly commits: UUID[];
  /** The SHA-1 hash of the commit pointed to by HEAD on this branch. */
  readonly head: string;
};

export type UnmergedBranch = Override<Branch, UnmergedProps>;
export type UnmergedProps = {
  /**
   * The branch name (or SHA-1 commit hash) of the compare revision for an in-progress merge where
   * this branch is the base.
   */
  readonly merging: string;
  readonly status: 'unmerged';
};
export const isUnmergedBranch = (branch: Branch | undefined): branch is UnmergedBranch => {
  return isDefined(branch) && (branch as UnmergedBranch).merging !== undefined;
};

export const branchAdapter = createEntityAdapter<Branch>();

export const branchSlice = createSlice({
  name: 'branches',
  initialState: branchAdapter.getInitialState(),
  reducers: {
    branchAdded: branchAdapter.addOne,
    branchRemoved: branchAdapter.removeOne,
    branchUpdated: branchAdapter.upsertOne,
    branchReplaced: branchAdapter.setOne
  }
  // extraReducers: (builder) => {
  //     builder
  //         .addCase(PURGE, (state) => {
  //             branchAdapter.removeAll(state);
  //         })
  // }
});

export const { branchAdded, branchRemoved, branchReplaced, branchUpdated } = branchSlice.actions;

export default branchSlice.reducer;
