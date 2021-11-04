import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike, remove } from 'fs-extra';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import { Metafile, Filetype, UUID } from '../../types';
import { AppThunkAPI } from '../hooks';
import { metafilesSlice } from '../slices/metafiles';
import { removeUndefined, removeUndefinedProperties, WithRequired } from '../../containers/format';
import { resolveHandler } from './handlers';
import { extractFilename, readDirAsyncDepth, readFileAsync, writeFileAsync } from '../../containers/io';
import { currentBranch, getRepoRoot, getStatus } from '../../containers/git-porcelain';
import { fetchRepo } from './repos';
import { discardChanges } from '../../containers/git-plumbing';
import { dirname, relative } from 'path';

export type FileMetafile = WithRequired<Metafile, 'content' | 'path'>;
export type DirectoryMetafile = WithRequired<Metafile, 'contains' | 'path'>;
export type FilebasedMetafile = WithRequired<Metafile, 'path'>;
export type VirtualMetafile = WithRequired<Metafile, 'handler'> & Omit<Metafile, 'filetype' | 'state' | 'status' | 'repo' | 'branch'>;

export const isFileMetafile = (metafile: Metafile): metafile is FileMetafile => {
    return (metafile as FileMetafile).content !== undefined;
};

export const isDirectoryMetafile = (metafile: Metafile): metafile is DirectoryMetafile => {
    return (metafile as DirectoryMetafile).contains !== undefined;
};

export const isFilebasedMetafile = (metafile: Metafile): metafile is FilebasedMetafile => {
    return (metafile as FilebasedMetafile).path !== undefined;
}

export const isVirtualMetafile = (metafile: Metafile): metafile is VirtualMetafile => {
    return (metafile as VirtualMetafile).handler !== undefined && !('filetype' in metafile);
};

type PathOrVirtual = { filepath: PathLike, virtual?: never } | { filepath?: never, virtual: VirtualMetafile };

export const fetchMetafileById = createAsyncThunk<Metafile | undefined, UUID, AppThunkAPI>(
    'metafiles/fetchById',
    async (id, thunkAPI) => {
        return thunkAPI.getState().metafiles.entities[id];
    }
);

export const fetchMetafilesByFilepath = createAsyncThunk<FilebasedMetafile[], PathLike, AppThunkAPI>(
    'metafiles/fetchByPath',
    async (metafileFilepath, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(isFilebasedMetafile)
            .filter(metafile => relative(metafile.path.toString(), metafileFilepath.toString()).length === 0);
    }
);

export const fetchMetafilesByRepo = createAsyncThunk<Metafile[], UUID, AppThunkAPI>(
    'metafiles/fetchByRepo',
    async (repoId, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(metafile => metafile.repo === repoId);
    }
);

export const fetchMetafilesByBranch = createAsyncThunk<Metafile[], string, AppThunkAPI>(
    'metafiles/fetchByBranch',
    async (branch, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(metafile => metafile.branch === branch);
    }
);

export const fetchMetafilesByVirtual = createAsyncThunk<VirtualMetafile[], { name: string, handler: string }, AppThunkAPI>(
    'metafiles/fetchByVirtual',
    async (virtual, thunkAPI) => {
        return removeUndefined(Object.values(thunkAPI.getState().metafiles.entities))
            .filter(isVirtualMetafile)
            .filter(metafile => metafile.name === virtual.name && metafile.handler === virtual.handler);
    }
);

/** Transitive potential to trigger the metafilesSlice.extraReducers to update Redux state */
export const fetchMetafile = createAsyncThunk<Metafile, PathOrVirtual, AppThunkAPI>(
    'metafiles/fetchMetafile',
    async (input, thunkAPI) => {
        const existing = await (input.virtual ?
            thunkAPI.dispatch(fetchMetafilesByVirtual(input.virtual)) :
            thunkAPI.dispatch(fetchMetafilesByFilepath(input.filepath))).unwrap();
        return existing.length > 0 ? existing[0] : (await thunkAPI.dispatch(fetchNewMetafile(input)).unwrap());
    }
);

/** Triggers the metafilesSlice.extraReducers to update Redux state */
export const fetchNewMetafile = createAsyncThunk<Metafile, PathOrVirtual, AppThunkAPI>(
    'metafiles/fetchNew',
    async (input, thunkAPI) => {
        const filetype = await thunkAPI.dispatch(fetchFiletype(input)).unwrap();
        const contentOrContains = await (input.filepath && filetype.filetype === 'Directory' ?
            thunkAPI.dispatch(fetchContains(input.filepath)) :
            thunkAPI.dispatch(fetchContent(input))).unwrap();
        const filepath = removeUndefinedProperties({ path: input.filepath ? input.filepath : undefined });
        return {
            id: v4(),
            name: input.virtual ?
                input.virtual.name :
                extractFilename(input.filepath),
            modified: DateTime.local().valueOf(),
            ...filepath,
            ...filetype,
            ...contentOrContains
        };
    }
);

export const fetchParentMetafile = createAsyncThunk<DirectoryMetafile | undefined, FilebasedMetafile, AppThunkAPI>(
    'metafiles/fetchParent',
    async (metafile, thunkAPI) => {
        const metafiles = await thunkAPI.dispatch(fetchMetafilesByFilepath(dirname(metafile.path.toString()))).unwrap();
        return metafiles.length > 0 ? (metafiles[0] as DirectoryMetafile) : undefined;
    }
);

export const fetchContent = createAsyncThunk<Required<Pick<Metafile, 'content' | 'state'>>, PathOrVirtual>(
    'metafiles/fetchContent',
    async (input) => {
        return input.virtual ?
            { content: input.virtual.content ? input.virtual.content : '', state: input.virtual.state ? input.virtual.state : 'unmodified' } :
            { content: await readFileAsync(input.filepath, { encoding: 'utf-8' }), state: 'unmodified' };
    }
);

export const fetchContains = createAsyncThunk<Required<Pick<Metafile, 'contains' | 'state'>>, PathLike>(
    'metafiles/fetchContains',
    async (filepath) => {
        return { contains: (await readDirAsyncDepth(filepath, 1)).filter(p => p !== filepath), state: 'unmodified' };
    }
);

/** Transitive potential to trigger reposSlice.extraReducers to update Redux state */
export const fetchVersionControl = createAsyncThunk<Pick<Metafile, 'repo' | 'branch' | 'status'>, FilebasedMetafile, AppThunkAPI>(
    'metafiles/fetchVersionControl',
    async (metafile, thunkAPI) => {
        const root = await getRepoRoot(metafile.path); // linked worktrees dictate that root can be different from the repo.root
        const repo = await thunkAPI.dispatch(fetchRepo(metafile)).unwrap();
        const current = repo ? await currentBranch({ dir: root ? root : repo.root.toString(), fullname: false }) : undefined;
        const branch = (repo && !current) ? 'HEAD' : undefined;
        const status = repo ? await getStatus(metafile.path) : undefined;
        return removeUndefinedProperties({ repo: repo?.id, branch: branch, status: status });
    }
);

const fetchFiletype = createAsyncThunk<Partial<Pick<Filetype, 'handler' | 'filetype'>>, PathOrVirtual, AppThunkAPI>(
    'metafiles/fetchFiletype',
    async (input, thunkAPI) => {
        const stats = input.virtual ? { handler: input.virtual.handler, filetype: undefined } :
            await thunkAPI.dispatch(resolveHandler(input.filepath)).unwrap();
        return removeUndefinedProperties({ handler: stats?.handler, filetype: stats?.filetype });
    }
);

/** Triggers metafilesSlice.reducers to update Redux state */
export const revertStagedChanges = createAsyncThunk<void, FilebasedMetafile, AppThunkAPI>(
    'metafiles/revertStagedChanges',
    async (metafile, thunkAPI) => {
        switch (metafile.status) {
            case '*added': // Fallthrough
            case 'added': {
                // added file; removing file and refetch as virtual metafile
                remove(metafile.path.toString(), (error) => thunkAPI.rejectWithValue(`${error.name}: ${error.message}`));
                const status = await getStatus(metafile.path);
                thunkAPI.dispatch(metafilesSlice.actions.metafileUpdated({
                    ...metafile,
                    ...removeUndefinedProperties({ filetype: undefined, handler: metafile.handler, path: undefined, status: status })
                }));
                break;
            }
            case '*modified': // Fallthrough
            case 'modified': {
                // modified; overwrite metafile with original content from file (if changed)
                const updatedContent = await discardChanges(metafile.path);
                if (updatedContent) {
                    await writeFileAsync(metafile.path, updatedContent);
                    const status = await getStatus(metafile.path);
                    thunkAPI.dispatch(metafilesSlice.actions.metafileUpdated({
                        ...metafile,
                        content: updatedContent,
                        state: 'unmodified',
                        ...removeUndefinedProperties({ status: status })
                    }));
                }
                break;
            }
            case '*deleted': // Fallthrough
            case 'deleted': {
                // deleted; rewrite file content to discard changes
                const content = await discardChanges(metafile.path);
                if (content) {
                    await writeFileAsync(metafile.path, content);
                    const status = await getStatus(metafile.path);
                    thunkAPI.dispatch(metafilesSlice.actions.metafileUpdated({
                        ...metafile,
                        content: content,
                        state: 'unmodified',
                        ...removeUndefinedProperties({ status: status })
                    }));
                }
                break;
            }
        }
    }
);