import { PathLike } from 'fs-extra';
import { v4 } from 'uuid';
import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Metafile, UUID } from '../types';
import * as io from './io';
import { AppThunkAPI } from '../store/store';
import { getRepository } from './repos';
import { asyncFilter } from './format';
import { currentBranch, getRepoRoot, getStatus } from './git-porcelain';
import { resolveHandler } from './handlers';
import { updateMetafile, addMetafile } from '../store/slices/metafiles';
import { DateTime } from 'luxon';
import { isHiddenFile } from 'is-hidden-file';

export type MetafileWithPath = Metafile & Required<Pick<Metafile, 'path'>>;
export type MetafileWithContent = Metafile & Required<Pick<Metafile, 'content'>>;
export type MetafileWithContains = Metafile & Required<Pick<Metafile, 'contains'>>;
export type MetafileWithTargets = Metafile & Required<Pick<Metafile, 'targets'>>;

export const isMetafileFile = (metafile: Metafile): metafile is MetafileWithContent => {
  return (metafile as MetafileWithContent).content !== undefined;
}

export const isMetafileDirectory = (metafile: Metafile): metafile is MetafileWithContains => {
  return (metafile as MetafileWithContains).contains !== undefined;
}

export const isMetafileDiff = (metafile: Metafile): metafile is MetafileWithTargets => {
  return (metafile as MetafileWithTargets).targets !== undefined;
}

/**
 * Filter the paths within the metafile `contains` field and return an anonymous JavaScript object containing the 
 * differentiated `directories` and `files` paths. Filtering requires examining the file system properties associated
 * with each contained path, and is therefore asynchronous and computationally expensive.
 * @param metafile A `Metafile` object that includes a valid `contains` field.
 * @param includeHidden (Optional) Flag for returning hidden files (e.g. `.<filename>` format on MacOS); defaults to true.
 * @return An anonymous JavaScript object with directories and files lists containing the filtered paths.
 */
export const filterDirectoryContainsTypes = async (metafile: MetafileWithContains, includeHidden = true):
  Promise<{ directories: string[], files: string[] }> => {
  const directories: string[] = await asyncFilter(metafile.contains, async (e: string) => io.isDirectory(e));
  let files: string[] = metafile.contains.filter(childPath => !directories.includes(childPath));
  if (includeHidden == false) files = files.filter(childPath => !isHiddenFile(childPath));
  return { directories: directories, files: files };
};

/**
 * Thunk Action Creator for examining and updating the file system properties associated with a Metafile in the Redux store.
 * Any previously known file system properties for the given Metafile will be updated in the Redux store.
 * @param id The UUID corresponding to the metafile that should be updated.
 * @return A Thunk that can be executed to get file system properties and dispatch Redux updates.
 */
export const updateFileStats = createAsyncThunk<void, UUID, AppThunkAPI>(
  'metafiles/updateFileStats',
  async (id, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles[id];
    if (!metafile.path) return thunkAPI.rejectWithValue(metafile);
    const handler = await thunkAPI.dispatch(resolveHandler(metafile.path));
    thunkAPI.dispatch(updateMetafile({
      id: metafile.id,
      metafile: {
        ...metafile,
        filetype: handler?.filetype,
        handler: handler?.handler
      }
    }))
  }
)

/**
* Thunk Action Creator for examining and updating git information for the associated Metafile in the Redux store. If the
* Metafile is not associated with a git repository, then no valid git information can be extracted and dispatching this
* action will not result in any changes in the Redux store state. If the branch has previously been updated from within 
* Synectic (e.g. through switching the branch of a card), then this method is destructive to those changes and will 
* trigger a file content update that might also be destructive.
* @param id The UUID corresponding to the metafile that should be updated.
* @return A Thunk that can be executed to read git information and dispatch Redux updates.
*/
export const updateGitInfo = createAsyncThunk<void, UUID, AppThunkAPI>(
  'metafiles/updateGitInfo',
  async (id, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles[id];
    if (!metafile.path) return thunkAPI.rejectWithValue(metafile);
    const repo = await thunkAPI.dispatch(getRepository(metafile.path));
    const root = await getRepoRoot(metafile.path);
    const branch = repo ? (await currentBranch({
      dir: root ? root : repo.root.toString(),
      fullname: false
    })) : undefined;
    const status = await getStatus(metafile.path);
    thunkAPI.dispatch(updateMetafile({
      id: metafile.id,
      metafile: {
        ...metafile,
        repo: repo?.id,
        branch: branch ? branch : 'HEAD',
        status: status
      }
    }))
  }
)

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
export const updateContents = createAsyncThunk<void, UUID, AppThunkAPI>(
  'metafiles/updateContents',
  async (id, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles[id];
    if (!metafile.path) return thunkAPI.rejectWithValue(metafile);
    thunkAPI.dispatch(updateMetafile({
      id: metafile.id,
      metafile: (metafile.filetype === 'Directory') ?
        { ...metafile, contains: (await io.readDirAsyncDepth(metafile.path, 1)).filter(p => p !== metafile.path) } :
        { ...metafile, content: await io.readFileAsync(metafile.path, { encoding: 'utf-8' }), state: 'unmodified' }
    }))
  }
)

/**
 * Thunk Action Creator for updating all fields of the metafile existing in the Redux store.
 * @param id The UUID corresponding to the metafile that should be updated.
 * @return A Thunk that can be executed to asynchronously execute all of the metafile-related update actions and 
 * returns true afterwards, or false if no updates could be executed because the UUID has no matches in the Redux store.
 */
export const updateAll = createAsyncThunk<boolean, UUID, AppThunkAPI>(
  'metafiles/updateAll',
  async (id, thunkAPI) => {
    const existing = thunkAPI.getState().metafiles[id];
    if (!existing) return false;
    await thunkAPI.dispatch(updateFileStats(id));
    await thunkAPI.dispatch(updateGitInfo(id));
    await thunkAPI.dispatch(updateContents(id));
    return true;
  }
)

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
export const getMetafile = createAsyncThunk<Metafile, MetafileGettableFields, AppThunkAPI>(
  'metafiles/getMetafile',
  async (retrieveBy, thunkAPI) => {
    if (retrieveBy.id) {
      const existing = await thunkAPI.dispatch(updateAll(retrieveBy.id));
      if (!existing) return thunkAPI.rejectWithValue(existing);
      return thunkAPI.getState().metafiles[retrieveBy.id];
    }
    if (retrieveBy.filepath) {
      const root = await getRepoRoot(retrieveBy.filepath);
      const branch = root ? (await currentBranch({ dir: root.toString(), fullname: false })) : undefined;
      const metafiles = Object.values(thunkAPI.getState().metafiles);
      const existing = branch ?
        metafiles.find(m => m.path == retrieveBy.filepath && m.branch == branch) :
        metafiles.find(m => m.path == retrieveBy.filepath);
      const id = existing ? existing.id : v4();
      if (!existing) {
        thunkAPI.dispatch(addMetafile({
          id: id,
          name: io.extractFilename(retrieveBy.filepath),
          modified: DateTime.local().valueOf(),
          path: retrieveBy.filepath
        }));
      }
      await thunkAPI.dispatch(updateAll(id));
      return thunkAPI.getState().metafiles[id];
    }
    if (retrieveBy.virtual) {
      const metafiles = Object.values(thunkAPI.getState().metafiles);
      const existing = metafiles.find(m => m.name == retrieveBy.virtual.name && m.handler == retrieveBy.virtual.handler);
      const id = existing ? existing.id : v4();
      if (!existing) {
        thunkAPI.dispatch(addMetafile({ id: id, modified: DateTime.local().valueOf(), ...retrieveBy.virtual }));
      }
      return thunkAPI.getState().metafiles[id];
    }
    return thunkAPI.rejectWithValue('Failed to match any case');
  }
)