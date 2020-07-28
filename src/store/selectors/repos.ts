import { RootState } from '../root';
import { UUID, Card } from '../../types';

export const getCardsByRepo = (repo: UUID, branch?: string) => (state: RootState): Card[] => {
  return Object.values(state.cards)
    .filter(c => c.related.length > 0)
    .filter(c => state.metafiles[c.related[0]] ? (state.metafiles[c.related[0]].repo === repo) : false)
    .filter(c => branch ? (state.metafiles[c.related[0]].branch === branch) : true);
};