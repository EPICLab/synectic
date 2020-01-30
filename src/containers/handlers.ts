import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import filetypesJson from './filetypes.json';
import { ActionKeys, Actions } from '../store/actions';
import { Filetype, Metafile, Card, Stack } from '../types';

/**
 * Extracts and updates list of supported filetypes in Redux store.
 * @return A Promise object for an array of Redux actions that update the store with supported filetypes.
 */
export const importFiletypes = async () => {
  return new Promise<Actions[]>(resolve => {
    const filetypes = filetypesJson as Omit<Filetype, 'id'>[];
    const actions: Actions[] = [];
    filetypes.map(filetype => {
      const filetypeId = v4();
      actions.push({ type: ActionKeys.ADD_FILETYPE, id: filetypeId, filetype: { id: filetypeId, ...filetype } });
    });
    resolve(actions);
  });
};

/**
 * Creates Redux action for adding new Card with content to Redux store; which materializes a new Card on the Canvas.
 * @param metafile A Metafile object containing file specific information for loading (i.e. must contain a defined handler).
 * @return A Redux action that updates state with a new Card, or undefined if unsupported filetype.
 */
export const loadCard = (metafile: Metafile) => {
  if (metafile.handler === undefined) return undefined;
  const card: Card = {
    id: v4(),
    name: metafile.name,
    created: DateTime.local(),
    modified: metafile.modified,
    captured: false,
    left: 10,
    top: 25,
    type: metafile.handler,
    related: [metafile.id]
  };
  const action: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
  return action;
}

/**
 * Creates Redux actions for adding a new Stack, along with updating all child cards to be captured within that Stack.
 * @param name Name of the new Stack object.
 * @param cards Array of Card objects contained within the new Stack.
 * @param note Optional note field related to the new Stack.
 * @return An array of Redux actions that updates state with a new Stack, and updates state of child Cards.
 */
export const loadStack = (name: string, cards: Card[], note?: string) => {
  const stack: Stack = {
    id: v4(),
    name: name,
    created: DateTime.local(),
    modified: DateTime.local(),
    note: note ? note : '',
    cards: cards.map(card => card.id),
    left: 250,
    top: 250
  };
  const actions: Actions[] = [{ type: ActionKeys.ADD_STACK, id: stack.id, stack: stack }];
  cards.map((card, index) => actions.push({
    type: ActionKeys.UPDATE_CARD, id: card.id,
    card: { ...card, captured: true, top: (10 * index + 50), left: (10 * index + 10) }
  }));
  return actions;
}