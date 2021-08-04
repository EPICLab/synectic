import { RootState } from '../store';
import { CardsState } from '../slices/cards';

export const selectCards = (state: RootState): CardsState => state.cards;
