import { createSelector, EntityId } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import type { Branch, Repository } from '../../types';
import { branchesAdapter } from '../slices/branches';
import { RootState } from '../store';

const selectors = branchesAdapter.getSelectors<RootState>(state => state.branches);

const selectByIds = createSelector(
    selectors.selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (branches, ids) => ids.map(id => branches[id]).filter((b): b is Branch => b !== undefined)
)

const selectByRef = createSelector(
    selectors.selectAll,
    (_state: RootState, ref: string) => ref,
    (branches, ref) => branches.filter(b => b.ref === ref)
)

const selectByRoot = createSelector(
    selectors.selectAll,
    (_state: RootState, root: PathLike) => root,
    (branches, root) => branches.filter(b => b.root === root)
)

const selectByGitdir = createSelector(
    selectors.selectAll,
    (_state: RootState, gitdir: PathLike) => gitdir,
    (branches, gitdir) => branches.filter(b => b.gitdir === gitdir)
)

const selectByRepo = createSelector(
    selectors.selectAll,
    (_state: RootState, repo: Repository) => repo,
    (_state: RootState, _repo: Repository, dedup?: boolean) => dedup ? dedup : false,
    (branches, repo, dedup) => dedup
        ? branches.reduce((accumulator: Branch[], branch) => {
            if (repo.local.includes(branch.id)) {
                // prefer local branches, remove matching remote branch if already added
                return (accumulator.push(branch), accumulator)
                    .filter(branch => !(branch.scope === 'remote' && branch.ref === branch.ref));
            } else if (repo.remote.includes(branch.id) && !accumulator.some(b => b.scope === 'local' && b.ref === branch.ref)) {
                // prefer local branches, only add remote if no matching local branch
                return (accumulator.push(branch), accumulator);
            }
            return accumulator;
        }, [])
        : branches.filter(branch => repo.local.includes(branch.id) || repo.remote.includes(branch.id))
)

const branchSelectors = {
    ...selectors, selectByIds, selectByRef, selectByRoot, selectByGitdir, selectByRepo
};

export default branchSelectors;