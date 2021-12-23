import { RootState } from '../store';
import { cardsAdapter } from '../slices/cards';
import { createDraftSafeSelector, EntityId } from '@reduxjs/toolkit';
import { Card, Metafile, UUID } from '../../types';
import metafileSelectors from './metafiles';
import { flattenArray } from '../../containers/flatten';

const selectors = cardsAdapter.getSelectors<RootState>(state => state.cards);

const selectByIds = createDraftSafeSelector(
    selectors.selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (cards, ids) => ids.map(id => cards[id]).filter((c): c is Card => c !== undefined)
)

/**
 * Custom Redux selector for locating cards that:
 *  (1) have a metafile associated with them,
 *  (2) that metafile contains a repo that matches the parameter repo,
 *  (3) that metafile contains a branch that matches the parameter branch (if needed)
 * @param state The state object for the Redux store.
 * @param repo The UUID of a Repository entry in the Redux store.
 * @param branch Git branch name or commit hash.
 * @returns An array of Card objects that meet the selection criteria.
 */
const selectByRepo = createDraftSafeSelector(
    selectors.selectAll,
    metafileSelectors.selectEntities,
    (_state: RootState, repoId: UUID) => repoId,
    (_state: RootState, _repoId: UUID, branch?: string) => branch,
    (cards, metafiles, repoId, branch) => cards
        .filter(c => metafiles[c.metafile] ? metafiles[c.metafile]?.repo === repoId : false)
        .filter(c => branch ? metafiles[c.metafile]?.branch === branch : true)
);

const selectByStack = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, stackId: UUID) => stackId,
    (cards, stackId) => cards
        .filter(c => c.captured === stackId)
)

const selectByMetafiles = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, metafiles: Metafile[]) => metafiles,
    (cards, metafiles) => flattenArray(metafiles.map(m => cards.filter(c => c.metafile === m.id)))
)

const cardSelectors = { ...selectors, selectByIds, selectByRepo, selectByStack, selectByMetafiles };

export default cardSelectors;