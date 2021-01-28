import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import { PathLike } from 'fs-extra';

import type { Filetype, Metafile, Card, Stack, Error } from '../types';
import { RootState } from '../store/root';
import { getMetafile } from './metafiles';
import { ActionKeys, Action, NarrowActionType } from '../store/actions';
import filetypesJson from './filetypes.json';

type AddCardAction = NarrowActionType<ActionKeys.ADD_CARD>;
type AddErrorAction = NarrowActionType<ActionKeys.ADD_ERROR>;
type HandlerRequiredMetafile = Metafile & Required<Pick<Metafile, 'handler'>>;
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
 * @param metafile The related `Metafile` object containing a valid `handler` field.
 * @return An `AddCardAction` object that can be dispatched via Redux, or undefined if no handler is defined.
 */
const addCard = (metafile: HandlerRequiredMetafile): AddCardAction | AddErrorAction => {
  const card: Card = {
    id: v4(),
    name: metafile.name,
    created: DateTime.local(),
    modified: metafile.modified,
    captured: false,
    left: 10,
    top: 25,
    type: metafile.handler,
    metafile: metafile.id
  };
  return {
    type: ActionKeys.ADD_CARD,
    id: card.id,
    card: card
  };
}

/**
 * Action Creator for composing a valid ADD_ERROR Redux Action.
 * @param target Corresponds to the object or field originating the error.
 * @param message The error message to be displayed to the user.
 * @return An `AddErrorAction` object that can be dispatched via Redux.
 */
export const handlersError = (target: string, message: string): AddErrorAction => {
  const error: Error = {
    id: v4(),
    type: 'HandlersError',
    target: target,
    message: message
  };
  return {
    type: ActionKeys.ADD_ERROR,
    id: error.id,
    error: error
  };
}

// Descriminated union type for emulating a `mutually exclusive or` (XOR) operation between parameter types
// Ref: https://github.com/microsoft/TypeScript/issues/14094#issuecomment-344768076
type CardLoadableFields =
  { metafile: Metafile, filepath?: never } |
  { metafile?: never, filepath: PathLike };

/**
 * Thunk Action Creator for adding a new Card, either by providing one or more metafile (specifically to
 * support Diff cards which require two metafiles) with an appropriate handler field or by providing a filepath 
 * in order to read the filesystem and dispatch any necessary Redux store updates before loading a new Card. 
 * This function will load an error if the metafile does not contain a valid filetype handler.
 * @param metafile A `Metafile` objects previously created or retrieved from the Redux state.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Thunk that can be executed to load a card onto the canvas and dispatch Redux updates, if the card cannot
 * be added to the Redux store and no errors can be generated, then `undefined` is returned instead.
 */
export const loadCard = (param: CardLoadableFields)
  : ThunkAction<Promise<AddCardAction | AddErrorAction | undefined>, RootState, undefined, AnyAction> => {
  return async (dispatch) => {
    if (param.metafile) {

      if (!param.metafile.handler) {
        const missingHandlerError = `Metafile '${param.metafile.name}' missing handler for filetype: '${param.metafile.filetype}'`;
        return dispatch(handlersError(param.metafile.id, missingHandlerError));
      }
      return dispatch(addCard(param.metafile as HandlerRequiredMetafile));
    }
    if (param.filepath) {
      const metafile = await dispatch(getMetafile({ filepath: param.filepath }));
      if (!metafile) {
        const missingMetafileError = `Cannot update non-existing metafile for filepath: '${param.filepath.toString()}'`;
        return dispatch(handlersError(param.filepath.toString(), missingMetafileError));
      }
      if (!metafile.handler) {
        return dispatch(handlersError(metafile.id, `Metafile '${metafile.name}' missing handler for filetype: '${metafile.filetype}'`));
      }
      return dispatch(addCard(metafile as HandlerRequiredMetafile));
    }
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