import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DateTime } from 'luxon';
import { repoRemoved } from './repos';
import { filterObject } from '../../containers/format';
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
    /** The filetype format for encoding/decoding contents (same as `Filetype.filetype`, but this allows for virtual metafiles). */
    readonly filetype?: string;
    /** The type of card that can load the content of this metafile. */
    readonly handler?: CardType;
    /** The relative or absolute path to the file or directory of this metafile. */
    readonly path?: PathLike;
    /** The UUID for related Repository object, when managed by a version control system. */
    readonly repo?: UUID;
    /** The UUID for related Branch object, when managed by a version control system. */
    readonly branch?: UUID;
    /** The latest Git status code for this file relative to the associated repository and branch. */
    readonly status?: GitStatus;
    /** The latest Filesystem status code for this file relative to the associated content. */
    readonly state?: FilesystemStatus;
    /** The textual contents maintained for files; can differ from actual file content when unsaved changes are made in Synectic. */
    readonly content?: string;
    /** An array with all Metafile object UUIDs for direct sub-files and sub-directories (when this metafile has a `Directory` filetype). */
    readonly contains?: UUID[];
    /** An array with all Card object UUIDs included in the diff output (when this metafile has a `Diff` handler). */
    readonly targets?: UUID[];
    /** An object for branch merging information, including base branch and compare branch names from the `repo`. */
    readonly merging?: { base: string, compare: string }
    /** An array of indexed conflicts indicating the starting position of each conflict in the content of this metafile. */
    readonly conflicts?: number[] | undefined;
}

export const metafilesAdapter = createEntityAdapter<Metafile>();

export const metafilesSlice = createSlice({
    name: 'metafiles',
    initialState: metafilesAdapter.getInitialState(),
    reducers: {
        metafileAdded: metafilesAdapter.addOne,
        metafileRemoved: metafilesAdapter.removeOne,
        metafileUpdated: (state, action: PayloadAction<Metafile>) => {
            metafilesAdapter.upsertOne(state, {
                ...action.payload, modified: DateTime.local().valueOf()
            })
        },
        metafilesUpdated: metafilesAdapter.updateMany
    },
    extraReducers: (builder) => {
        builder
            .addCase(repoRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter((m): m is Metafile => m !== undefined)
                    .filter(m => m.repo === action.payload)
                    .map(m => {
                        return { id: m.id, changes: filterObject(m, ['repo', 'branch', 'status']) };
                    })
                metafilesAdapter.updateMany(state, updatedMetafiles);
            })
            .addCase(branchRemoved, (state, action) => {
                const updatedMetafiles = Object.values(state.entities)
                    .filter((m): m is Metafile => m !== undefined)
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