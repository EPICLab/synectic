import { v4 } from 'uuid';
import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';

import * as io from './io';
import { store } from '../app';
import { ActionKeys } from '../store/actions';
import { Filetype, Metafile, Card } from '../types';

const DEFAULT_PATH = './src/containers/filetypes.json';

export const importFiletypes = async (filetypesPath: PathLike = DEFAULT_PATH) => {
  io.readFileAsync(filetypesPath)
    .then(content => io.deserialize<Omit<Filetype, 'id'>[]>(content))
    .then(filetypes => filetypes.map(filetype => {
      const filetypeId = v4();
      store.dispatch({ type: ActionKeys.ADD_FILETYPE, id: filetypeId, filetype: { id: filetypeId, ...filetype } });
    }))
    .catch(error => { throw new Error(error.message) });
}

export const extractMetafile = async (filepath: PathLike, filetypes: Filetype[]) => {
  const extension = io.extractExtension(filepath);
  const stats = await io.extractStats(filepath);
  const handler = filetypes.find(filetype => filetype.extensions.some(ext => ext === extension));
  const metafile: Metafile = {
    id: v4(),
    name: io.extractFilename(filepath),
    path: filepath,
    filetype: handler ? handler.type : 'Unknown',
    handler: handler ? handler.handler : 'Unsupported',
    modified: DateTime.fromJSDate(stats.mtime),
    repo: null, // TODO: Resolve the Git repository to a Repository in the store and update the metafile with UUID.
    ref: null, // TODO: Resolve the Git branch and update the metafile with the branch name.
    content: await io.readFileAsync(filepath)
  };
  store.dispatch({ type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile });
  return metafile;
}

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
  store.dispatch({ type: ActionKeys.ADD_CARD, id: card.id, card: card });
  return card;
}