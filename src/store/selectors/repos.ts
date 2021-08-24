import parsePath from 'parse-path';
import type { UUID, Card, Repository } from '../../types';
import { RootState } from '../store';
import { reposAdapter } from '../slices/repos';

export const repoSelectors = reposAdapter.getSelectors<RootState>(state => state.repos);

export const selectRepoByName = (name: string, url?: parsePath.ParsedPath) => (state: RootState): Repository | undefined => {
    return url ? Object.values(state.repos).find(r => r.name === name && r.url.href === url.href) :
        Object.values(state.repos).find(r => r.name === name);
}

export const getCardsByRepo = (repo: UUID, branch?: string) => (state: RootState): Card[] => {
    return Object.values(state.cards)
        .filter((c): c is Card => c.metafile !== undefined)
        .filter(c => state.metafiles.entities[c.metafile] ? (state.metafiles.entities[c.metafile]?.repo === repo) : false)
        .filter(c => branch ? (state.metafiles.entities[c.metafile]?.branch === branch) : true);
};