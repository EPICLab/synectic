import { createSelector, EntityId } from '@reduxjs/toolkit';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import type { CardType, PathLike, UUID } from 'types/app';
import type { DescendantMetafiles, Metafile } from 'types/metafile';
import {
  isDirectoryMetafile,
  isFilebasedMetafile,
  isFileMetafile,
  isVersionedMetafile,
  metafileAdapter
} from '../slices/metafiles';
import type { RootState } from '../store';

const selectors = metafileAdapter.getSelectors<RootState>(state => state.metafiles);
const filteredArrayEquality = window.api.utils.filteredArrayEquality;
const isDefined = window.api.utils.isDefined;
const isStaged = window.api.utils.isStaged;

type MetafileEntities = ReturnType<typeof selectors.selectEntities>;

const deepEntitiesEqualityCheck = (a: MetafileEntities, b: MetafileEntities) =>
  filteredArrayEquality(Object.values(a).filter(isDefined), Object.values(b).filter(isDefined), [
    'id',
    'modified',
    'status'
  ]);
const deepMetafilesEqualityCheck = (a: Metafile[], b: Metafile[]) =>
  filteredArrayEquality(a, b, ['id', 'modified', 'status']);

/**
 * Selector that returns the `state.metafiles.entities` lookup table. Equality checks are performed
 * against the `id` and `modified` fields of Metafile entities only, to prevent unnecessary
 * rerendering.
 */
const selectEntities = createSelector(selectors.selectEntities, metafiles => metafiles, {
  memoizeOptions: { equalityCheck: deepEntitiesEqualityCheck }
});

/**
 * Selector for mapping over the `state.metafiles.ids` array, and returning an array of Metafile
 * entities in the same order. Equality checks are performed against the `id` and `modified` fields
 * of Metafile entities only, to prevent unnecessary rerendering.
 */
const selectAll = createSelector(selectors.selectAll, metafiles => metafiles, {
  memoizeOptions: { equalityCheck: deepMetafilesEqualityCheck }
});

/**
 * Selector for retrieving multiple Metafile objects based on `ids`. This selector caches on `ids`
 * as long as `state.metafiles.entities` has not changed. The persisted selector cache provided by
 * [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `id` or
 * `modified` fields change in `selectEntities`, but not when `ids` input selector changes.
 */
const selectByIds = createCachedSelector(
  selectors.selectEntities,
  (_state: RootState, ids: EntityId[]) => ids,
  (metafiles, ids) => ids.map(id => metafiles[id]).filter(isDefined)
)({
  keySelector: (_, ids) => ids.join(':'),
  selectorCreator: createSelectorCreator(defaultMemoize, deepEntitiesEqualityCheck)
});

const selectFilebased = createSelector(
  selectAll,
  metafiles => metafiles.filter(isFilebasedMetafile),
  { memoizeOptions: { resultEqualityCheck: deepMetafilesEqualityCheck } }
);

const selectFiles = createSelector(
  (state: RootState, ids: EntityId[]) => selectByIds(state, ids),
  metafiles => metafiles.filter(isFileMetafile)
);

const selectDirectories = createSelector(
  (state: RootState, ids: EntityId[]) => selectByIds(state, ids),
  metafiles => metafiles.filter(isDirectoryMetafile)
);

const selectVersioned = createSelector(
  selectAll,
  metafiles => metafiles.filter(isVersionedMetafile),
  { memoizeOptions: { resultEqualityCheck: deepMetafilesEqualityCheck } }
);

/**
 * Selector for retrieving Metafile entities based on `filepath`. This selector caches on
 * `filepath` and `handlers` as long as `selectFilebased` has not changed. The persisted selector
 * cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated
 * only when the `id` or `modified` fields change in `selectFilebased`, but not when `filepath`
 * input selector changes.
 */
const selectByFilepath = createCachedSelector(
  selectFilebased,
  (_state: RootState, filepath: PathLike) => filepath,
  (_state: RootState, _filepath: PathLike, handlers?: CardType[]) => handlers,
  (metafiles, filepath, handlers) =>
    metafiles.filter(
      m =>
        window.api.fs.isEqualPaths(m.path, filepath) &&
        (!isDefined(handlers) || handlers.includes(m.handler))
    )
)({
  keySelector: (_, filepath, handlers?: CardType[]) =>
    `${filepath.toString()}:${JSON.stringify(handlers)}`
});

/**
 * Selector for retrieving Metafile entities based on the combination of `root` path and `direct`
 * flag. This selector caches on `root` and `direct` as long as `selectFilebased` has not changed.
 * The persisted selector cahce provided by
 * [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `id`
 * or `modified` fields change in `selectFilebased`, but not when `root` and `direct` input
 * selectors change.
 */
const selectByRoot = createCachedSelector(
  selectFilebased,
  (_state: RootState, root: PathLike) => root,
  (_state: RootState, _root: PathLike, direct?: boolean) => direct,
  (metafiles, root, direct = false) =>
    metafiles.filter(m => window.api.fs.isDescendant(root, m.path, direct))
)({
  keySelector: (_, root, direct?: boolean) => `${root.toString()}:${direct}`
});

/**
 * Selector for retrieving Metafile entities based on the combination of `root` path and `direct`
 * flag, and filtered into `directories` and `files`. This selector caches on `root` and `direct`
 * as long as `selectByRoot` has not changed. The persisted selector cache provided by
 * [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated only when the `id` or
 * `modified` fields change in `selectByRoot`, but not when `root` and `direct` input selectors
 * change.
 */
const selectDescendantsByRoot = createSelector(
  (state: RootState, root: PathLike, direct?: boolean) => selectByRoot(state, root, direct),
  metafiles =>
    metafiles.reduce(
      (accumulator: DescendantMetafiles, item) =>
        item.filetype === 'Directory'
          ? (accumulator.directories.push(item), accumulator)
          : (accumulator.files.push(item), accumulator),
      { directories: [], files: [] }
    )
);

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
  (metafiles, branch, filepath) =>
    metafiles.filter(m => m.branch === branch && (!isDefined(filepath) || m.path === filepath))
)({
  keySelector: (_, branch, filepath?: PathLike) => `$${branch}:${filepath?.toString()}`
});

const selectStagedByRepo = createCachedSelector(
  selectVersioned,
  (_state: RootState, repo: UUID) => repo,
  (_state: RootState, _repo: UUID, branch?: UUID) => branch,
  (_state: RootState, _repo: UUID, _branch: UUID, fileOnly?: boolean) => fileOnly,
  (metafiles, repo, branch, fileOnly = true) =>
    metafiles.filter(
      m =>
        m.repo === repo &&
        (!isDefined(branch) || m.branch === branch) &&
        (fileOnly === false || isFileMetafile(m)) &&
        isStaged(m.status)
    )
)({
  keySelector: (_, repo, branch?: UUID) => `${repo}:${branch}:STAGED`
});

const metafileSelectors = {
  ...selectors,
  selectEntities,
  selectAll,
  selectByIds,
  selectFilebased,
  selectFiles,
  selectDirectories,
  selectByFilepath,
  selectByRoot,
  selectDescendantsByRoot,
  selectByRepo,
  selectByBranch,
  selectStagedByRepo
};

export default metafileSelectors;
