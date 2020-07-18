import { Action, ActionKeys } from '../store/actions';
import { ThunkAction } from 'redux-thunk';
import { AnyAction } from 'redux';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { NarrowType, Metafile, Filetype, UUID } from '../types';
import { RootState } from '../store/root';
import * as io from './io';
import * as git from './git';
import { getRepository } from './repos';
import { asyncFilter } from './format';

export type PathRequiredMetafile = Metafile & Required<Pick<Metafile, 'path'>>;
export type ContainsRequiredMetafile = Metafile & Required<Pick<Metafile, 'contains'>>;

/**
 * Action Creator for composing a valid ADD_METAFILE Redux Action.
 * @param filepath The relative or absolute path to evaluate.
 * @param branch Git branch name or commit hash; defaults to 'master'.
 * @return An `AddMetafileAction` object that can be dispatched via Redux.
 */
const addMetafile = (filepath: PathLike, branch?: UUID): NarrowType<Action, ActionKeys.ADD_METAFILE> => {
  const metafile: Metafile = {
    id: v4(),
    name: io.extractFilename(filepath),
    path: filepath,
    modified: DateTime.local(),
    branch: branch
  };
  return {
    type: ActionKeys.ADD_METAFILE,
    id: metafile.id,
    metafile: metafile
  };
}

/**
 * Action Creator for composing a valid UPDATE_METAFILE Redux Action. If the current Redux store does not contain a 
 * matching metafile (based on UUID) for the passed parameter, then dispatching this action will not result in any
 * changes in the Redux store state.
 * @param metafile A `Metafile` object containing new field values to be updated.
 * @return An `UpdateMetafileAction` object that can be dispatched via Redux.
 */
const updateMetafile = (metafile: Metafile): NarrowType<Action, ActionKeys.UPDATE_METAFILE> => {
  return {
    type: ActionKeys.UPDATE_METAFILE,
    id: metafile.id,
    metafile: metafile
  }
}

/**
 * Filter the paths within the `contains` field of a `Metafile` and return an anonymous JavaScript object containing
 * the differentiated `directories` and `files` paths. Filtering requires examining the file system properties associated
 * with each contained path, and is therefore asynchronous and computationally expensive.
 * @param metafile A `Metafile` object that includes a valid `contains` field.
 * @param includeHidden (Optional) Flag for returning MacOS hidden files (in the format `.<filename>`); defaults to true.
 * @return An anonymous JavaScript object with directories and files lists containing the filtered paths.
 */
export const filterDirectoryContainsTypes = async (metafile: ContainsRequiredMetafile, includeHidden = true): Promise<{ directories: string[], files: string[] }> => {
  const directories: string[] = await asyncFilter(metafile.contains, async (e: string) => io.isDirectory(e));
  let files: string[] = metafile.contains.filter(childPath => !directories.includes(childPath));
  if (includeHidden == false) files = files.filter(childPath => !io.extractFilename(childPath).startsWith('.'));
  return { directories: directories, files: files };
};

/**
 * Thunk Action Creator for examining and updating the file system properties associated with a Metafile in the Redux store.
 * Any previous known file system properties for the given Metafile will be updated, and the Reux store is updated as well.
 * @param metafile A `Metafile` object that includes a valid `path` field.
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and retrieve the updated `Metafile` object.
 */
export const updateFileStats = (metafile: PathRequiredMetafile): ThunkAction<Promise<Metafile>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const filetypes = Object.values(getState().filetypes);
    const stats = await io.extractStats(metafile.path);
    let handler: Filetype | undefined;
    if (stats?.isDirectory()) {
      handler = filetypes.find(filetype => filetype.filetype === 'Directory');
    } else {
      const extension = io.extractExtension(metafile.path);
      handler = filetypes.find(filetype => filetype.extensions.some(ext => ext === extension));
    }
    const updated: Metafile = {
      ...metafile,
      modified: stats ? DateTime.fromJSDate(stats.mtime) : DateTime.local(),
      filetype: handler?.filetype,
      handler: handler?.handler
    }
    dispatch(updateMetafile(updated));
    return getState().metafiles[metafile.id];
  };

/**
* Thunk Action Creator for examining and updating file contents into the associated Metafile in the Redux store. If the metafile
* is associated with a directory, then no valid content can be extracted and the metafile is returned unchanged. If the contents 
* have previously been updated from within Synectic (e.g. through an Editor card), then this method is destructive to those 
* changes. The file contents will be forcefully updated to reflect the version according to the file system.
* @param metafile A `Metafile` object that includes a valid `path` field.
* @return A Thunk that can be executed to simultaneously dispatch Redux updates and retrieve the updated `Metafile` object.
*/
export const updateFileContents = (metafile: PathRequiredMetafile): ThunkAction<Promise<Metafile>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    if (metafile.filetype === 'Directory') return metafile;
    const content = await io.readFileAsync(metafile.path, { encoding: 'utf-8' });
    dispatch(updateMetafile({ ...metafile, content: content }));
    return getState().metafiles[metafile.id];
  };

/**
* Thunk Action Creator for examining and updating git information for the associated Metafile in the Redux store. If the
* metafile is not associated with a git repository, then no valid git information can be extracted adn the metafile is 
* returned unchanged. If the branch has previously been updated from within Synectic (e.g. through switching the branch
* from the back of a card), then this method is destructive to those changes and will trigger a file content update that
* might also be destructive (see @getFileContents). 
* @param metafile A `Metafile` object that includes a valid `path` field.
* @return A Thunk that can be executed to simultaneously dispatch Redux updates and retrieve the updated `Metafile` object.
*/
export const updateGitInfo = (metafile: PathRequiredMetafile): ThunkAction<Promise<Metafile>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const repo = await dispatch(getRepository(metafile.path));
    if (!repo) return metafile;
    const branch = await git.currentBranch({ dir: repo.root.toString(), fullname: false });
    const updated: Metafile = {
      ...metafile,
      repo: repo.id,
      branch: branch ? branch : 'HEAD'
    }
    dispatch(updateMetafile(updated));
    return getState().metafiles[metafile.id];
  };

/**
 * Thunk Action Creator for examining and updating directory contents into the associated Metafile in the Redux store. If the
 * metafile is not associated with a directory, then no valid contains files and/or directories can be extracted and the 
 * metafile is returned unchanged. If the directory has previously been updated from within Synectic (e.g. through creating 
 * a new card, or renaming files in the File Explorer card), then this method is destructive to those changes. The directory 
 * contains will be forcefully updated to reflect the version according to the file system.
 * @param metafile A `Metafile` object that includes a valid `path` field.
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and retrieve the updated `Metafile` object.
 */
export const updateDirectoryContains = (metafile: PathRequiredMetafile): ThunkAction<Promise<Metafile>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    if (metafile.filetype !== 'Directory') return metafile;
    const parentPath = metafile.path;
    const childPaths = (await io.readDirAsyncDepth(parentPath, 1)).filter(p => p !== parentPath);
    if (JSON.stringify(childPaths) === JSON.stringify(metafile.contains)) return metafile; // escape hatch if no updates
    const updated: Metafile = {
      ...metafile,
      contains: childPaths
    }
    dispatch(updateMetafile(updated));
    return getState().metafiles[metafile.id];
  };

/**
 * Thunk Action Creator for retrieving a `Metafile` object associated associated with the given filepath. If there is no
 * previous metafile for the given filepath, then a new metafile is created and the Redux store is updated to include this
 * previously unknown metafile. If there is a previous metafile, then the file system properties associated with the
 * metafile are updated and the Redux store is updated to include these updates. Git information, file contents, and 
 * directory contains fields are updated (as needed or determined by filetype) in the Redux store.
 * @param filepath The relative or absolute path to evaluate.
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and retrieve a `Metafile` object.
 */
export const getMetafile = (filepath: PathLike): ThunkAction<Promise<Metafile>, RootState, undefined, AnyAction> =>
  async (dispatch, getState) => {
    const metafiles = Object.values(getState().metafiles);
    const root = await git.getRepoRoot(filepath);
    const currentRef = await git.currentBranch({ dir: root, fullname: false });
    const currentBranch = currentRef ? currentRef : undefined; // type narrowing to convert void types to undefined

    const existing = currentBranch ? metafiles.find(m => m.path == filepath && m.branch == currentBranch) : metafiles.find(m => m.path == filepath);
    let metafile = existing ? existing : dispatch(addMetafile(filepath, currentBranch)).metafile;
    metafile = await dispatch(updateFileStats(metafile as PathRequiredMetafile));
    metafile = await dispatch(updateGitInfo(metafile as PathRequiredMetafile));
    metafile = await dispatch(updateFileContents(metafile as PathRequiredMetafile));
    metafile = await dispatch(updateDirectoryContains(metafile as PathRequiredMetafile));

    return metafile;
  };