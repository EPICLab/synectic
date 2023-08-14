import { EntityId, createSelector } from '@reduxjs/toolkit';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { filteredArrayEquality, isDefined } from '../../containers/utils';
import { cardAdapter } from '../slices/cards';
import { RootState } from '../store';

const selectors = cardAdapter.getSelectors<RootState>(state => state.cards);

type CardEntities = ReturnType<typeof selectors.selectEntities>;

const deepEntitiesEqualityCheck = (a: CardEntities, b: CardEntities) =>
  filteredArrayEquality(Object.values(a).filter(isDefined), Object.values(b).filter(isDefined), [
    'id',
    'modified'
  ]);

const selectEntities = createSelector(selectors.selectEntities, branches => branches, {
  memoizeOptions: { equalityCheck: deepEntitiesEqualityCheck }
});

const selectById = createCachedSelector(
  selectEntities,
  (_state: RootState, id: EntityId) => id,
  (cards, id) => cards[id]
)({
  keySelector: (_, id) => id,
  selectorCreator: createSelectorCreator(defaultMemoize, {
    equalityCheck: deepEntitiesEqualityCheck
  })
});

const selectByIds = createCachedSelector(
  selectEntities,
  (_state: RootState, ids: EntityId[]) => ids,
  (cards, ids) => ids.map(id => cards[id]).filter(isDefined)
)({
  keySelector: (_, ids) => ids.join(':'),
  selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck)
});

const cardSelectors = {
  ...selectors,
  selectEntities,
  selectById,
  selectByIds
};

export default cardSelectors;
