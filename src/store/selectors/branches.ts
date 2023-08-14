import { createSelector, EntityId } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { filteredArrayEquality, isDefined } from '../../containers/utils';
import { Branch, branchAdapter } from '../slices/branches';
import { Repository } from '../slices/repos';
import { RootState } from '../store';
import repoSelectors from './repos';

const selectors = branchAdapter.getSelectors<RootState>(state => state.branches);

type BranchEntities = ReturnType<typeof selectors.selectEntities>;

const deepEntitiesEqualityCheck = (a: BranchEntities, b: BranchEntities) =>
  filteredArrayEquality(Object.values(a).filter(isDefined), Object.values(b).filter(isDefined), [
    'id',
    'head',
    'status',
    'linked',
    'commits'
  ]);
const deepBranchesEqualityCheck = (a: Branch[], b: Branch[]) =>
  filteredArrayEquality(a, b, ['id', 'head', 'status', 'linked', 'commits']);

const selectEntities = createSelector(selectors.selectEntities, branches => branches, {
  memoizeOptions: { equalityCheck: deepEntitiesEqualityCheck }
});

const selectById = createCachedSelector(
  selectEntities,
  (_state: RootState, id: EntityId) => id,
  (branches, id) => branches[id]
)({
  keySelector: (_, id) => id,
  selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck)
});

const selectByIds = createCachedSelector(
  selectEntities,
  (_state: RootState, ids: EntityId[]) => ids,
  (branches, ids) => ids.map(id => branches[id]).filter(isDefined)
)({
  keySelector: (_, ids) => ids.join(':'),
  selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck)
});

const selectByRef = createCachedSelector(
  selectors.selectAll,
  (_state: RootState, root: PathLike) => root,
  (_state: RootState, _root: PathLike, ref: string) => ref,
  (_state: RootState, _root: PathLike, _ref: string, scope: Branch['scope']) => scope,
  (branches, root, ref, scope) =>
    branches.find(
      b => window.api.fs.isEqualPaths(b.root, root) && b.ref === ref && b.scope === scope
    )
)({
  keySelector: (_, root, ref: string, scope: Branch['scope']) =>
    `${root.toString()}:${ref}:${scope}`,
  selectorCreator: createSelectorCreator(defaultMemoize, {
    equalityCheck: deepBranchesEqualityCheck
  })
});

const selectByRoot = createCachedSelector(
  selectors.selectAll,
  (_state: RootState, root: PathLike) => root,
  (branches, root) => branches.filter(b => window.api.fs.isEqualPaths(b.root, root))
)({
  keySelector: (_, root) => root,
  selectorCreator: createSelectorCreator(defaultMemoize, deepBranchesEqualityCheck)
});

const selectByGitdir = createCachedSelector(
  selectors.selectAll,
  (_state: RootState, gitdir: PathLike) => gitdir,
  (branches, gitdir) => branches.filter(b => window.api.fs.isEqualPaths(b.gitdir, gitdir))
)({
  keySelector: (_, gitdir) => gitdir,
  selectorCreator: createSelectorCreator(defaultMemoize, deepBranchesEqualityCheck)
});

/**
 * Selector for retrieving Branch entities based on `repo`, using `local` and `remote` branch
 * information stored on each Repository instance. This selector caches on `repo.id` and `dedup`
 * as long as `selectAll` and `repoSelectors.selectById` have not changed. The persisted selector
 * cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated
 * only when the `selectAll` or `repoSelectors.selectById` results change, but not when `repo.id`
 * or `dedup` input selectors change.
 */
const selectByRepo = createCachedSelector(
  selectors.selectAll,
  (state: RootState, id: EntityId) => repoSelectors.selectById(state, id),
  (_state: RootState, _id: EntityId, dedup = false) => dedup,
  (branches, repo, dedup) =>
    branches.reduce((accumulator: Branch[], branch) => {
      if (repo?.local.includes(branch.id)) {
        // if dedup, then prefer local branch and remove any matching remote branch
        const updated = (accumulator.push(branch), accumulator);
        return dedup
          ? updated.filter(b => !(b.scope === 'remote' && b.ref === branch.ref))
          : updated;
      }
      if (repo?.remote.includes(branch.id)) {
        // if dedup, then prefer local branch and only add remote branch if no existing match
        return (dedup && !accumulator?.some(b => b.scope === 'local' && b.ref === branch.ref)) ||
          !dedup
          ? (accumulator.push(branch), accumulator)
          : accumulator;
      }
      return accumulator;
    }, [])
)({
  keySelector: (_, id, dedup: boolean) => `${id}:${dedup}`,
  selectorCreator: createSelectorCreator(defaultMemoize, {
    equalityCheck: (
      a: Branch[] | Repository | undefined | boolean,
      b: Branch[] | Repository | undefined | boolean
    ) => (Array.isArray(a) && Array.isArray(b) ? deepBranchesEqualityCheck(a, b) : a === b),
    resultEqualityCheck: (a: BranchEntities, b: BranchEntities) => deepEntitiesEqualityCheck(a, b)
  })
});

const branchSelectors = {
  ...selectors,
  selectEntities,
  selectById,
  selectByIds,
  selectByRef,
  selectByRoot,
  selectByGitdir,
  selectByRepo
};

export default branchSelectors;
