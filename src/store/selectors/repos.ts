import parsePath from 'parse-path';
import type { UUID, Card, Repository } from '../../types';
import { RootState } from '../store';
import { ReposState } from '../slices/repos';

export const selectRepos = (state: RootState): ReposState => state.repos;

export const getRepoByName = (name: string, url?: parsePath.ParsedPath) => (state: RootState): Repository | undefined => {
    return url ? Object.values(state.repos).find(r => r.name === name && r.url.href === url.href) :
        Object.values(state.repos).find(r => r.name === name);
}

export const getCardsByRepo = (repo: UUID, branch?: string) => (state: RootState): Card[] => {
    return Object.values(state.cards)
        .filter(c => c.metafile !== undefined)
        .filter(c => state.metafiles[c.metafile] ? (state.metafiles[c.metafile].repo === repo) : false)
        .filter(c => branch ? (state.metafiles[c.metafile].branch === branch) : true);
};