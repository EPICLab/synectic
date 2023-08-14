import { PathLike } from 'fs-extra';
import { createCachedSelector } from 're-reselect';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { equalArrays } from '../../containers/utils';
import { repoAdapter, Repository } from '../slices/repos';
import { RootState } from '../store';

const selectors = repoAdapter.getSelectors<RootState>(state => state.repos);

const shallowReposEqualityCheck = (a: Repository[], b: Repository[]) => equalArrays(a, b);

/**
 * Selector for retrieving Repository entities based on `root`. This selector caches on `root` as long as `state.repos.entities` has not changed.
 * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entities change in
 * `selectAll`, but not when `root` input selector changes.
 */
const selectByRoot = createCachedSelector(
  selectors.selectAll,
  (_state: RootState, root: PathLike) => root,
  (repos, root) => repos.find(r => window.api.fs.isEqualPaths(root, r.root))
)({
  keySelector: (_, root) => root,
  selectorCreator: createSelectorCreator(defaultMemoize, shallowReposEqualityCheck)
});

// /**
//  * Selector for retrieving Repository entities based on `url`. This selector caches on `url` as long as `state.repos.entities` has not changed.
//  * The persisted selector cache provided by [re-reselect](https://github.com/toomuchdesign/re-reselect) is invalidated when entities change in
//  * `selectAll`, but not when `url` input selector changes.
//  */
// const selectByUrl = createCachedSelector(
//   selectors.selectAll,
//   (_state: RootState, url: string) => url,
//   (repos, url): Repository | undefined => repos.find(repo => repo.url === url)
// )({
//   keySelector: (_, url) => url,
//   selectorCreator: createSelectorCreator(defaultMemoize, shallowReposEqualityCheck)
// });

const repoSelectors = { ...selectors, selectByRoot }; // selectById, selectByName, selectByRoot, selectByUrl };

export default repoSelectors;
