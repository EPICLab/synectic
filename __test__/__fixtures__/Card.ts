import type { Card } from '../../src/types';
import { testStore } from './ReduxStore';

export const firstEditorCard = testStore.cards.entities['f6b3f2a3-9145-4b59-a4a1-bf414214f30b'] as Card;
export const secondEditorCard = testStore.cards.entities['67406095-fd01-4441-8e52-b0fdbad3327a'] as Card;
export const thirdEditorCard = testStore.cards.entities['17734ae2-f8da-40cf-be86-993dc21b4079'] as Card;
export const diffCard = testStore.cards.entities['6e84b210-f148-43bd-8364-c8710e70a9ef'] as Card;
export const explorerCard = testStore.cards.entities['43c3c447-da0d-4299-a006-57344beb77da'] as Card;
export const browserCard = testStore.cards.entities['f1a1fb16-cb06-4fb7-9b10-29ad95032d51'] as Card;
export const trackerCard = testStore.cards.entities['4efdbe23-c938-4eb1-b29b-50bf76bdb44e'] as Card;

