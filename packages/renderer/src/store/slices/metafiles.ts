import {extractStats, isDefined} from '#preload';
import type {EntityState, PayloadAction} from '@reduxjs/toolkit';
import {createEntityAdapter, createSlice} from '@reduxjs/toolkit';
import type {
  DiffMetafile,
  DirectoryMetafile,
  FileMetafile,
  FilebasedMetafile,
  Metafile,
  VersionedMetafile,
  VirtualMetafile,
} from '@syn-types/metafile';
import {DateTime} from 'luxon';

export const metafileAdapter = createEntityAdapter<Metafile>();

export const metafileSlice = createSlice({
  name: 'metafiles',
  initialState: metafileAdapter.getInitialState(),
  reducers: {
    metafileAdded: metafileAdapter.addOne,
    metafileRemoved: metafileAdapter.removeOne,
    metafileUpdated: {
      reducer: (state: EntityState<Metafile>, action: PayloadAction<Metafile>) => {
        metafileAdapter.upsertOne(state, action.payload);
      },
      prepare: (metafile: Metafile) => {
        return {payload: {...metafile, modified: DateTime.local().valueOf()}};
      },
    },
    metafilesUpdated: {
      reducer: (state: EntityState<Metafile>, action: PayloadAction<readonly Metafile[]>) => {
        metafileAdapter.upsertMany(state, action.payload);
      },
      prepare: (metafiles: readonly Metafile[]) => {
        return {
          payload: metafiles.map(metafile => ({
            ...metafile,
            modified: DateTime.local().valueOf(),
          })),
        };
      },
    },
    metafileReplaced: metafileAdapter.setOne,
  },
});

export const isVirtualMetafile = (metafile: Metafile | undefined): metafile is VirtualMetafile =>
  isDefined(metafile) && !isFilebasedMetafile(metafile);

export const isFilebasedMetafile = (
  metafile: Metafile | undefined,
): metafile is FilebasedMetafile =>
  isDefined(metafile) && (metafile as FilebasedMetafile).path !== undefined;

export const isFileMetafile = (metafile: Metafile | undefined): metafile is FileMetafile =>
  isFilebasedMetafile(metafile) && metafile.filetype !== 'Directory';

export const isDirectoryMetafile = (
  metafile: Metafile | undefined,
): metafile is DirectoryMetafile =>
  isFilebasedMetafile(metafile) && metafile.filetype === 'Directory';

export const isVersionedMetafile = (
  metafile: Metafile | undefined,
): metafile is VersionedMetafile =>
  isFilebasedMetafile(metafile) && (metafile as VersionedMetafile).repo !== undefined;

export const isDiffMetafile = (metafile: Metafile | undefined): metafile is DiffMetafile =>
  isDefined(metafile) && (metafile as DiffMetafile).targets !== undefined;

/**
 * Check for updates to the content of a filesystem object (i.e. file or directory) by examining
 * whether the [`fs.Stats.mtime`](https://nodejs.org/api/fs.html#class-fsstats) previously recorded
 * for a metafile is stale, or non-existent in the case of a newly created metafile.
 *
 * @param metafile The filebased Metafile object that should be evaluated for possible filesystem
 *   updates.
 * @returns {string | undefined} A string containing the epoch milliseconds of the latest `mtime`
 *   timestamp if newer than the previous `mtime` timestamp of the metafile, or `undefined`
 *   otherwise.
 */
export const hasFilebasedUpdates = async (
  metafile: FilebasedMetafile,
): Promise<number | undefined> => {
  const mtime = (await extractStats(metafile.path))?.mtime;
  if (!isDefined(mtime)) return undefined; // file does not exist in the filesystem
  const timestamp = DateTime.fromJSDate(mtime);

  if (!isDefined(metafile.mtime)) return timestamp.valueOf(); // metafile not previously identified as filebased
  const delta = timestamp.diff(DateTime.fromMillis(metafile.mtime)).valueOf();
  return delta > 0 ? timestamp.valueOf() : undefined; // only return timestamp if newer than previous timestamp
};

export const {metafileAdded, metafileRemoved, metafileReplaced, metafileUpdated, metafilesUpdated} =
  metafileSlice.actions;

export default metafileSlice.reducer;
