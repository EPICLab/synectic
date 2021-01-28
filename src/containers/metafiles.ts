import { Action, ActionKeys, NarrowActionType } from '../store/actions';
import { ThunkAction } from 'redux-thunk';
import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import type { Metafile, Filetype, Error, UUID } from '../types';
import { RootState } from '../store/root';
import * as io from './io';
import * as git from './git';
import { getRepository } from './repos';
import { asyncFilter } from './format';
import { shouldBeHiddenSync } from 'hidefile';

type AddMetafileAction = NarrowActionType<ActionKeys.ADD_METAFILE>;
type UpdateMetafileAction = NarrowActionType<ActionKeys.UPDATE_METAFILE>;
type AddErrorAction = NarrowActionType<ActionKeys.ADD_ERROR>;
export type PathRequiredMetafile = Metafile & Required<Pick<Metafile, 'path'>>;
export type ContainsRequiredMetafile = Metafile & Required<Pick<Metafile, 'contains'>>;

/**
 * Action Creator for composing a valid ADD_METAFILE Redux Action. The only required parameter is `name`,
 * since `id` and `modified` are automatically generated for the new `Metafile` object. However, other valid Metafile 
 * fields can be included via passing an anonymous JavaScript object with the requisite fields.
 * @param name The name to be associated with the new metafile.
 * @param fields Optional anonymous JavaScript object for all `Metafile` fields, except `id`, `name`, and `modified`.
 * @return An `AddMetafileAction` object that can be dispatched via Redux.
 */
export const addMetafile = (name: string, fields?: Omit<Metafile, 'id' | 'modified' | 'name'>): AddMetafileAction => {
  const metafile: Metafile = {
    id: v4(),
    name: name,
    modified: DateTime.local(),
    ...fields
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
 * @return An `UpdateMetafileAction` object that can be dispatched via Redux, including an updated timestamp in the
 * `modified` field.
 */
export const updateMetafile = (metafile: Metafile): UpdateMetafileAction => {
  return {
    type: ActionKeys.UPDATE_METAFILE,
    id: metafile.id,
    metafile: { ...metafile, modified: DateTime.local() }
  }
}

/**
 * Action Creator for composing a valid ADD_ERROR Redux Action.
 * @param target Corresponds to the object or field originating the error.
 * @param message The error message to be displayed to the user.
 * @return An `AddErrorAction` object that can be dispatched via Redux.
 */
export const metafilesError = (target: string, message: string): AddErrorAction => {
  const error: Error = {
    id: v4(),
    type: 'MetafilesError',
    target: target,
    message: message
  };
  return {
    type: ActionKeys.ADD_ERROR,
    id: error.id,
    error: error
  };
}

/**
 * Filter the paths within the metafile `contains` field and return an anonymous JavaScript object containing the 
 * differentiated `directories` and `files` paths. Filtering requires examining the file system properties associated
 * with each contained path, and is therefore asynchronous and computationally expensive.
 * @param metafile A `Metafile` object that includes a valid `contains` field.
 * @param includeHidden (Optional) Flag for returning hidden files (e.g. `.<filename>` format on MacOS); defaults to true.
 * @return An anonymous JavaScript object with directories and files lists containing the filtered paths.
 */
export const filterDirectoryContainsTypes = async (metafile: ContainsRequiredMetafile, includeHidden = true):
  Promise<{ directories: string[], files: string[] }> => {
  const directories: string[] = await asyncFilter(metafile.contains, async (e: string) => io.isDirectory(e));
  let files: string[] = metafile.contains.filter(childPath => !directories.includes(childPath));
  if (includeHidden == false) files = files.filter(childPath => !shouldBeHiddenSync(childPath));
  return { directories: directories, files: files };
};

/**
 * Thunk Action Creator for examining and updating the file system properties associated with a Metafile in the Redux store.
 * Any previously known file system properties for the given Metafile will be updated in the Redux store.
 * @param id The UUID corresponding to the metafile that should be updated.
 * @return A Thunk that can be executed to get file system properties and dispatch Redux updates.
 */
export const updateFileStats = (id: UUID): ThunkAction<Promise<UpdateMetafileAction | AddErrorAction>, RootState, undefined, Action> =>
  async (dispatch, getState) => {
    const metafile = getState().metafiles[id];
    if (!metafile) return dispatch(metafilesError(id, `Cannot update non-existing metafile for id: '${id}'`));
    if (!metafile.path) return dispatch(metafilesError(id, `Cannot update file stats for virtual metafile id: '${id}'`));

    const stats = await io.extractStats(metafile.path);
    const filetypes = Object.values(getState().filetypes);
    let handler: Filetype | undefined;
    if (stats && stats.isDirectory()) {
      handler = filetypes.find(filetype => filetype.filetype === 'Directory');
    } else {
      const extension = io.extractExtension(metafile.path);
      handler = filetypes.find(filetype => filetype.extensions.some(ext => ext === extension));
    }

    const updated: Metafile = {
      ...metafile,
      filetype: handler?.filetype,
      handler: handler?.handler
    }
    return dispatch(updateMetafile(updated));
  };

/**
* Thunk Action Creator for examining and updating git information for the associated Metafile in the Redux store. If the
* Metafile is not associated with a git repository, then no valid git information can be extracted and dispatching this
* action will not result in any changes in the Redux store state. If the branch has previously been updated from within 
* Synectic (e.g. through switching the branch of a card), then this method is destructive to those changes and will 
* trigger a file content update that might also be destructive.
* @param id The UUID corresponding to the metafile that should be updated.
* @return A Thunk that can be executed to read git information and dispatch Redux updates.
*/
export const updateGitInfo = (id: UUID): ThunkAction<Promise<UpdateMetafileAction | AddErrorAction>, RootState, undefined, Action> =>
  async (dispatch, getState) => {
    const metafile = getState().metafiles[id];
    if (!metafile) return dispatch(metafilesError(id, `Cannot update non-existing metafile for id: '${id}'`));
    if (!metafile.path) return dispatch(metafilesError(id, `Cannot update git info for virtual metafile id: '${id}'`));

    const repoAction = metafile.path ? await dispatch(getRepository(metafile.path)) : undefined;
    const repo = repoAction ? getState().repos[repoAction.id] : undefined;
    const branch = repo ? (await git.currentBranch({ dir: repo.root.toString(), fullname: false })) : undefined;
    const updated: Metafile = (!repo || !metafile.path) ? metafile :
      { ...metafile, repo: repo.id, branch: branch ? branch : 'HEAD', status: (await git.getStatus(metafile.path)) };
    return dispatch(updateMetafile(updated));
  };


/**
 * Thunk Action Creator for examining and updating either the file or directory contents into the associated Metafile in the
 * Redux store. If the metafile is associated with a directory, then the paths of direct child files and directories are added 
 * to the `contains` field. If the metafile is associated with a file, then the file content is read and added to the `content` 
 * field. If either the `contains` or `content` fields have been updated (but not saved) from within Synectic, then this 
 * method is destructive to those changes. Those fields will be forecfully updated to reflect the version according to the 
 * file system.
 * @param id The UUID corresponding to the metafile that should be updated.
 * @return A Thunk that can be executed to asynchronously read content and dispatch Redux updates.
 */
export const updateContents = (id: UUID): ThunkAction<Promise<UpdateMetafileAction | AddErrorAction>, RootState, undefined, Action> =>
  async (dispatch, getState) => {
    const metafile = getState().metafiles[id];
    if (!metafile) return dispatch(metafilesError(id, `Cannot update non-existing metafile for id: '${id}'`));
    if (!metafile.path) return dispatch(metafilesError(id, `Cannot update file content for virtual metafile id: '${id}'`));

    const updated: Metafile = (metafile.filetype === 'Directory') ?
      { ...metafile, contains: (await io.readDirAsyncDepth(metafile.path, 1)).filter(p => p !== metafile.path) } :
      { ...metafile, content: await io.readFileAsync(metafile.path, { encoding: 'utf-8' }) };
    return dispatch(updateMetafile(updated));
  };

/**
 * Thunk Action Creator for updating all fields of the metafile existing in the Redux store.
 * @param id The UUID corresponding to the metafile that should be updated.
 * @return A Thunk that can be executed to asynchronously execute all of the metafile-related update actions and 
 * returns true afterwards, or false if no updates could be executed because the UUID has no matches in the Redux store.
 */
export const updateAll = (id: UUID): ThunkAction<Promise<boolean>, RootState, undefined, Action> =>
  async (dispatch, getState) => {
    const existing = getState().metafiles[id];
    if (!existing) return false;
    await dispatch(updateFileStats(id));
    await dispatch(updateGitInfo(id));
    await dispatch(updateContents(id));
    return true;
  };

// Descriminated union type for emulating a `mutually exclusive or` (XOR) operation between parameter types
// Ref: https://github.com/microsoft/TypeScript/issues/14094#issuecomment-344768076
type MetafileGettableFields =
  { id: UUID, filepath?: never, virtual?: never } |
  { id?: never, filepath: PathLike, virtual?: never } |
  {
    id?: never, filepath?: never, virtual:
    Required<Pick<Metafile, 'name' | 'handler'>> & Omit<Metafile, 'id' | 'modified' | 'name' | 'handler'>
  };

/**
 * Thunk Action Creator for retrieving a `Metafile` object associated with one of three different paremeter sets: (1) retrieve existing 
 * metafile by UUID, (2) get a existing or new metafile associated with a particular file path, or (3) get a new or existing virtual 
 * metafile by name and handler.
 * 
 * If no existing metafile is found under (1), then a `MetafileMissingError` error is thrown and undefined is returned. A `Metafile` object
 * is always returned under (2) and (3), since either an existing metafile is returned or a new metafile is created and returned. All 
 * fields within the metafile are updated in the Redux store before being returned.
 * @param id The UUID corresponding to the metafile that should be updated and returned.
 * @param filepath The relative or absolute path to a file or directory that should be represented by an updated metafile.
 * @param virtual A named object containing at least the `name` and `handler` fields of a valid metafile (existing or new), and any other 
 * metafile fields except for `id` and `modified` (which are auto-generated on metafile creation).
 * @return A Thunk that can be executed to simultaneously dispatch Redux updates and retrieve a `Metafile` object, if the
 * metafile cannot be added or retrieved from the Redux store then `undefined` is returned instead.
 */
export const getMetafile = (param: MetafileGettableFields): ThunkAction<Promise<Metafile | undefined>, RootState, undefined, Action> => {
  return async (dispatch, getState) => {
    if (param.id) {
      // searches by UUID for existing Metafile in Redux store, dispatching an Error and returning undefined if no match, or updates 
      // Metafile otherwise
      const existing = await dispatch(updateAll(param.id));
      if (!existing) dispatch(metafilesError(param.id, `Cannot update non-existing metafile for id: '${param.id}'`));
      return existing ? getState().metafiles[param.id] : undefined;
    }
    if (param.filepath) {
      // searches by filepath (and git branch if available) for existing Metafile in the Redux store, creating a new Metafile if no match, 
      // or updates Metafile otherwise
      const metafiles = Object.values(getState().metafiles);
      const root = await git.getRepoRoot(param.filepath);
      const branch = root ? (await git.currentBranch({ dir: root.toString(), fullname: false })) : undefined;
      const existing = branch ? metafiles.find(m => m.path == param.filepath && m.branch == branch) :
        metafiles.find(m => m.path == param.filepath);
      const id = existing ? existing.id : dispatch(addMetafile(io.extractFilename(param.filepath), { path: param.filepath })).id;
      const updated = await dispatch(updateAll(id));
      return updated ? getState().metafiles[id] : undefined;
    }
    if (param.virtual) {
      // searches by name and handler for existing Metafile in the Redux store, creates a new Metafile if no match, or returns 
      // Metafile otherwise
      const metafiles = Object.values(getState().metafiles);
      const existing = metafiles.find(m => m.name == param.virtual.name && m.handler == param.virtual.handler);
      const id = existing ? existing.id : dispatch(addMetafile(param.virtual.name, param.virtual)).id;
      return getState().metafiles[id];
    }
  };
}