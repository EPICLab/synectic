import { EntityId } from '@reduxjs/toolkit';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { equalArrays, isDefined } from '../../containers/utils';
import { cacheAdapter } from '../slices/cache';
import { RootState } from '../store';

const selectors = cacheAdapter.getSelectors<RootState>((state) => state.cache);

type CacheEntities = ReturnType<typeof selectors.selectEntities>;

/**
 * Selector for retrieving Cache entities based on `id`; where filepath is used as the `id` for Cache entities. This selector caches on 
 * `id` as long as `state.cache.entities` has not changed. The persisted selector cache provided by 
 * [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entitites change in `selectEntities`, but not when `id` 
 * input selector changes.
 */
const selectById = createCachedSelector(
    selectors.selectEntities,
    (_state: RootState, id: EntityId) => id,
    (cache, id) => cache[id]
)({
    keySelector: (_, id) => id,
    selectorCreator: createSelectorCreator(defaultMemoize, {
        equalityCheck: (a: CacheEntities, prev: CacheEntities) =>
            equalArrays(Object.values(a).filter(isDefined), Object.values(prev).filter(isDefined))
    }),
});

/**
 * Selector for retrieving Cache entities based on `ids`; where filepath is used as the `id` for Cache entities. This selector caches on 
 * `filepaths` as long as `state.cache.entities` has not changed. The persisted selector cache provided by 
 * [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entitites change in `selectEntities`, but not when 
 * `filepaths` input selector changes.
 */
const selectByIds = createCachedSelector(
    selectors.selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (cache, ids) => ids.map(id => cache[id]).filter(isDefined)
)({
    keySelector: (_, ids) => ids.join(':'),
    selectorCreator: createSelectorCreator(defaultMemoize, {
        equalityCheck: (a: CacheEntities, prev: CacheEntities) =>
            equalArrays(Object.values(a).filter(isDefined), Object.values(prev).filter(isDefined))
    }),
});

const cacheSelectors = { ...selectors, selectById, selectByIds };

export default cacheSelectors;