import { RootState } from '../store';
import { Card, cardAdapter } from '../slices/cards';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import metafileSelectors from './metafiles';
import { flattenArray } from '../../containers/flatten';
import { UUID } from '../types';
import { Metafile } from '../slices/metafiles';

const selectors = cardAdapter.getSelectors<RootState>(state => state.cards);

const selectByIds = createSelector(
    selectors.selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (cards, ids) => ids.map(id => cards[id]).filter((c): c is Card => c !== undefined)
);

const selectByMetafile = createSelector(
    selectors.selectAll,
    (_state: RootState, metafile: UUID) => metafile,
    (cards, metafile) => cards.filter(c => c.metafile === metafile)
);

const selectByMetafiles = createSelector(
    selectors.selectAll,
    (_state: RootState, metafiles: Metafile[]) => metafiles,
    (cards, metafiles) => flattenArray(metafiles.map(m => cards.filter(c => c.metafile === m.id)))
);

/**
 * Custom Redux selector for locating cards that:
 *  (1) have a metafile associated with them,
 *  (2) that metafile contains a repo that matches the parameter repo,
 *  (3) that metafile contains a branch that matches the parameter branch (if needed)
 * 
 * @param state The state object for the Redux store.
 * @param repo The UUID of a Repository entry in the Redux store.
 * @param branch Git branch name or commit hash.
 * @returns An array of Card objects that meet the selection criteria.
 */
const selectByRepo = createSelector(
    selectors.selectAll,
    metafileSelectors.selectEntities,
    (_state: RootState, repoId: UUID) => repoId,
    (_state: RootState, _repoId: UUID, branch?: string) => branch,
    (cards, metafiles, repoId, branchId) => cards
        .filter(c => metafiles[c.metafile] ? metafiles[c.metafile]?.repo === repoId : false)
        .filter(c => branchId ? metafiles[c.metafile]?.branch === branchId : true)
);

const selectByStack = createSelector(
    selectors.selectAll,
    (_state: RootState, stackId: UUID) => stackId,
    (cards, stackId) => cards
        .filter(c => c.captured === stackId)
);

const selectByTarget = createSelector(
    selectors.selectAll,
    metafileSelectors.selectEntities,
    (_state: RootState, target: UUID) => target,
    (cards, metafiles, target) => cards.filter(c => c.type === 'Diff' && metafiles[c.metafile]?.targets?.includes(target))
);

const cardSelectors = { ...selectors, selectByIds, selectByMetafile, selectByMetafiles, selectByRepo, selectByStack, selectByTarget };

export default cardSelectors;