import { PathLike } from 'fs-extra';
import { DateTime } from 'luxon';
import { dirname, join, relative } from 'path';
import { v4 } from 'uuid';
import { flattenArray } from '../../containers/flatten';
import { checkoutPathspec, checkUnmergedPath, Conflict, fileStatus, getIgnore, getRoot, worktreeStatus } from '../../containers/git';
import { extractFilename, extractStats, isEqualPaths, readDirAsyncDepth, readFileAsync } from '../../containers/io';
import { ExactlyOne, isDefined, hasUpdates, removeDuplicates, symmetrical } from '../../containers/utils';
import { createAppAsyncThunk } from '../hooks';
import branchSelectors from '../selectors/branches';
import metafileSelectors from '../selectors/metafiles';
import { DirectoryMetafile, FilebasedMetafile, FileMetafile, isDirectoryMetafile, isFilebasedMetafile, isVersionedMetafile, Metafile, metafileAdded, MetafileTemplate, metafileUpdated, VersionedMetafile } from '../slices/metafiles';
import { CardType, UUID } from '../types';
import { addBranch, fetchBranch } from './branches';
import { fetchFiletype } from './filetypes';
import { fetchRepo } from './repos';

/**
 * Equality function for selectors that rely on shallow metafile equality; i.e. should only force a re-render if the
 * metafile UUIDs have been updated.
 * 
 * @param prevMetafiles The previous array of Metafile objects.
 * @param nextMetafiles The possibly updated version of Metafile objects.
 * @returns {boolean} A boolean indicating true if the UUIDs of Metafile objects in both arrays match, and false otherwise.
 */
export const shallowMetafilesEqualityFn = (prevMetafiles: Metafile[], nextMetafiles: Metafile[]) => {
    const predicate = (oldMetafile: Metafile, newMetafile: Metafile) => oldMetafile.id === newMetafile.id;
    const [subarray1, , subarray2] = symmetrical(prevMetafiles, nextMetafiles, predicate);
    return subarray1.length === 0 && subarray2.length == 0;
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
export const hasFilebasedUpdates = async (metafile: FilebasedMetafile): Promise<number | undefined> => {
    const mtime = (await extractStats(metafile.path))?.mtime;
    if (!isDefined(mtime)) return undefined; // file does not exist in the filesystem
    const timestamp = DateTime.fromJSDate(mtime);

    if (!isDefined(metafile.mtime)) return timestamp.valueOf(); // metafile not previously identified as filebased
    const delta = timestamp.diff(DateTime.fromMillis(metafile.mtime)).valueOf();
    return delta > 0 ? timestamp.valueOf() : undefined; // only return timestamp if newer than previous timestamp
}

export const fetchMetafile = createAppAsyncThunk<Metafile, { path: PathLike, handlers?: CardType[] }>(
    'metafiles/fetchMetafile',
    async ({ path: filepath, handlers }, thunkAPI) => {
        const existing = handlers
            ? metafileSelectors.selectByFilepath(thunkAPI.getState(), filepath, handlers)
            : metafileSelectors.selectByFilepath(thunkAPI.getState(), filepath);
        return (existing.length > 0) ? existing[0] as FilebasedMetafile : await thunkAPI.dispatch(createMetafile({ path: filepath })).unwrap();
    }
);

export const createMetafile = createAppAsyncThunk<Metafile, ExactlyOne<{ path: PathLike, metafile: MetafileTemplate }>>(
    'metafiles/createMetafile',
    async (input, thunkAPI) => {
        const filetype = await thunkAPI.dispatch(fetchFiletype(input.path ?? '')).unwrap();
        return thunkAPI.dispatch(metafileAdded({
            id: v4(),
            name: input.metafile ? input.metafile.name : extractFilename(input.path),
            modified: DateTime.local().valueOf(),
            handler: input.metafile?.handler ?? filetype?.handler ?? 'Editor',
            filetype: filetype?.filetype ?? 'Text',
            flags: input.metafile?.flags ?? [],
            ...(input.path ? { path: input.path } : {}),
            ...(input.path ? { state: 'unmodified' } : {}),
            ...(input.metafile ?? {})
        })).payload;
    }
);

export const updateDirectoryMetafile = createAppAsyncThunk<DirectoryMetafile, FilebasedMetafile>(
    'metafiles/updateDirectoryMetafile',
    async (metafile, thunkAPI) => {
        const mtime = await hasFilebasedUpdates(metafile);
        if (!isDefined(mtime)) return metafile as DirectoryMetafile;
        const gitIgnore = await getIgnore(metafile.path, true);
        const descendants = (await readDirAsyncDepth(metafile.path, 1))
            .filter(p => p != metafile.path)
            .filter(p => !gitIgnore.ignores(relative(metafile.path.toString(), p)));
        const contains = (await descendants.reduce(async (accumulator: Promise<Metafile[]>, current) => {
            const metafiles = await accumulator;
            const existing = metafileSelectors.selectByFilepath(thunkAPI.getState(), current);
            if (existing.length > 0) metafiles.push(...existing);
            else {
                const metafile = await thunkAPI.dispatch(createMetafile({ path: current })).unwrap();
                metafiles.push(metafile);
            }
            return metafiles;
        }, Promise.resolve([]))).map(metafile => metafile.id);
        const updating = hasUpdates(metafile, { contains });
        return updating ? thunkAPI.dispatch(metafileUpdated({
            ...metafile,
            contains: contains,
            mtime: mtime,
            state: 'unmodified'
        })).payload as DirectoryMetafile : metafile as DirectoryMetafile;
    }
);

export const updateFileMetafile = createAppAsyncThunk<FileMetafile, FilebasedMetafile>(
    'metafiles/updateFileMetafile',
    async (metafile, thunkAPI) => {
        const mtime = await hasFilebasedUpdates(metafile);
        if (!isDefined(mtime)) return metafile as FileMetafile;
        const content = await readFileAsync(metafile.path, { encoding: 'utf-8' });
        const updating = hasUpdates(metafile, { content });
        return updating ? thunkAPI.dispatch(metafileUpdated({
            ...metafile,
            content: content,
            mtime: mtime,
            state: 'unmodified'
        })).payload as FileMetafile : metafile as FileMetafile;
    }
);

export const updateFilebasedMetafile = createAppAsyncThunk<DirectoryMetafile | FileMetafile, FilebasedMetafile>(
    'metafiles/updateFilebasedMetafile',
    async (metafile, thunkAPI) => {
        return metafile.filetype === 'Directory' ?
            await thunkAPI.dispatch(updateDirectoryMetafile(metafile)).unwrap() :
            await thunkAPI.dispatch(updateFileMetafile(metafile)).unwrap();
    }
);

export const updateVersionedMetafile = createAppAsyncThunk<VersionedMetafile | FilebasedMetafile, FilebasedMetafile>(
    'metafiles/updateVersionedMetafile',
    async (metafile, thunkAPI) => {
        const repo = await thunkAPI.dispatch(fetchRepo({ metafile })).unwrap();
        const branch = await thunkAPI.dispatch(fetchBranch({ metafile })).unwrap();
        console.log(`updateVersionedMetafile => ${metafile.id}::${metafile.name}, repo: ${repo?.id}, branch: ${branch?.id}`);
        if (!isDefined(repo) || !isDefined(branch)) return metafile; // not under version control

        if (isDirectoryMetafile(metafile)) {
            const root = await getRoot(metafile.path);
            const descendants = root ? metafileSelectors.selectByRoot(thunkAPI.getState(), root) : [];
            const statuses = root ? (await worktreeStatus({ dir: root, pathspec: metafile.path }))?.entries : undefined;

            if (isDefined(statuses)) {
                const [newEntries, updatedMetafiles, unmodifiedMetafiles] = symmetrical(statuses, descendants,
                    (status, descendant) => isEqualPaths(status.path, descendant.path)
                );

                // update all matching metafiles with their complementary status
                updatedMetafiles.map(([status, metafile]) => thunkAPI.dispatch(metafileUpdated({
                    ...metafile,
                    repo: repo.id,
                    branch: branch.id,
                    status: status.status
                })));

                // descendants without a matching status update have not been modified, so update to `unmodified` status
                unmodifiedMetafiles.map(metafile => thunkAPI.dispatch(metafileUpdated({ ...metafile, status: 'unmodified' })));

                // status entries without a matching metafile in the Redux store need to be created
                await Promise.all(newEntries.map(async file => {
                    const metafile = await thunkAPI.dispatch(fetchMetafile({ path: file.path })).unwrap();
                    thunkAPI.dispatch(metafileUpdated({
                        ...metafile,
                        repo: repo.id,
                        branch: branch.id,
                        status: file.status
                    }));
                }));
            }
        }
        const status: Awaited<ReturnType<typeof fileStatus>> = await fileStatus(metafile.path);
        const conflicted: Awaited<ReturnType<typeof checkUnmergedPath>> = [];// await checkUnmergedPath(metafile.path);
        const typedConflicts = isDirectoryMetafile(metafile) ? conflicted.map(c => c.path) : conflicted[0]?.conflicts ?? [];

        return (isDefined(status) && hasUpdates<Metafile>(metafile, { repo: repo.id, branch: branch.id, status, conflicts: typedConflicts })) ?
            thunkAPI.dispatch(metafileUpdated({
                ...metafile,
                repo: repo.id,
                branch: branch.id,
                status: status,
                conflicts: typedConflicts,
            })).payload as VersionedMetafile : metafile;
    }
);

export const fetchParentMetafile = createAppAsyncThunk<DirectoryMetafile | undefined, FilebasedMetafile>(
    'metafiles/fetchParent',
    async (metafile, thunkAPI) => {
        const metafiles: ReturnType<typeof metafileSelectors.selectByFilepath> = metafileSelectors.selectByFilepath(thunkAPI.getState(), dirname(metafile.path.toString()));
        return metafiles.length > 0 ? metafiles[0] as DirectoryMetafile : undefined;
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
 * @returns {Metafile | undefined} A new Metafile object pointing to the same file as the metafile referenced in the parameters except
 * rooted in the new worktree, or undefined if a linked worktred could not be created.
 */
export const switchBranch = createAppAsyncThunk<Metafile | undefined, { metafileId: UUID, ref: string, root: PathLike }>(
    'metafiles/switchBranch',
    async ({ metafileId, ref, root }, thunkAPI) => {
        const state = thunkAPI.getState();

        const metafile = metafileSelectors.selectById(state, metafileId);
        if (!metafile || !isFilebasedMetafile(metafile) || !isVersionedMetafile(metafile)) return undefined;
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

export const revertChanges = createAppAsyncThunk<void, VersionedMetafile>(
    'metafiles/revertUnmergedChanges',
    async (metafile, thunkAPI) => {
        const branch = await thunkAPI.dispatch(fetchBranch({ metafile })).unwrap();

        if (metafile.status !== 'unmodified' && branch) {
            await checkoutPathspec({ dir: branch.root, pathspec: metafile.path.toString(), ours: true });
            const updated = await thunkAPI.dispatch(updateFilebasedMetafile(metafile)).unwrap();
            await thunkAPI.dispatch(updateVersionedMetafile(updated)).unwrap();
        }
    }
)

export const updateConflicted = createAppAsyncThunk<Metafile[], Conflict[]>(
    'metafiles/fetchConflicted',
    async (conflicts, thunkAPI) => {
        const conflictedFiles = removeDuplicates(conflicts, (c1, c2) => isEqualPaths(c1.path, c2.path));
        return flattenArray(await Promise.all(conflictedFiles.map(async conflict => {
            const metafile = await thunkAPI.dispatch(fetchMetafile({ path: conflict.path, handlers: ['Editor', 'Explorer'] })).unwrap();
            return isFilebasedMetafile(metafile)
                ? await thunkAPI.dispatch(updateVersionedMetafile(metafile)).unwrap()
                : metafile;
        })));
    }
);