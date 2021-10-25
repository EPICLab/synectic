import parsePath from 'parse-path';
import type { Repository } from '../../types';
import { RootState } from '../store';
import { reposAdapter } from '../slices/repos';
import { createDraftSafeSelector } from '@reduxjs/toolkit';

export const selectors = reposAdapter.getSelectors<RootState>(state => state.repos);

/**
 * Custom Redux selector for locating a repository in the Redux store based on name.
 * @param state The state object for the Redux store.
 * @param name The repository name.
 * @returns A Repository object or undefined if no match.
 */
const selectByName = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, name: string) => name,
    (repos, name): Repository | undefined => repos.find(repo => repo.name === name)
);

/**
 * Custom Redux selector for locating a repository in the Redux store based on URL.
 * @param state The state object for the Redux store.
 * @param url The remote URL of a repository; can use http, https, ssh, or git protocols.
 * @returns A Repository object or undefined if no match.
 */
const selectByUrl = createDraftSafeSelector(
    selectors.selectAll,
    (_state: RootState, url: parsePath.ParsedPath) => url,
    (repos, url): Repository | undefined => repos.find(repo => repo.url === url.href)
);

const repoSelectors = { ...selectors, selectByName, selectByUrl };

export default repoSelectors;