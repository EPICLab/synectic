import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { removeDuplicates } from '../../containers/format';
import type { Branch, Repository } from '../../types';
import { branchesAdapter } from '../slices/branches';
import { RootState } from '../store';

const selectors = branchesAdapter.getSelectors<RootState>(state => state.branches);

const selectByRef = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, ref: string) => ref,
    (branches, ref) => branches.filter(b => b.ref === ref)
)

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

const selectByRepo = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, repo: Repository) => repo,
    (_state: RootState, _repo: Repository, dedup?: boolean) => dedup ? dedup : false,
    (branches, repo, dedup) => dedup ?
        removeDuplicates(
            branches.filter(branch => repo.local.includes(branch.id) || repo.remote.includes(branch.id)),
            (a: Branch, b: Branch) => a.ref === b.ref) :
        branches.filter(branch => repo.local.includes(branch.id) || repo.remote.includes(branch.id))
)

const branchSelectors = {
    ...selectors, selectByRef, selectByRoot, selectByGitdir, selectByRepo
};

export default branchSelectors;