import { EntityId } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { isEqualPaths } from '../../containers/io';
import { equalArrays, isDefined } from '../../containers/utils';
import { repoAdapter, Repository } from '../slices/repos';
import { RootState } from '../store';

const selectors = repoAdapter.getSelectors<RootState>(state => state.repos);

type RepoEntities = ReturnType<typeof selectors.selectEntities>;

const shallowEntitiesEqualityCheck = (a: RepoEntities, b: RepoEntities) =>
    equalArrays(Object.values(a).filter(isDefined), Object.values(b).filter(isDefined));
const shallowReposEqualityCheck = (a: Repository[], b: Repository[]) => equalArrays(a, b);

/**
 * Selector for retrieving Repository entities based on `id`. This selector caches on `id` as long as `state.repos.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entitites change in
 * `selectEntities`, but not when `id` input selector changes.
 */
const selectById = createCachedSelector(
    selectors.selectEntities,
    (_state: RootState, id: EntityId) => id,
    (repos, id) => repos[id]
)({
    keySelector: (_, id) => id,
    selectorCreator: createSelectorCreator(defaultMemoize, shallowEntitiesEqualityCheck),
});

/**
 * Selector for retrieving Repository entities based on `name`. This selector caches on `name` as long as `state.repos.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entities change in
 * `selectAll`, but not when `name` input selector changes.
 */
const selectByName = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, name: string) => name,
    (repos, name): Repository | undefined => repos.find(repo => repo.name === name)
)({
    keySelector: (_, name) => name,
    selectorCreator: createSelectorCreator(defaultMemoize, shallowReposEqualityCheck),
});

/**
 * Selector for retrieving Repository entities based on `root`. This selector caches on `root` as long as `state.repos.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entities change in
 * `selectAll`, but not when `root` input selector changes.
 */
const selectByRoot = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, root: PathLike) => root,
    (repos, root) => repos.find(r => isEqualPaths(root, r.root))
)({
    keySelector: (_, root) => root,
    selectorCreator: createSelectorCreator(defaultMemoize, shallowReposEqualityCheck),
});

/**
 * Selector for retrieving Repository entities based on `url`. This selector caches on `url` as long as `state.repos.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entities change in
 * `selectAll`, but not when `url` input selector changes.
 */
const selectByUrl = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, url: string) => url,
    (repos, url): Repository | undefined => repos.find(repo => repo.url === url)
)({
    keySelector: (_, url) => url,
    selectorCreator: createSelectorCreator(defaultMemoize, shallowReposEqualityCheck),
});

const repoSelectors = { ...selectors, selectById, selectByName, selectByRoot, selectByUrl };

export default repoSelectors;