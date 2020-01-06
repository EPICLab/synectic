import { v4 } from 'uuid';
import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';

import * as io from './io';
import { ActionKeys, Actions } from '../store/actions';
import { Filetype, Metafile, Card } from '../types';

const DEFAULT_PATH = './src/containers/filetypes.json';

/**
 * Read and extract all supported filetype information from config file into Redux store.
 * @param filetypesPath The relative or absolute path to the supported filetypes config file; defaults to system
 * default path if left blank.
 * @return A Promise object for an array of Redux actions that update the state with supported filetypes.
 */
export const importFiletypes = async (filetypesPath: PathLike = DEFAULT_PATH) => {
  return io.readFileAsync(filetypesPath)
    .then(content => io.deserialize<Omit<Filetype, 'id'>[]>(content))
    .then(filetypes => {
      const actions: Actions[] = [];
      filetypes.map(filetype => {
        const filetypeId = v4();
        actions.push({ type: ActionKeys.ADD_FILETYPE, id: filetypeId, filetype: { id: filetypeId, ...filetype } });
      });
      return actions;
    })
    .catch(error => { throw new Error(error.message) });
};

/**
 * Creates Redux action for adding new Card with content to Redux store; which materializes a new Card on the Canvas.
 * @param metafile A Metafile object containing file specific information for loading.
 * @return A Redux action that updates state with a new Card.
 */
export const loadCard = (metafile: Metafile) => {
  const card: Card = {
    id: v4(),
    name: metafile.name,
    metafile: metafile.id,
    created: DateTime.local(),
    modified: metafile.modified,
    left: 10,
    top: 25
  };
  const action: Actions = { type: ActionKeys.ADD_CARD, id: card.id, card: card };
  return action;
}