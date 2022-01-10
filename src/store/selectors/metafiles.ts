import { createDraftSafeSelector, EntityId } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { relative } from 'path';
import type { Card, FilesystemStatus, Metafile, UUID } from '../../types';
import { metafilesAdapter } from '../slices/metafiles';
import { RootState } from '../store';

const selectors = metafilesAdapter.getSelectors<RootState>(state => state.metafiles);

const selectByIds = createDraftSafeSelector(
    selectors.selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (metafiles, ids) => ids.map(id => metafiles[id]).filter((c): c is Metafile => c !== undefined)
)

const selectByFilepath = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, filepath: PathLike) => filepath,
    (metafiles, filepath) => metafiles.filter(m => (m && m.path) && relative(m.path.toString(), filepath.toString()).length === 0)
);

const selectByRepo = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, repo: UUID) => repo,
    (metafiles, repo) => metafiles.filter(m => m.repo === repo)
)

const selectByBranch = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, filepath: PathLike) => filepath,
    (_state: RootState, _filepath: PathLike, branch: UUID) => branch,
    (metafiles, filepath, branch) => metafiles.filter(m => m.path === filepath && m.branch === branch)
);

const selectByVirtual = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, name: string) => name,
    (_state: RootState, _name: string, handler: string) => handler,
    (metafiles, name, handler) => metafiles.filter(m => m.name === name && m.handler === handler)
);

const selectByState = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, state: FilesystemStatus) => state,
    (metafiles, state) => metafiles.filter(m => m.state === state)
);

const selectByCards = createDraftSafeSelector(
    selectors.selectEntities,
    (_state: RootState, cards: Card[]) => cards,
    (metafiles, cards) => cards.map(card => metafiles[card.metafile])
);

const selectByConflicted = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, repoId: UUID) => repoId,
    (metafiles, repo) => metafiles.filter(m => m.repo === repo && m.conflicts !== undefined && m.conflicts.length > 0)
);

const metafileSelectors = {
    ...selectors, selectByIds, selectByFilepath, selectByRepo, selectByBranch,
    selectByVirtual, selectByState, selectByCards, selectByConflicted
};

export default metafileSelectors;