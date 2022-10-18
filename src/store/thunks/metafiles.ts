import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike, remove } from 'fs-extra';
import { DateTime } from 'luxon';
import { dirname, join, relative } from 'path';
import { v4 } from 'uuid';
import { flattenArray } from '../../containers/flatten';
import { checkoutPathspec, checkUnmergedPath, Conflict, fileStatus, getIgnore, getRoot, restore, worktreeStatus } from '../../containers/git';
import { extractFilename, isEqualPaths, readDirAsyncDepth, readFileAsync, writeFileAsync } from '../../containers/io';
import { ExactlyOne, isDefined, isUpdateable, removeDuplicates, removeUndefinedProperties } from '../../containers/utils';
import { AppThunkAPI } from '../hooks';
import branchSelectors from '../selectors/branches';
import metafileSelectors from '../selectors/metafiles';
import * as metafilesSlice from '../slices/metafiles';
import { CardType, UUID } from '../types';
import { addBranch, fetchBranch } from './branches';
import { fetchFiletype } from './filetypes';
import { fetchRepo } from './repos';

export const isHydrated = (metafile: metafilesSlice.Metafile): boolean => {
    // if metafile is filebased, verify that DirectoryMetafile/FileMetafile fields are populated
    const filebasedHydrated = metafilesSlice.isFilebasedMetafile(metafile) ?
        (metafile.filetype === 'Directory' && metafilesSlice.isDirectoryMetafile(metafile)) ||
        (metafile.filetype !== 'Directory' && metafilesSlice.isFileMetafile(metafile)) : true;

    // if metafile is versioned, verify that VersionedMetafile fields are populated
    const versionedHydrated = metafilesSlice.isVersionedMetafile(metafile) ?
        (metafile as metafilesSlice.VersionedMetafile).branch !== undefined &&
        (metafile as metafilesSlice.VersionedMetafile).status !== undefined &&
        (metafile as metafilesSlice.VersionedMetafile).conflicts !== undefined : true;

    return filebasedHydrated && versionedHydrated;
}

export const fetchMetafile = createAsyncThunk<metafilesSlice.Metafile, { path: PathLike, handlers?: CardType[] }, AppThunkAPI>(
    'metafiles/fetchMetafile',
    async ({ path: filepath, handlers }, thunkAPI) => {
        const existing = handlers
            ? metafileSelectors.selectByFilepath(thunkAPI.getState(), filepath, handlers)
            : metafileSelectors.selectByFilepath(thunkAPI.getState(), filepath);
        return (existing.length > 0) ? existing[0] as metafilesSlice.FilebasedMetafile : await thunkAPI.dispatch(createMetafile({ path: filepath })).unwrap();
    }
);

export const createMetafile = createAsyncThunk<metafilesSlice.Metafile, ExactlyOne<{ path: PathLike, metafile: metafilesSlice.MetafileTemplate }>, AppThunkAPI>(
    'metafiles/createMetafile',
    async (input, thunkAPI) => {
        const filetype = await thunkAPI.dispatch(fetchFiletype(input.path ? input.path : '')).unwrap();
        return thunkAPI.dispatch(metafilesSlice.metafileAdded({
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

export const updateFilebasedMetafile = createAsyncThunk<metafilesSlice.FilebasedMetafile, metafilesSlice.FilebasedMetafile, AppThunkAPI>(
    'metafiles/updateFilebasedMetafile',
    async (metafile, thunkAPI) => {
        if (metafile.filetype === 'Directory') {
            const state = thunkAPI.getState();
            const ignore = await getIgnore(metafile.path, true); // TODO: Load this once instead of doing it for every file
            const paths: string[] = (await readDirAsyncDepth(metafile.path, 1))
                .filter(p => p !== metafile.path)
                .filter(p => !ignore.ignores(relative(metafile.path.toString(), p)));
            const contains = (await paths.reduce(async (accumulator: Promise<metafilesSlice.Metafile[]>, current) => {
                const metafiles = await accumulator;
                const existing = metafileSelectors.selectByFilepath(state, current);
                if (existing.length > 0) metafiles.push(...existing);
                else {
                    const metafile = await thunkAPI.dispatch(createMetafile({ path: current })).unwrap();
                    metafiles.push(metafile);
                }
                return metafiles;
            }, Promise.resolve([]))).map(metafile => metafile.id);
            return isUpdateable(metafile, { contains }) ? thunkAPI.dispatch(metafilesSlice.metafileUpdated({
                ...metafile,
                contains: contains,
                state: 'unmodified'
            })).payload as metafilesSlice.FilebasedMetafile : metafile;
        } else {
            const content = await readFileAsync(metafile.path, { encoding: 'utf-8' });
            return isUpdateable(metafile, { content }) ? thunkAPI.dispatch(metafilesSlice.metafileUpdated({
                ...metafile,
                content: content,
                state: 'unmodified'
            })).payload as metafilesSlice.FilebasedMetafile : metafile;
        }
    }
);

export const updateVersionedMetafile = createAsyncThunk<metafilesSlice.VersionedMetafile | metafilesSlice.FilebasedMetafile, metafilesSlice.FilebasedMetafile, AppThunkAPI>(
    'metafiles/updateVersionedMetafile',
    async (metafile, thunkAPI) => {
        const repo = await thunkAPI.dispatch(fetchRepo({ metafile })).unwrap();
        const branch = await thunkAPI.dispatch(fetchBranch({ metafile })).unwrap();
        const isDir: boolean = metafile.filetype === 'Directory';
        const conflicted: Awaited<ReturnType<typeof checkUnmergedPath>> = await checkUnmergedPath(metafile.path);
        const typedConflicts = isDir ? conflicted.map(c => c.path) : conflicted[0] ? conflicted[0].conflicts : [];

        if (isDir) {
            const root = await getRoot(metafile.path);
            const statuses = root ? (await worktreeStatus({ dir: root, pathspec: metafile.path }))?.entries : undefined;
            if (statuses && isDefined(repo) && isDefined(branch)) {
                await Promise.all(statuses.map(async entry => {
                    const metafile = await thunkAPI.dispatch(fetchMetafile({ path: entry.path })).unwrap();
                    thunkAPI.dispatch(metafilesSlice.metafileUpdated({
                        ...metafile,
                        repo: repo.id,
                        branch: branch.id,
                        status: entry.status
                    })).payload;
                }));
            }
            await Promise.all(conflicted.map(async conflict => {
                const conflictedMetafile = await thunkAPI.dispatch(fetchMetafile({ path: conflict.path })).unwrap();
                thunkAPI.dispatch(metafilesSlice.metafileUpdated({
                    ...conflictedMetafile,
                    status: 'unmerged',
                    conflicts: conflict.conflicts
                }));
            }));
        }
        const status: Awaited<ReturnType<typeof fileStatus>> = await fileStatus(metafile.path);

        return (isDefined(repo) && isDefined(branch) && isDefined(status)
            && isUpdateable<metafilesSlice.Metafile>(metafile, { repo: repo.id, branch: branch.id, status, conflicts: typedConflicts })) ?
            thunkAPI.dispatch(metafilesSlice.metafileUpdated({
                ...metafile,
                repo: repo.id,
                branch: branch.id,
                status: status,
                conflicts: typedConflicts,
            })).payload as metafilesSlice.VersionedMetafile : metafile;
    }
);

export const fetchParentMetafile = createAsyncThunk<metafilesSlice.DirectoryMetafile | undefined, metafilesSlice.FilebasedMetafile, AppThunkAPI>(
    'metafiles/fetchParent',
    async (metafile, thunkAPI) => {
        const metafiles = metafileSelectors.selectByFilepath(thunkAPI.getState(), dirname(metafile.path.toString()));
        return metafiles.length > 0 ? metafiles[0] as metafilesSlice.DirectoryMetafile : undefined;
    }
);

/**
 * Switch branches or restore working tree files in the filesystem and return an updated Metafile object. This will create
 * a new linked worktree (if not already present) based on the HEAD of the branch reference provided. This thunk also creates
 * a new Metafile object pointing to the same file in the new branch.
 * 
 * @param obj - A destructured object for named parameters.
 * @param obj.metafileId - The UUID of a Metafile that should be reparented to a new linked worktree (branch and root path).
 * @param obj.ref - The name of the branch to check out and switch to.
 * @param obj.root - The relative or absolute path to a root directory (i.e. the `dir` or `worktreeDir` in the `WorktreePaths` type).
 * @returns {metafilesSlice.Metafile | undefined} A new Metafile object pointing to the same file as the metafile referenced in the parameters except
 * rooted in the new worktree, or undefined if a linked worktred could not be created.
 */
export const switchBranch = createAsyncThunk<metafilesSlice.Metafile | undefined, { metafileId: UUID, ref: string, root: PathLike }, AppThunkAPI>(
    'metafiles/switchBranch',
    async ({ metafileId, ref, root }, thunkAPI) => {
        const state = thunkAPI.getState();

        const metafile = metafileSelectors.selectById(state, metafileId);
        if (!metafile || !metafilesSlice.isFilebasedMetafile(metafile) || !metafilesSlice.isVersionedMetafile(metafile)) return undefined;
        const currentBranch = branchSelectors.selectById(state, metafile.branch);
        if (!currentBranch) return undefined;

        const branch = await thunkAPI.dispatch(addBranch({ ref: ref, root: root })).unwrap();
        if (branch) {
            const relativePath = relative(currentBranch.root.toString(), metafile.path.toString()); // relative path from root to file
            const absolutePath = join(branch.root.toString(), relativePath); // absolute path from new linked worktree root to file
            return await thunkAPI.dispatch(fetchMetafile({ path: absolutePath })).unwrap();
        }
        return undefined;
    }
);

export const revertUnmergedChanges = createAsyncThunk<void, metafilesSlice.VersionedMetafile, AppThunkAPI>(
    'metafiles/revertUnmergedChanges',
    async (metafile, thunkAPI) => {
        const branch = await thunkAPI.dispatch(fetchBranch({ metafile })).unwrap();

        if (metafile.status === 'unmerged' && branch) {
            await checkoutPathspec({ dir: branch.root, pathspec: metafile.path.toString(), ours: true });
            let updated = await thunkAPI.dispatch(updateFilebasedMetafile(metafile)).unwrap();
            updated = await thunkAPI.dispatch(updateVersionedMetafile(updated)).unwrap();
            console.log(updated);
        }
    }
)

export const revertStagedChanges = createAsyncThunk<void, metafilesSlice.VersionedMetafile, AppThunkAPI>(
    'metafiles/revertStagedChanges',
    async (metafile, thunkAPI) => {
        switch (metafile.status) {
            case '*added': // Fallthrough
            case 'added': {
                // added file; removing file and refetch as virtual metafile
                remove(metafile.path.toString(), (error) => thunkAPI.rejectWithValue(`${error.name}: ${error.message}`));
                const status = await fileStatus(metafile.path);
                thunkAPI.dispatch(metafilesSlice.metafileUpdated({
                    ...metafile,
                    ...removeUndefinedProperties({ filetype: undefined, handler: metafile.handler, path: undefined, status: status })
                }));
                break;
            }
            case '*modified': // Fallthrough
            case 'modified': {
                // modified; overwrite metafile with original content from file (if changed)
                const restored = await restore({ filepath: metafile.path });
                const updatedContent = restored ? await readFileAsync(metafile.path, { encoding: 'utf-8' }) : undefined;
                if (updatedContent) {
                    const status = await fileStatus(metafile.path);
                    thunkAPI.dispatch(metafilesSlice.metafileUpdated({
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
                const restored = await restore({ filepath: metafile.path });
                const content = restored ? await readFileAsync(metafile.path, { encoding: 'utf-8' }) : undefined;
                if (content) {
                    await writeFileAsync(metafile.path, content);
                    const status = await fileStatus(metafile.path);
                    thunkAPI.dispatch(metafilesSlice.metafileUpdated({
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

export const updateConflicted = createAsyncThunk<metafilesSlice.Metafile[], Conflict[], AppThunkAPI>(
    'metafiles/fetchConflicted',
    async (conflicts, thunkAPI) => {
        const conflictedFiles = removeDuplicates(conflicts, (c1, c2) => isEqualPaths(c1.path, c2.path));
        return flattenArray(await Promise.all(conflictedFiles.map(async conflict => {
            const metafile = await thunkAPI.dispatch(fetchMetafile({ path: conflict.path, handlers: ['Editor', 'Explorer'] })).unwrap();
            return metafilesSlice.isFilebasedMetafile(metafile)
                ? await thunkAPI.dispatch(updateVersionedMetafile(metafile)).unwrap()
                : metafile;
        })));
    }
);