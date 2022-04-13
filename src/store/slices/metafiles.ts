import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { repoRemoved } from './repos';
import { filterObject, isDefined, Override } from '../../containers/format';
import { PURGE } from 'redux-persist';
import { branchRemoved } from './branches';
import { CardType, FilesystemStatus, GitStatus, Timestamp, UUID } from '../types';
import { PathLike } from 'fs-extra';

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
} & Partial<FilebasedProps>
    & Partial<FileProps>
    & Partial<DirectoryProps>
    & Partial<VersionedProps>
    & Partial<DiffProps>
    & Partial<MergingProps>;

export type MetafileTemplate = Omit<Metafile, 'id'>;
export type VirtualMetafile = Omit<Metafile, keyof FilebasedProps>;
export const isVirtualMetafile = (metafile: Metafile): metafile is VirtualMetafile => !isFilebasedMetafile(metafile);

export type FilebasedMetafile = Override<Metafile, FilebasedProps>;
export type FilebasedProps = {
    /** The relative or absolute path to the file or directory of this metafile. */
    readonly path: PathLike;
    /** The latest Filesystem status code for this file relative to the associated content. */
    readonly state: FilesystemStatus;
};
export const isFilebasedMetafile = (metafile: Metafile): metafile is FilebasedMetafile => {
    return metafile
        && (metafile as FilebasedMetafile).path !== undefined
        && (metafile as FilebasedMetafile).state !== undefined
};

export type FileMetafile = Override<FilebasedMetafile, FileProps>;
export type FileProps = {
    /** The textual contents maintained for files; can differ from actual file content when unsaved changes have been made. */
    readonly content: string;
};
export const isFileMetafile = (metafile: Metafile): metafile is FileMetafile => {
    return isFilebasedMetafile(metafile) && (metafile as FileMetafile).content !== undefined;
};

export type DirectoryMetafile = Override<FilebasedMetafile, DirectoryProps>;
export type DirectoryProps = {
    /** An array with all Metafile object UUIDs for direct sub-files and sub-directories. */
    readonly contains: UUID[];
};
export const isDirectoryMetafile = (metafile: Metafile): metafile is DirectoryMetafile => {
    return isFilebasedMetafile(metafile) && (metafile as DirectoryMetafile).contains !== undefined;
};

export type VersionedMetafile = Override<FilebasedMetafile, VersionedProps>;
export type VersionedProps = {
    /** The UUID for associated Repository object. */
    readonly repo: UUID;
    /** The UUID for associated Branch object. */
    readonly branch: UUID;
    /** The latest Git status code for this metafile relative to the associated repository and branch. */
    readonly status: GitStatus;
    /** An array of tuples indicating the start/end indices of each Git conflict in the content of this metafile. */
    readonly conflicts: [number, number][];
};
export const isVersionedMetafile = (metafile: Metafile): metafile is VersionedMetafile => {
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

export type MergingMetafile = Override<Metafile, MergingProps>;
export type MergingProps = {
    /** Object containing base branch and compare branch names involved in an in-progress branch merge. */
    readonly merging: { base: string, compare: string }
};
export const isMergingMetafile = (metafile: Metafile): metafile is MergingMetafile => {
    return (metafile as MergingMetafile).merging !== undefined;
};

export const metafilesAdapter = createEntityAdapter<Metafile>();

export const metafilesSlice = createSlice({
    name: 'metafiles',
    initialState: metafilesAdapter.getInitialState(),
    reducers: {
        metafileAdded: metafilesAdapter.addOne,
        metafileRemoved: metafilesAdapter.removeOne,
        metafileUpdated: {
            reducer: (state, action: PayloadAction<Metafile>) => {
                metafilesAdapter.upsertOne(state, action.payload);
            },
            prepare: (metafile: Metafile) => {
                return { payload: { ...metafile, modified: DateTime.local().valueOf() } };
            }
        },
        metafilesUpdated: {
            reducer: (state, action: PayloadAction<readonly Metafile[]>) => {
                metafilesAdapter.upsertMany(state, action.payload);
            },
            prepare: (metafiles: readonly Metafile[]) => {
                return { payload: metafiles.map(metafile => ({ ...metafile, modified: DateTime.local().valueOf() })) };
            }
        },
        metafileReplaced: metafilesAdapter.setOne
    },
    extraReducers: (builder) => {
        builder
            .addCase(repoRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter(isDefined)
                    .filter(m => m.repo === action.payload)
                    .map(m => {
                        return { id: m.id, changes: filterObject(m, ['repo', 'branch', 'status']) };
                    })
                metafilesAdapter.updateMany(state, updatedMetafiles);
            })
            .addCase(branchRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter(isDefined)
                    .filter(m => m.branch === action.payload)
                    .map(m => {
                        return { id: m.id, changes: filterObject(m, ['branch', 'status']) }
                    })
                metafilesAdapter.updateMany(state, updatedMetafiles);
            })
            .addCase(PURGE, (state) => {
                metafilesAdapter.removeAll(state);
            })
    }
})

export const { metafileAdded, metafileRemoved, metafileUpdated, metafilesUpdated } = metafilesSlice.actions;

export default metafilesSlice.reducer;