import { createSelector, EntityId } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { flattenArray } from '../../containers/flatten';
import { isDescendant, isEqualPaths } from '../../containers/io';
import { equalArrays, filteredArrayEquality, isDefined, isModified, isStaged, isUnmerged } from '../../containers/utils';
import { Card } from '../slices/cards';
import { FilebasedMetafile, isDirectoryMetafile, isFilebasedMetafile, isFileMetafile, isVersionedMetafile, isVirtualMetafile, Metafile, metafileAdapter } from '../slices/metafiles';
import { RootState } from '../store';
import { CardType, FilesystemStatus, UUID } from '../types';

const selectors = metafileAdapter.getSelectors<RootState>(state => state.metafiles);

type MetafileEntities = ReturnType<typeof selectors.selectEntities>;
type DescendantMetafiles = { directories: FilebasedMetafile[], files: FilebasedMetafile[] };

const deepEntitiesEqualityCheck = (a: MetafileEntities, b: MetafileEntities) =>
    filteredArrayEquality(Object.values(a).filter(isDefined), Object.values(b).filter(isDefined), ['id', 'modified']);
const deepMetafilesEqualityCheck = (a: Metafile[], b: Metafile[]) => filteredArrayEquality(a, b, ['id', 'modified']);

/**
 * Selector that returns the `state.metafiles.entities` lookup table. Equality checks are performed against the `id` and `modified` fields of
 * Metafile entities only, to prevent unnecessary rerendering.
 */
const selectEntities = createSelector(
    selectors.selectEntities,
    (metafiles) => metafiles,
    { memoizeOptions: { equalityCheck: deepEntitiesEqualityCheck } }
);

/**
 * Selector for mapping over the `state.metafiles.ids` array, and returning an array of Metafile entities in the same order. Equality checks are 
 * performed against the `id` and `modified` fields of Metafile entities only, to prevent unnecessary rerendering.
 */
const selectAll = createSelector(
    selectors.selectAll,
    (metafiles) => metafiles,
    { memoizeOptions: { equalityCheck: deepMetafilesEqualityCheck } }
);

/**
 * Selector for retrieving Metafile entities based on `id`. This selector caches on `id` as long as `state.metafiles.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `id` or `modified`
 * fields change in `selectEntities`, but not when `id` input selector changes.
 */
const selectById = createCachedSelector(
    selectors.selectEntities,
    (_state: RootState, id: EntityId) => id,
    (metafiles, id) => metafiles[id]
)({
    keySelector: (_, id) => id,
    selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck),
});

/**
 * Selector for retrieving multiple Metafile objects based on `ids`. This selector caches on `ids` as long as `state.metafiles.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `id` or `modified`
 * fields change in `selectEntities`, but not when `ids` input selector changes.
 */
const selectByIds = createCachedSelector(
    selectors.selectEntities,
    (_state: RootState, ids: EntityId[]) => ids,
    (metafiles, ids) => ids.map(id => metafiles[id]).filter(isDefined)
)({
    keySelector: (_, ids) => ids.join(':'),
    selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck),
});

const selectVirtual = createSelector(
    selectAll,
    (metafiles) => metafiles.filter(isVirtualMetafile),
    { memoizeOptions: { resultEqualityCheck: deepMetafilesEqualityCheck } }
);

const selectFilebased = createSelector(
    selectAll,
    (metafiles) => metafiles.filter(isFilebasedMetafile),
    { memoizeOptions: { resultEqualityCheck: deepMetafilesEqualityCheck } }
);

const selectFiles = createSelector(
    selectAll,
    (metafiles) => metafiles.filter(isFileMetafile),
    { memoizeOptions: { resultEqualityCheck: deepMetafilesEqualityCheck } }
);

const selectDirectories = createSelector(
    selectAll,
    (metafiles) => metafiles.filter(isDirectoryMetafile),
    { memoizeOptions: { resultEqualityCheck: deepMetafilesEqualityCheck } }
);

const selectVersioned = createSelector(
    selectAll,
    (metafiles) => metafiles.filter(isVersionedMetafile),
    { memoizeOptions: { resultEqualityCheck: deepMetafilesEqualityCheck } }
);

/**
 * Selector for retrieving Metafile entities based on `filepath`. This selector caches on `filepath` and `handlers` as long as `selectFilebased` 
 * has not changed. The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when 
 * the `id` or `modified` fields change in `selectFilebased`, but not when `filepath` input selector changes.
 */
const selectByFilepath = createCachedSelector(
    selectFilebased,
    (_state: RootState, filepath: PathLike) => filepath,
    (_state: RootState, _filepath: PathLike, handlers?: CardType[]) => handlers,
    (metafiles, filepath, handlers) => metafiles.filter(m => isEqualPaths(m.path, filepath) && (!isDefined(handlers) || handlers.includes(m.handler)))
)({
    keySelector: (_, filepath, handlers?: CardType[]) => `${filepath.toString()}:${JSON.stringify(handlers)}`
});

/**
 * Selector for retrieving Metafile entities based on multiple `filepaths`. This selector caches on `filepaths` as long as `selectByFilepath`
 * has not changed. The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when 
 * the `id` or `modified` fields change in `selectByFilepath`, but not when `filepaths` input selector changes. 
 */
const selectByFilepaths = createCachedSelector(
    (state: RootState, filepaths: PathLike[]) => filepaths.map(f => selectByFilepath(state, f)),
    (metafiles) => flattenArray(metafiles)
)({
    keySelector: (_, filepaths) => filepaths.join(':'),
    selectorCreator: createSelectorCreator(defaultMemoize, {
        equalityCheck: (a: FilebasedMetafile[][], b: FilebasedMetafile[][]) => equalArrays(a, b)
    })
});

/**
 * Selector for retrieving Metafile entities based on the combination of `root` path and `direct` flag. This selector caches on `root` and `direct`
 * as long as `selectFilebased` has not changed. The persisted selector cahce provided by [re-reselect](https://github.com/toomuchdesign/re-reselect)
 * is invalidated only when the `id` or `modified` fields change in `selectFilebased`, but not when `root` and `direct` input selectors change.
 */
const selectByRoot = createCachedSelector(
    selectFilebased,
    (_state: RootState, root: PathLike) => root,
    (_state: RootState, _root: PathLike, direct?: boolean) => direct,
    (metafiles, root, direct = false) => metafiles.filter(m => isDescendant(root, m.path, direct))
)({
    keySelector: (_, root, direct?: boolean) => `${root.toString()}:${direct}`
});

/**
 * Selector for retrieving Metafile entities based on the combination of `root` path and `direct` flag, and filtered into `directories` and `files`. 
 * This selector caches on `root` and `direct` as long as `selectByRoot` has not changed. The persisted selector cache provided by 
 * [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `id` or `modified` fields change in `selectByRoot`, 
 * but not when `root` and `direct` input selectors change.
 */
const selectDescendantsByRoot = createCachedSelector(
    (state: RootState, root: PathLike, direct?: boolean) => selectByRoot(state, root, direct),
    (metafiles) => metafiles.reduce((accumulator: DescendantMetafiles, item) =>
        (isDirectoryMetafile(item))
            ? (accumulator.directories.push(item), accumulator)
            : (accumulator.files.push(item), accumulator), { directories: [], files: [] })
)({
    keySelector: (_, root, direct?: boolean) => `${root.toString()}:${direct}:DESC`
});

const selectByRepo = createCachedSelector(
    selectVersioned,
    (_state: RootState, repo: UUID) => repo,
    (metafiles, repo) => metafiles.filter(m => m.repo === repo)
)({
    keySelector: (_, repo) => repo
});

const selectByBranch = createCachedSelector(
    selectVersioned,
    (_state: RootState, branch: UUID) => branch,
    (_state: RootState, _branch: UUID, filepath?: PathLike) => filepath,
    (metafiles, branch, filepath) => metafiles.filter(m => m.branch === branch && (!isDefined(filepath) || m.path === filepath))
)({
    keySelector: (_, branch, filepath?: PathLike) => `$${branch}:${filepath?.toString()}`
});

const selectByVirtual = createCachedSelector(
    selectVirtual,
    (_state: RootState, name: string) => name,
    (_state: RootState, _name: string, handler: CardType) => handler,
    (metafiles, name, handler) => metafiles.filter(m => m.name === name && m.handler === handler)
)({
    keySelector: (_, name, handler: CardType) => `${name}:${handler}`
});

const selectByState = createCachedSelector(
    selectFilebased,
    (_state: RootState, state: FilesystemStatus) => state,
    (metafiles, state) => metafiles.filter(m => m.state === state)
)({
    keySelector: (_, state) => state
});

/**
 * Selector for retrieving Metafile entities based on `cards`, using `metafile` UUID information stored on each Card instance. This selector 
 * caches on `card.id` and `card.metafile` as long as `state.metafiles.entities` has not changed. The persisted selector cache provided by 
 * [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `id` or `modified` fields change in `selectEntities`, 
 * but not when `cards` input selector changes.
 */
const selectByCards = createCachedSelector(
    selectors.selectEntities,
    (_state: RootState, cards: Card[]) => cards,
    (metafiles, cards) => cards.map(card => metafiles[card.metafile])
)({
    keySelector: (_, cards) => cards.map(c => `${c.id}:${c.metafile}`).join(),
    selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck)
});

const selectConflictedByRepo = createCachedSelector(
    selectVersioned,
    (_state: RootState, repo: UUID) => repo,
    (_state: RootState, _repo: UUID, branch?: UUID) => branch,
    (metafiles, repo, branch) => metafiles.filter(m =>
        m.repo === repo &&
        (!isDefined(branch) || m.branch === branch) &&
        (isUnmerged(m.status) && m.conflicts.length > 0)
    )
)({
    keySelector: (_, repo, branch?: UUID) => `${repo}:${branch}:CONFLICTED`
});

const selectStagedByRepo = createCachedSelector(
    selectVersioned,
    (_state: RootState, repo: UUID) => repo,
    (_state: RootState, _repo: UUID, branch?: UUID) => branch,
    (metafiles, repo, branch) => metafiles.filter(m =>
        m.repo === repo &&
        (!isDefined(branch) || m.branch === branch) &&
        isStaged(m.status) && isFileMetafile(m)
    )
)({
    keySelector: (_, repo, branch?: UUID) => `${repo}:${branch}:STAGED`
});

const selectUnstagedByRepo = createCachedSelector(
    selectVersioned,
    (_state: RootState, repo: UUID) => repo,
    (_state: RootState, _repo: UUID, branch?: UUID) => branch,
    (metafiles, repo, branch) => metafiles.filter(m =>
        m.repo === repo && (!isDefined(branch) || m.branch === branch) &&
        isModified(m.status) && isFileMetafile(m)
    )
)({
    keySelector: (_, repo, branch?: UUID) => `${repo}:${branch}:UNSTAGED`
});

const metafileSelectors = {
    ...selectors, selectEntities, selectAll, selectById, selectByIds, selectVirtual, selectFilebased, selectFiles, selectDirectories,
    selectVersioned, selectByFilepath, selectByFilepaths, selectByRoot, selectDescendantsByRoot, selectByRepo, selectByBranch,
    selectByVirtual, selectByState, selectByCards, selectConflictedByRepo, selectStagedByRepo, selectUnstagedByRepo
};

export default metafileSelectors;