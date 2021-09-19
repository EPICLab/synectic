import parsePath from 'parse-path';
import type { UUID, Card, Repository } from '../../types';
import { RootState } from '../store';
import { reposAdapter } from '../slices/repos';

export const repoSelectors = reposAdapter.getSelectors<RootState>(state => state.repos);

/**
 * Custom Redux selector for locating a repository in the Redux store based on name, and an optional URL.
 * @param state The state object for the Redux store.
 * @param name The repository name.
 * @param url A URL for filtering; can use http, https, ssh, or git protocols.
 * @returns A Repository object or undefined if no match.
 */
export const selectRepoByName = (state: RootState, name: string, url?: parsePath.ParsedPath): Repository | undefined => {
    return url ? Object.values(state.repos).find(r => r.name === name && r.url.href === url.href) :
        Object.values(state.repos).find(r => r.name === name);
}

/**
 * Custom Redux selector for cards that:
 *  (1) have a metafile associated with them,
 *  (2) that metafile contains a repo that matches the parameter repo,
 *  (3) that metafile contains a branch that matches the parameter branch (if needed)
 * @param state The state object for the Redux store.
 * @param repo The UUID of a Repository entry in the Redux store.
 * @param branch Git branch name or commit hash.
 * @returns An array of Card objects that meet the selection criteria.
 */
export const getCardsByRepo = (state: RootState, repo: UUID, branch?: string): Card[] => {
    return Object.values(state.cards.entities)
        .filter(c => c.metafile !== undefined)
        .filter(c => state.metafiles.entities[c.metafile] ? (state.metafiles.entities[c.metafile]?.repo === repo) : false)
        .filter(c => branch ? (state.metafiles.entities[c.metafile]?.branch === branch) : true);
};