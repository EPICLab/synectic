import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike, remove } from 'fs-extra';
import { DateTime } from 'luxon';
import { dirname, relative } from 'path';
import { v4 } from 'uuid';
import { flattenArray } from '../../containers/flatten';
import { ExactlyOne, isDefined, isUpdateable, removeDuplicates, removeUndefinedProperties } from '../../containers/utils';
import { discardChanges, getIgnore } from '../../containers/git-plumbing';
import { getStatus } from '../../containers/git-porcelain';
import { extractFilename, isEqualPaths, readDirAsyncDepth, readFileAsync, writeFileAsync } from '../../containers/io';
import { AppThunkAPI } from '../hooks';
import metafileSelectors from '../selectors/metafiles';
import { DirectoryMetafile, FilebasedMetafile, Metafile, MetafileTemplate, VersionedMetafile, metafileAdded, metafileUpdated, isFilebasedMetafile, isVersionedMetafile, isDirectoryMetafile, isFileMetafile } from '../slices/metafiles';
import { fetchBranch } from './branches';
import { fetchFiletype } from './filetypes';
import { fetchRepo } from './repos';
import { checkFilepath, Conflict } from '../../containers/merges';

export const isHydrated = (metafile: Metafile): boolean => {
    // if metafile is filebased, verify that DirectoryMetafile/FileMetafile fields are populated
    const filebasedHydrated = isFilebasedMetafile(metafile) ?
        (metafile.filetype === 'Directory' && isDirectoryMetafile(metafile)) ||
        (metafile.filetype !== 'Directory' && isFileMetafile(metafile)) : true;

    // if metafile is versioned, verify that VersionedMetafile fields are populated
    const versionedHydrated = isVersionedMetafile(metafile) ?
        (metafile as VersionedMetafile).branch !== undefined &&
        (metafile as VersionedMetafile).status !== undefined &&
        (metafile as VersionedMetafile).conflicts !== undefined : true;

    return filebasedHydrated && versionedHydrated;
}

export const fetchMetafile = createAsyncThunk<Metafile, PathLike, AppThunkAPI>(
    'metafiles/fetchMetafile',
    async (filepath, thunkAPI) => {
        const existing = metafileSelectors.selectByFilepath(thunkAPI.getState(), filepath);
        return (existing.length > 0) ? existing[0] as FilebasedMetafile : await thunkAPI.dispatch(createMetafile({ path: filepath })).unwrap();
    }
);

export const createMetafile = createAsyncThunk<Metafile, ExactlyOne<{ path: PathLike, metafile: MetafileTemplate }>, AppThunkAPI>(
    'metafiles/createMetafile',
    async (input, thunkAPI) => {
        const filetype = await thunkAPI.dispatch(fetchFiletype(input.path ? input.path : '')).unwrap();
        return thunkAPI.dispatch(metafileAdded({
            id: v4(),
            name: input.metafile ? input.metafile.name : extractFilename(input.path),
            modified: DateTime.local().valueOf(),
            handler: input.metafile ? input.metafile.handler : (filetype ? filetype.handler : 'Editor'),
            filetype: filetype ? filetype.filetype : 'Text',
            loading: input.metafile ? input.metafile.loading : [],
            ...(input.path ? { path: input.path } : {}),
            ...(input.path ? { state: 'unmodified' } : {}),
            ...(input.metafile ? input.metafile : {})
        })).payload;
    }
);

export const updateFilebasedMetafile = createAsyncThunk<FilebasedMetafile, FilebasedMetafile, AppThunkAPI>(
    'metafiles/updateFilebasedMetafile',
    async (metafile, thunkAPI) => {
        if (metafile.filetype === 'Directory') {
            const state = thunkAPI.getState();
            const ignore = await getIgnore(metafile.path, true); // TODO: Load this once instead of doing it for every file
            const paths = (await readDirAsyncDepth(metafile.path, 1))
                .filter(p => p !== metafile.path)
                .filter(p => !ignore.ignores(relative(metafile.path.toString(), p)));
            const contains = (await paths.reduce(async (accumulator: Promise<Metafile[]>, current) => {
                const metafiles = await accumulator;
                const existing = metafileSelectors.selectByFilepath(state, current);
                if (existing.length > 0) metafiles.push(...existing);
                else {
                    const metafile = await thunkAPI.dispatch(createMetafile({ path: current })).unwrap();
                    metafiles.push(metafile);
                }
                return metafiles;
            }, Promise.resolve([]))).map(metafile => metafile.id);
            return isUpdateable(metafile, { contains }) ? thunkAPI.dispatch(metafileUpdated({
                ...metafile,
                contains: contains,
                state: 'unmodified'
            })).payload as FilebasedMetafile : metafile;
        } else {
            const content = await readFileAsync(metafile.path, { encoding: 'utf-8' });
            return isUpdateable(metafile, { content }) ? thunkAPI.dispatch(metafileUpdated({
                ...metafile,
                content: content,
                state: 'unmodified'
            })).payload as FilebasedMetafile : metafile;
        }
    }
);

export const updatedVersionedMetafile = createAsyncThunk<VersionedMetafile | FilebasedMetafile, FilebasedMetafile, AppThunkAPI>(
    'metafiles/updateVersionedMetafile',
    async (metafile, thunkAPI) => {
        const repo = await thunkAPI.dispatch(fetchRepo({ metafile })).unwrap();
        const branch = await thunkAPI.dispatch(fetchBranch({ metafile })).unwrap();
        const status = await getStatus(metafile.path);
        const conflicted = await checkFilepath(metafile.path);

        return (isDefined(repo) && isDefined(branch) && isDefined(status)
            && isUpdateable<Metafile>(metafile, { repo: repo.id, branch: branch.id, status, conflicts: conflicted ? conflicted.conflicts : [] })) ?
            thunkAPI.dispatch(metafileUpdated({
                ...metafile,
                repo: repo.id,
                branch: branch.id,
                status: status,
                conflicts: conflicted ? conflicted.conflicts : []
            })).payload as VersionedMetafile : metafile;
    }
);

export const fetchParentMetafile = createAsyncThunk<DirectoryMetafile | undefined, FilebasedMetafile, AppThunkAPI>(
    'metafiles/fetchParent',
    async (metafile, thunkAPI) => {
        const metafiles = metafileSelectors.selectByFilepath(thunkAPI.getState(), dirname(metafile.path.toString()));
        return metafiles.length > 0 ? metafiles[0] as DirectoryMetafile : undefined;
    }
);

export const revertStagedChanges = createAsyncThunk<void, VersionedMetafile, AppThunkAPI>(
    'metafiles/revertStagedChanges',
    async (metafile, thunkAPI) => {
        switch (metafile.status) {
            case '*added': // Fallthrough
            case 'added': {
                // added file; removing file and refetch as virtual metafile
                remove(metafile.path.toString(), (error) => thunkAPI.rejectWithValue(`${error.name}: ${error.message}`));
                const status = await getStatus(metafile.path);
                thunkAPI.dispatch(metafileUpdated({
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
                    thunkAPI.dispatch(metafileUpdated({
                        ...metafile,
                        content: updatedContent,
                        state: 'unmodified',
                        ...removeUndefinedProperties({ status: status, conflicts: undefined })
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
                    thunkAPI.dispatch(metafileUpdated({
                        ...metafile,
                        content: content,
                        state: 'unmodified',
                        ...removeUndefinedProperties({ status: status, conflicts: undefined })
                    }));
                }
                break;
            }
        }
    }
);

export const updateConflicted = createAsyncThunk<Metafile[], Conflict[], AppThunkAPI>(
    'metafiles/fetchConflicted',
    async (conflicts, thunkAPI) => {
        const conflictedFiles = removeDuplicates(conflicts, (c1, c2) => isEqualPaths(c1.path, c2.path));
        return flattenArray(await Promise.all(conflictedFiles.map(async conflict => {
            const metafile = await thunkAPI.dispatch(fetchMetafile(conflict.path)).unwrap();
            return isFilebasedMetafile(metafile)
                ? await thunkAPI.dispatch(updatedVersionedMetafile(metafile)).unwrap()
                : metafile;
        })));
    }
);