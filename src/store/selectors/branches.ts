import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { branchesAdapter } from '../slices/branches';
import { RootState } from '../store';

const selectors = branchesAdapter.getSelectors<RootState>(state => state.branches);

const selectByRoot = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, root: PathLike) => root,
    (branches, root) => branches.filter(b => b.root === root)
)

const selectByGitdir = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, gitdir: PathLike) => gitdir,
    (branches, gitdir) => branches.filter(b => b.gitdir === gitdir)
)

const branchSelectors = {
    ...selectors, selectByRoot, selectByGitdir
};

export default branchSelectors;