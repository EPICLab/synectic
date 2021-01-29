import type { UUID, Card } from '../../types';
import { RootState } from '../root';

export const getCardsByRepo = (repo: UUID, branch?: string) => (state: RootState): Card[] => {
  return Object.values(state.cards)
    .filter(c => c.metafile !== undefined)
    .filter(c => state.metafiles[c.metafile] ? (state.metafiles[c.metafile].repo === repo) : false)
    .filter(c => branch ? (state.metafiles[c.metafile].branch === branch) : true);
};