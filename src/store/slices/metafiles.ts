import { createEntityAdapter, createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { repoRemoved } from './repos';
import { filterObject, isDefined, Override } from '../../containers/utils';
import { PURGE } from 'redux-persist';
import { branchRemoved } from './branches';
import { CardType, FilesystemStatus, Flag, GitStatus, Timestamp, UUID } from '../types';
import { PathLike } from 'fs-extra';
import { extractStats } from '../../containers/io';

/** A metafile representing specifications and state for files, directories, diffs, and virtual content loaded into Synectic. */
export type Metafile = {
  /** The UUID for Metafile object. */
  readonly id: UUID;
  /** The name of metafile (e.g. `data.php` for files, `tests/` for directories, `local/data.php<>remote/data.php` for diffs). */
  readonly name: string;
  /** The timestamp for last update to metafile properties (not directly associated with filesystem `mtime` or `ctime`). */
  readonly modified: Timestamp;
  /** The type of card that can load the content of this metafile. */
  readonly handler: CardType;
  /** The filetype format for encoding/decoding contents, as well as determining syntax highlighting. */
  readonly filetype: string;
  /** Flags indicating in-progress actions that might affect values in this metafile. */
  readonly flags: Flag[];
} & Partial<FilebasedProps> &
  Partial<FileProps> &
  Partial<DirectoryProps> &
  Partial<VersionedProps> &
  Partial<DiffProps>;

/** A metafile without the requisite ID field, which can be used for composing valid Metafiles prior to them being assigned an ID. */
export type MetafileTemplate = Omit<Metafile, 'id'>;
/** A metafile without an associated filesystem object. */
export type VirtualMetafile = Omit<Metafile, keyof FilebasedProps>;
export const isVirtualMetafile = (metafile: Metafile): metafile is VirtualMetafile =>
  !isFilebasedMetafile(metafile);

/** A metafile with an associated filesystem object (e.g. file or directory). Does not guarantee that type-specific fields have been added. */
export type FilebasedMetafile = Override<Metafile, FilebasedProps>;
export type FilebasedProps = {
  /** The relative or absolute path to the file or directory of this metafile. */
  readonly path: PathLike;
  /** The latest Filesystem status code for this file relative to the associated content. */
  readonly state: FilesystemStatus;
};
export const isFilebasedMetafile = (
  metafile: Metafile | undefined
): metafile is FilebasedMetafile => {
  return (
    isDefined(metafile) &&
    (metafile as FilebasedMetafile).path !== undefined &&
    (metafile as FilebasedMetafile).state !== undefined
  );
};

/** A metafile that contains file information related to a similar type of filesystem object. */
export type FileMetafile = Override<FilebasedMetafile, FileProps>;
export type FileProps = {
  /** The textual contents maintained for files; can differ from actual file content when unsaved changes have been made. */
  readonly content: string;
  /** The timestamp for last observed update to the associated filesystem object (represented by the `mtime` filesystem value). */
  readonly mtime: Timestamp;
};
export const isFileMetafile = (metafile: Metafile | undefined): metafile is FileMetafile => {
  return (
    isFilebasedMetafile(metafile) &&
    metafile.filetype !== 'Directory' &&
    (metafile as FileMetafile).content !== undefined &&
    (metafile as FileMetafile).mtime !== undefined
  );
};

/** A metafile that contains directory information related to a similar type of filesystem object. */
export type DirectoryMetafile = Override<FilebasedMetafile, DirectoryProps>;
export type DirectoryProps = {
  /** An array with all Metafile object UUIDs for direct sub-files and sub-directories. */
  readonly contains: UUID[];
  /** The timestamp for last observed update to the associated filesystem object (represented by the `mtime` filesystem value). */
  readonly mtime: Timestamp;
};
export const isDirectoryMetafile = (
  metafile: Metafile | undefined
): metafile is DirectoryMetafile => {
  return (
    isFilebasedMetafile(metafile) &&
    metafile.filetype === 'Directory' &&
    (metafile as FileMetafile).contains !== undefined &&
    (metafile as FileMetafile).mtime !== undefined
  );
};

/** A metafile that is associated with a filesystem object that is tracked by a version control system. */
export type VersionedMetafile = Override<FilebasedMetafile, VersionedProps>;
export type VersionedProps = {
  /** The UUID for associated Repository object. */
  readonly repo: UUID;
  /** The UUID for associated Branch object. */
  readonly branch: UUID;
  /** The latest Git status code for this metafile relative to the associated repository and branch. */
  readonly status: GitStatus;
  /**
   * An array indicating paths to conflicting sub-files (in the case of a DirectoryMetafile), or an
   * array indicating the starting index for each Git conflict chunk in the content of this metafile
   * (in the case of a FileMetafile).
   */
  readonly conflicts: (number | PathLike)[];
};
export const isVersionedMetafile = (
  metafile: Metafile | undefined
): metafile is VersionedMetafile => {
  return isFilebasedMetafile(metafile) && (metafile as VersionedMetafile).repo !== undefined;
};

export type DiffMetafile = Override<Metafile, DiffProps>;
export type DiffProps = {
  /** An array with all Card object UUIDs included in the diff output. */
  readonly targets: UUID[];
};
export const isDiffMetafile = (metafile: Metafile): metafile is DiffMetafile => {
  return (metafile as DiffMetafile).targets !== undefined;
};

/**
 * Check for updates to the content of a filesystem object (i.e. file or directory) by examining whether the
 * [`fs.Stats.mtime`](https://nodejs.org/api/fs.html#class-fsstats) previously recorded for a metafile is stale, or
 * non-existent in the case of a newly created metafile.
 *
 * @param metafile The filebased Metafile object that should be evaluated for possible filesystem updates.
 * @returns {string | undefined} A string containing the epoch milliseconds of the latest `mtime` timestamp if newer
 * than the previous `mtime` timestamp of the metafile, or `undefined` otherwise.
 */
export const hasFilebasedUpdates = async (
  metafile: FilebasedMetafile
): Promise<number | undefined> => {
  const mtime = (await extractStats(metafile.path))?.mtime;
  if (!isDefined(mtime)) return undefined; // file does not exist in the filesystem
  const timestamp = DateTime.fromJSDate(mtime);

  if (!isDefined(metafile.mtime)) return timestamp.valueOf(); // metafile not previously identified as filebased
  const delta = timestamp.diff(DateTime.fromMillis(metafile.mtime)).valueOf();
  return delta > 0 ? timestamp.valueOf() : undefined; // only return timestamp if newer than previous timestamp
};

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
        return { payload: { ...metafile, modified: DateTime.local().valueOf() } };
      }
    },
    metafilesUpdated: {
      reducer: (state: EntityState<Metafile>, action: PayloadAction<readonly Metafile[]>) => {
        metafileAdapter.upsertMany(state, action.payload);
      },
      prepare: (metafiles: readonly Metafile[]) => {
        return {
          payload: metafiles.map(metafile => ({
            ...metafile,
            modified: DateTime.local().valueOf()
          }))
        };
      }
    },
    metafileReplaced: metafileAdapter.setOne
  },
  extraReducers: builder => {
    builder
      .addCase(repoRemoved, (state, action) => {
        const updatedMetafiles = Object.values(state.entities)
          .filter(isDefined)
          .filter(m => m.repo === action.payload)
          .map(m => {
            return { id: m.id, changes: filterObject(m, ['repo', 'branch', 'status']) };
          });
        metafileAdapter.updateMany(state, updatedMetafiles);
      })
      .addCase(branchRemoved, (state, action) => {
        const updatedMetafiles = Object.values(state.entities)
          .filter(isDefined)
          .filter(m => m.branch === action.payload)
          .map(m => {
            return { id: m.id, changes: filterObject(m, ['branch', 'status']) };
          });
        metafileAdapter.updateMany(state, updatedMetafiles);
      })
      .addCase(PURGE, state => {
        metafileAdapter.removeAll(state);
      });
  }
});

export const {
  metafileAdded,
  metafileRemoved,
  metafileReplaced,
  metafileUpdated,
  metafilesUpdated
} = metafileSlice.actions;

export default metafileSlice.reducer;
