import { v4 } from 'uuid';
import { AnyAction } from 'redux';
import { ThunkAction } from 'redux-thunk';
import { PathLike } from 'fs-extra';

import type { Filetype, Metafile, Modal } from '../types';
import { RootState } from '../store/root';
import { getMetafile } from './metafiles';
import { addCard } from './cards';
import filetypesJson from './filetypes.json';
import { ActionKeys, Action, NarrowActionType } from '../store/actions';

type AddCardAction = NarrowActionType<ActionKeys.ADD_CARD>;
type AddModalAction = NarrowActionType<ActionKeys.ADD_MODAL>;
export type HandlerRequiredMetafile = Metafile & Required<Pick<Metafile, 'handler'>>;

/**
 * Type Guard for narrowing the `Metafile` type to the more-specific `HandlerRequiredMetafile` type, which requires the
 * optional `handler` property be defined in order to allow the appropriate handlers to be loaded.
 * @param metafile A `Metafile` that should be run-time checked for the `handler` property.
 * @return Boolean indicating whether the metafile can be type narrowed to `HandlerRequiredMetafile`.
 */
export const isHandlerRequiredMetafile = (metafile: Metafile): metafile is HandlerRequiredMetafile => {
  return 'handler' in metafile;
}

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
 * Action Creator for composing a valid ADD_ERROR Redux Action.
 * @param target Corresponds to the object or field originating the error.
 * @param message The error message to be displayed to the user.
 * @return An `AddModalAction` object that can be dispatched via Redux.
 */
export const handlersError = (target: string, message: string): AddModalAction => {
  const modal: Modal = {
    id: v4(),
    type: 'Error',
    subtype: 'HandlersError',
    target: target,
    options: { message: message }
  };
  return {
    type: ActionKeys.ADD_MODAL,
    id: modal.id,
    modal: modal
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
  : ThunkAction<Promise<AddCardAction | AddModalAction | undefined>, RootState, undefined, AnyAction> => {
  return async (dispatch) => {
    if (param.metafile) {
      if (isHandlerRequiredMetafile(param.metafile)) {
        return dispatch(addCard(param.metafile));
      } else {
        const missingHandlerError = `Metafile '${param.metafile.name}' missing handler for filetype: '${param.metafile.filetype}'`;
        return dispatch(handlersError(param.metafile.id, missingHandlerError));
      }
    }
    if (param.filepath) {
      const metafile = await dispatch(getMetafile({ filepath: param.filepath }));
      if (!metafile) {
        const missingMetafileError = `Cannot update non-existing metafile for filepath: '${param.filepath.toString()}'`;
        return dispatch(handlersError(param.filepath.toString(), missingMetafileError));
      }
      if (isHandlerRequiredMetafile(metafile)) {
        return dispatch(addCard(metafile));
      } else {
        return dispatch(handlersError(metafile.id, `Metafile '${metafile.name}' missing handler for filetype: '${metafile.filetype}'`));
      }
    }
  };
}