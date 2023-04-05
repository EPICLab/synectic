import { EntityId } from '@reduxjs/toolkit';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { equalArrays, isDefined } from '../../containers/utils';
import { modalAdapter } from '../slices/modals';
import { RootState } from '../store';
import { ModalType } from '../types';

export const selectors = modalAdapter.getSelectors<RootState>(state => state.modals);

type ModalEntities = ReturnType<typeof selectors.selectEntities>;

const shallowEntitiesEqualityCheck = (a: ModalEntities, prev: ModalEntities) =>
    equalArrays(Object.values(a).filter(isDefined), Object.values(prev).filter(isDefined));

/**
 * Selector for retrieving Modal entities based on `id`. This selector caches on `id` as long as `state.modal.entities` has not changed.
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
 * Selector for retrieving Modal entities based on `type`. This selector caches on `type` as long as `state.modals.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entities change in
 * `selectAll`, but not when `type` input selector changes.
 */
const selectByType = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, type: ModalType) => type,
    (modals, type) => modals.filter(m => m.type === type)
)({
    keySelector: (_, type) => type,
    selectorCreator: createSelectorCreator(defaultMemoize, shallowEntitiesEqualityCheck),
});

const modalSelectors = { ...selectors, selectById, selectByType };

export default modalSelectors;