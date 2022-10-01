import { createSelector, EntityId } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { relative, sep } from 'path';
import { isEqualPaths } from '../../containers/io';
import { Card } from '../slices/cards';
import { FilebasedMetafile, isFilebasedMetafile, isFileMetafile, Metafile, metafileAdapter, VersionedMetafile, VirtualMetafile } from '../slices/metafiles';
import { RootState } from '../store';
import { FilesystemStatus, UUID } from '../types';

const selectors = metafileAdapter.getSelectors<RootState>(state => state.metafiles);

const selectByIds = createSelector(
    selectors.selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (metafiles, ids) => ids.map(id => metafiles[id]).filter((c): c is Metafile => c !== undefined)
)

const selectByFilepath = createSelector(
    selectors.selectAll,
    (_state: RootState, filepath: PathLike) => filepath,
    (metafiles, filepath) => metafiles.filter(m =>
        (m && m.path) && isEqualPaths(m.path, filepath)) as FilebasedMetafile[]
);

const selectByFilepaths = createSelector(
    selectors.selectAll,
    (_state: RootState, filepaths: PathLike[]) => filepaths,
    (metafiles, filepaths) => metafiles.filter(m =>
        filepaths.find(f => m.path && isEqualPaths(m.path, f))) as FilebasedMetafile[]
);

const selectByRoot = createSelector(
    selectors.selectAll,
    (_state: RootState, root: PathLike) => root,
    (metafiles, root) => metafiles.filter(m =>
        isFilebasedMetafile(m) &&
        m.path.toString() !== root.toString() &&
        !relative(root.toString(), m.path.toString()).startsWith('..') &&
        !relative(root.toString(), m.path.toString()).includes(sep)
    ) as FilebasedMetafile[]
);

const selectByRepo = createSelector(
    selectors.selectAll,
    (_state: RootState, repo: UUID) => repo,
    (metafiles, repo) => metafiles.filter(m => m.repo === repo) as VersionedMetafile[]
);

const selectByBranch = createSelector(
    selectors.selectAll,
    (_state: RootState, branch: UUID) => branch,
    (_state: RootState, _branch: UUID, filepath?: PathLike) => filepath,
    (metafiles, filepath, branch) => filepath
        ? metafiles.filter(m => m.path === filepath && m.branch === branch) as VersionedMetafile[]
        : metafiles.filter(m => m.branch === branch) as VersionedMetafile[]
);

const selectByVirtual = createSelector(
    selectors.selectAll,
    (_state: RootState, name: string) => name,
    (_state: RootState, _name: string, handler: string) => handler,
    (metafiles, name, handler) => metafiles.filter(m => m.name === name && m.handler === handler) as VirtualMetafile[]
);

const selectByState = createSelector(
    selectors.selectAll,
    (_state: RootState, state: FilesystemStatus) => state,
    (metafiles, state) => metafiles.filter(m => m.state === state) as FilebasedMetafile[]
);

const selectByCards = createSelector(
    selectors.selectEntities,
    (_state: RootState, cards: Card[]) => cards,
    (metafiles, cards) => cards.map(card => metafiles[card.metafile])
);

const selectByConflicted = createSelector(
    selectors.selectAll,
    (_state: RootState, repoId: UUID) => repoId,
    (metafiles, repo) => metafiles.filter(m =>
        m.repo === repo && m.conflicts !== undefined && m.conflicts.length > 0) as VersionedMetafile[]
);

const selectStagedFieldsByRepo = createSelector(
    selectors.selectAll,
    (_state: RootState, repoId: UUID) => repoId,
    (metafiles, repo) => metafiles.filter(isFileMetafile)
        .filter(m => m.repo === repo && m.status && ['added', 'modified', 'deleted'].includes(m.status))
        .map(m => { return { id: m.id, repo: m.repo, branch: m.branch, status: m.status } })
)

const selectStagedByBranch = createSelector(
    selectors.selectAll,
    (_state: RootState, branchId: UUID) => branchId,
    (metafiles, branch) => metafiles.filter(isFileMetafile)
        .filter(m => m.branch === branch && m.status && ['added', 'modified', 'deleted'].includes(m.status))
)

const selectUnstagedByBranch = createSelector(
    selectors.selectAll,
    (_state: RootState, branchId: UUID) => branchId,
    (metafiles, branch) => metafiles.filter(isFileMetafile)
        .filter(m => m.branch === branch && m.status && ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(m.status))
)

const metafileSelectors = {
    ...selectors, selectByIds, selectByFilepath, selectByFilepaths, selectByRoot, selectByRepo, selectByBranch,
    selectByVirtual, selectByState, selectByCards, selectByConflicted, selectStagedFieldsByRepo, selectStagedByBranch, selectUnstagedByBranch
};

export default metafileSelectors;