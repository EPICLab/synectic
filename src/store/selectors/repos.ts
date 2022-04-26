import parsePath from 'parse-path';
import { PathLike } from 'fs-extra';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { repoAdapter, Repository } from '../slices/repos';
import { isEqualPaths } from '../../containers/io';

const selectors = repoAdapter.getSelectors<RootState>(state => state.repos);

/**
 * Custom Redux selector for locating a repository in the Redux store based on name.
 * @param state The state object for the Redux store.
 * @param name The repository name.
 * @returns A Repository object or undefined if no match.
 */
const selectByName = createSelector(
    selectors.selectAll,
    (_state: RootState, name: string) => name,
    (repos, name): Repository | undefined => repos.find(repo => repo.name === name)
);

const selectByRoot = createSelector(
    selectors.selectAll,
    (_state: RootState, root: PathLike) => root,
    (repos, root) => repos.find(r => isEqualPaths(root, r.root))
);

/**
 * Custom Redux selector for locating a repository in the Redux store based on URL.
 * @param state The state object for the Redux store.
 * @param url The remote URL of a repository; can use http, https, ssh, or git protocols.
 * @returns A Repository object or undefined if no match.
 */
const selectByUrl = createSelector(
    selectors.selectAll,
    (_state: RootState, url: parsePath.ParsedPath) => url,
    (repos, url): Repository | undefined => repos.find(repo => repo.url === url.href)
);

const repoSelectors = { ...selectors, selectByName, selectByRoot, selectByUrl };

export default repoSelectors;