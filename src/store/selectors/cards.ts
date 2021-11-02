import { RootState } from '../store';
import { cardsAdapter } from '../slices/cards';
import { createDraftSafeSelector } from '@reduxjs/toolkit';
import { UUID } from '../../types';
import metafileSelectors from './metafiles';

const selectors = cardsAdapter.getSelectors<RootState>(state => state.cards);

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
    (_state, _repoId, branch?: string) => branch,
    (cards, metafiles, repoId, branch) => cards
        .filter(c => metafiles[c.metafile] ? metafiles[c.metafile]?.repo === repoId : false)
        .filter(c => branch ? metafiles[c.metafile]?.branch === branch : true)
);

const cardSelectors = { ...selectors, selectByRepo };

export default cardSelectors;