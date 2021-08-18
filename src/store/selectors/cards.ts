import { RootState } from '../store';
import { cardsAdapter } from '../slices/cards';

export const selectAllCards = cardsAdapter.getSelectors<RootState>(state => state.cards);
