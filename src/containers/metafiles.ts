import { v4 } from 'uuid';
import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';

import * as io from './io';
import * as git from './git';
import { Metafile, Filetype } from '../types';
import { Actions, ActionKeys } from '../store/actions';

/**
 * Injects file stats information into metafile based on fs.stat results.
 * @param metafile Metafile object created in extractMetafile function.
 */
const statsDecorator = async (metafile: Metafile) => {
  if (!metafile.path) return metafile;
  const stats = await io.extractStats(metafile.path);
  if (stats) return { ...metafile, modified: DateTime.fromJSDate(stats.mtime) };
  else return metafile;
};

/**
 * Injects file content into metafile based on fs.readFile results.
 * @param metafile Metafile object created in extractMetafile function.
 */
const contentDecorator = async (metafile: Metafile) => {
  if (!metafile.path) return metafile;
  const content = await io.readFileAsync(metafile.path);
  return { ...metafile, content: content };
};

/**
 * Injects Git repo and ref information into metafile using 'isomorphic-git' module.
 * @param metafile Metafile object created in extractMetafile function.
 */
const gitDecorator = async (metafile: Metafile) => {
  if (!metafile.path) return metafile;
  const root = await git.getRepoRoot(metafile.path.toString());
  if (root) {
    // eslint-disable-next-line import/namespace
    const ref = await git.currentBranch({ dir: root, fullname: false });
    return { ...metafile, repo: 'managed', ref: (ref ? ref : null) };
    // TODO: Need to update the repo to be a valid UUID entry from Redux store
  } else return metafile;
}

/**
 * Read and extract metafile information for a specific filepath into Redux store. 
 * Metafile object is required for loading files into Cards.
 * @param filepath The relative or absolute path to evaluate.
 * @param filetypes Array of supported filetype information; preferrably derived from Redux store.
 * @return A Promise object for a Redux action that updates state with metafile of target filepath.
 */
export const extractMetafile = async (filepath: PathLike, filetypes: Filetype[]) => {
  const filename = io.extractFilename(filepath);
  const extension = io.extractExtension(filepath);
  const handler = filetypes.find(filetype => filetype.extensions.some(ext => ext === extension));

  const metafile: Metafile = {
    id: v4(),
    name: filename,
    path: filepath,
    filetype: handler ? handler.filetype : 'Unknown',
    handler: handler ? handler.handler : 'Unsupported',
    modified: DateTime.local(),
    repo: null,
    ref: null,
    content: null
  };

  return statsDecorator(metafile)
    .then(metafile => gitDecorator(metafile))
    .then(metafile => contentDecorator(metafile))
    .then(metafile => {
      const action: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
      return action;
    })
    .catch(error => { throw new Error(error.message) });
}