import { EntityId, createSelector } from '@reduxjs/toolkit';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { flattenArray } from '../../containers/flatten';
import { equalArrays, filteredArrayEquality, isDefined } from '../../containers/utils';
import { Card, cardAdapter } from '../slices/cards';
import { RootState } from '../store';
import { UUID } from '../types';
import metafileSelectors from './metafiles';

const selectors = cardAdapter.getSelectors<RootState>(state => state.cards);

type CardEntities = ReturnType<typeof selectors.selectEntities>;
type MetafileEntities = ReturnType<typeof metafileSelectors.selectEntities>;

const deepEntitiesEqualityCheck = (a: CardEntities, b: CardEntities) =>
    filteredArrayEquality(Object.values(a).filter(isDefined), Object.values(b).filter(isDefined), ['id', 'modified']);
const deepCardsEqualityCheck = (a: Card[], b: Card[]) => filteredArrayEquality(a, b, ['id', 'modified']);

const selectEntities = createSelector(
    selectors.selectEntities,
    (branches) => branches,
    { memoizeOptions: { equalityCheck: deepEntitiesEqualityCheck } }
);

const selectById = createCachedSelector(
    selectEntities,
    (_state: RootState, id: EntityId) => id,
    (cards, id) => cards[id]
)({
    keySelector: (_, id) => id,
    selectorCreator: createSelectorCreator(defaultMemoize, { equalityCheck: deepEntitiesEqualityCheck })
});

const selectByIds = createCachedSelector(
    selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (cards, ids) => ids.map(id => cards[id]).filter(isDefined)
)({
    keySelector: (_, ids) => ids.join(':'),
    selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck)
});

const selectByMetafile = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, metafile: UUID) => metafile,
    (cards, metafile) => cards.filter(c => c.metafile === metafile)
)({
    keySelector: (_, metafile) => metafile,
    selectorCreator: createSelectorCreator(defaultMemoize, deepCardsEqualityCheck)
});

const selectByMetafiles = createCachedSelector(
    (state: RootState, metafiles: UUID[]) => metafiles.map(id => selectByMetafile(state, id)),
    (cards) => flattenArray(cards)
)({
    keySelector: (_, metafiles) => metafiles.join(':'),
    selectorCreator: createSelectorCreator(defaultMemoize, {
        equalityCheck: (a: Card[][], b: Card[][]) => equalArrays(a, b)
    })
});

const selectByStack = createCachedSelector(
    selectors.selectAll,
    (_state: RootState, stack: UUID) => stack,
    (cards, stack) => cards.filter(c => c.captured === stack)
)({
    keySelector: (_, stack) => stack,
    selectorCreator: createSelectorCreator(defaultMemoize, deepCardsEqualityCheck)
});

/**
 * Selector for retrieving Card entities based on `target`, using `target` UUID information stored on each Metafile instance. 
 * This selector caches on `target` as long as `selectAll` and `metafileSelectors.selectEntities` have not changed. The persisted 
 * selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `selectAll`
 * or `metafileSelectors.selectEntities` results change, but not when `target` input selector changes.
 */
const selectByTarget = createCachedSelector(
    selectors.selectAll,
    metafileSelectors.selectEntities,
    (_state: RootState, target: UUID) => target,
    (cards, metafiles, target) => cards
        .filter(c => c.type === 'Diff' && metafiles[c.metafile]?.targets?.includes(target))
)({
    keySelector: (_, target) => target,
    selectorCreator: createSelectorCreator(defaultMemoize, {
        equalityCheck: (a: Card[] | MetafileEntities | UUID, b: Card[] | MetafileEntities | UUID) => {
            return Array.isArray(a) && Array.isArray(b) ? deepCardsEqualityCheck(a, b) : a === b;
        },
        resultEqualityCheck: deepCardsEqualityCheck
    })
});

/**
 * Selector for retrieving Card entities based on `repo` and `branch` (optional). This selector caches on `repo` and
 * `branch` as long as `selectAll` and `metafileSelectors.selectEntities` have not changed. The persisted selector 
 * cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `selectAll`
 * or `metafileSelectors.selectEntities` results change, but not when `repo` or `branch` input selectors change.
 */
const selectByRepo = createCachedSelector(
    selectors.selectAll,
    metafileSelectors.selectEntities,
    (_state: RootState, repo: UUID) => repo,
    (_state: RootState, _repo: UUID, branch?: UUID) => branch,
    (cards, metafiles, repo, branch) => cards
        .filter(c => metafiles[c.metafile]?.repo === repo)
        .filter(c => branch ? metafiles[c.metafile]?.branch === branch : true)
)({
    keySelector: (_, repo, branch?: UUID) => `${repo}:${branch}`,
    selectorCreator: createSelectorCreator(defaultMemoize, {
        equalityCheck: (a: Card[] | MetafileEntities | UUID, b: Card[] | MetafileEntities | UUID) => {
            return Array.isArray(a) && Array.isArray(b) ? deepCardsEqualityCheck(a, b) : a === b;
        },
        resultEqualityCheck: deepCardsEqualityCheck
    })
});

const cardSelectors = {
    ...selectors, selectEntities, selectById, selectByIds, selectByMetafile, selectByMetafiles,
    selectByStack, selectByTarget, selectByRepo
};

export default cardSelectors;