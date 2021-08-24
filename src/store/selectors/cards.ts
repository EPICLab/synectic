import { RootState } from '../store';
import { cardsAdapter } from '../slices/cards';

export const cardSelectors = cardsAdapter.getSelectors<RootState>(state => state.cards);
