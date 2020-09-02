import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import filetypesJson from './filetypes.json';
import { ActionKeys, Action, NarrowActionType } from '../store/actions';
import { Filetype, Metafile, Card, Stack, Error, UUID } from '../types';
import { ThunkAction } from 'redux-thunk';
import { RootState } from '../store/root';
import { AnyAction } from 'redux';
import { PathLike } from 'fs-extra';
import { getMetafile, metafileMissingError } from './metafiles';

type HandlerRequiredMetafile = Metafile & Required<Pick<Metafile, 'handler'>>;
type HandlerMissingMetafile = Omit<Metafile, 'handler'>;

/**
 * Extracts and updates list of supported filetypes in Redux store.
 * @return A Promise object for an array of Redux actions that update the store with supported filetypes.
 */
export const importFiletypes = async (): Promise<Action[]> => {
  return new Promise<Action[]>(resolve => {
    const filetypes = filetypesJson as Omit<Filetype, 'id'>[];
    const actions: Action[] = [];
    filetypes.map(filetype => {
      const filetypeId = v4();
      actions.push({ type: ActionKeys.ADD_FILETYPE, id: filetypeId, filetype: { id: filetypeId, ...filetype } });
    });
    resolve(actions);
  });
};

/**
 * Action Creator for composing a valid ADD_CARD Redux Action.
 * @param metafiles A list of related `Metafile` objects, where the first contains a valid `handler` field.
 * @return An `AddCardAction` object that can be dispatched via Redux, or undefined if no handler is defined.
 */
const addCard = (metafiles: HandlerRequiredMetafile[]): NarrowActionType<ActionKeys.ADD_CARD> => {
  const card: Card = {
    id: v4(),
    name: metafiles[0].name,
    created: DateTime.local(),
    modified: metafiles[0].modified,
    captured: false,
    left: 10,
    top: 25,
    type: metafiles[0].handler,
    related: metafiles.map<UUID>(m => m.id)
  };
  return {
    type: ActionKeys.ADD_CARD,
    id: card.id,
    card: card
  };
}

/**
 * Action Creator for composing a valid ADD_ERROR Redux Action.
 * @param metafile A `Metafile` object that does not contain a valid `handler` field.
 * @return An `AddErrorAction` object that can be dispatched via Redux.
 */
const handlerMissingError = (metafile: HandlerMissingMetafile): NarrowActionType<ActionKeys.ADD_ERROR> => {
  const error: Error = {
    id: v4(),
    type: 'HandlerMissingError',
    target: metafile.id,
    message: `Metafile ${metafile.name} missing handler to resolve filetype: '${metafile.filetype}'`
  };
  return {
    type: ActionKeys.ADD_ERROR,
    id: error.id,
    error: error
  };
}

/**
 * Thunk Action Creator for adding a new Card, either by providing one or more metafile (specifically to
 * support Diff cards which require two metafiles) with an appropriate handler field or by providing a filepath 
 * in order to read the filesystem and dispatch any necessary Redux store updates before loading a new Card. 
 * This function will load an error if the metafile does not contain a valid filetype handler.
 * @param metafiles One or more `Metafile` objects previously created or retrieved from the Redux state.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and retrieve a `Card` object.
 */
export const loadCard = ({ metafiles, filepath }: { metafiles?: Metafile[]; filepath?: PathLike }): ThunkAction<Promise<Card | undefined>, RootState, undefined, AnyAction> => {
  return async (dispatch) => {
    if (metafiles && metafiles.length > 0) {
      if (!metafiles[0].handler) dispatch(handlerMissingError(metafiles[0]));
      const addCardAction = addCard(metafiles as HandlerRequiredMetafile[]);
      if (addCardAction) return dispatch(addCardAction).card;
    }
    if (filepath) {
      const metafile = await dispatch(getMetafile({ filepath: filepath }));
      if (!metafile) dispatch(metafileMissingError(filepath.toString()));
      if (metafile && !metafile.handler) dispatch(handlerMissingError(metafile));
      const addCardAction = addCard(metafiles as HandlerRequiredMetafile[]);
      if (addCardAction) return dispatch(addCardAction).card;
    }
    return undefined;
  };
}

/**
 * Creates Redux actions for adding a new Stack, along with updating all child cards to be captured within that Stack.
 * @param name Name of the new Stack object.
 * @param cards Array of Card objects contained within the new Stack.
 * @param note (Optional) Note field related to the new Stack.
 * @return An array of Redux actions that updates state with a new Stack, and updates state of child Cards.
 */
export const loadStack = (name: string, cards: Card[], note?: string): Action[] => {
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
  const actions: Action[] = [{ type: ActionKeys.ADD_STACK, id: stack.id, stack: stack }];
  cards.map((card, index) => actions.push({
    type: ActionKeys.UPDATE_CARD, id: card.id,
    card: { ...card, captured: true, top: (10 * index + 50), left: (10 * index + 10) }
  }));
  return actions;
}