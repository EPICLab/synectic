import {DateTime} from 'luxon';
import {createAppAsyncThunk} from '../hooks';
import branchSelectors from '../selectors/branches';
import metafileSelectors from '../selectors/metafiles';
import {
  hasFilebasedUpdates,
  isDirectoryMetafile,
  isFileMetafile,
  isFilebasedMetafile,
  isVersionedMetafile,
  isVirtualMetafile,
  metafileAdded,
  metafileRemoved,
  metafileUpdated,
} from '../slices/metafiles';
import {addBranch, fetchBranch, updateBranch} from './branches';
import {fetchFiletype} from './filetypes';
import {fetchRepo} from './repos';
import type {
  DirectoryMetafile,
  FileMetafile,
  FilebasedMetafile,
  Metafile,
  MetafileTemplate,
  VersionedMetafile,
} from '@syn-types/metafile';
import type {CardType, FilesystemStatus, PathLike, UUID} from '@syn-types/app';
import type {ExactlyOne} from '@syn-types/util';
import {
  add,
  checkUnmergedPath,
  checkoutPathspec,
  dirname,
  extractFilename,
  fileStatus,
  getDescendantPaths,
  getMatchUp,
  getRoot,
  getWorktreePaths,
  hasUpdates,
  isDefined,
  isEqualPaths,
  isStaged,
  join,
  readFileAsync,
  relative,
  removeDuplicates,
  restore,
  symmetrical,
  uuid,
  worktreeStatus,
  writeFileAsync,
  unlink,
} from '#preload';

/**
 * Fetch a {@link Metafile} object from the Redux store. This function does not create a new
 * object within the filesystem, but checks for an existing `Metafile` based on matching the `path`
 * and `handlers` parameters, and adds a new {@link Metafile} object if no matches were found.
 * Use {@linkcode metafileSelectors} if attempting to locate a {@link VirtualMetafile}, or directly
 * call {@linkcode createMetafile} to create one.
 * @param obj - A destructed object for named parameters.
 * @param obj.path - A relative or absolute file path to the requested filesystem object.
 * @param obj.metafile - Fetch based on {@link FilebasedMetafile} fields.
 * @returns {Metafile} A new {@link Metafile} object representing the basic information of the
 * indicated filesystem object; {@linkcode updateFilebasedMetafile} and
 * {@linkcode updateVersionedMetafile} should be called to add/update filebased and versioned
 * fields within the `Metafile` object.
 */
export const fetchMetafile = createAppAsyncThunk<Metafile, {path: PathLike; handlers?: CardType[]}>(
  'metafiles/fetchMetafile',
  async ({path: filepath, handlers}, thunkAPI) => {
    const existing = metafileSelectors.selectByFilepath(thunkAPI.getState(), filepath, handlers);
    return existing.length > 0
      ? (existing[0] as FilebasedMetafile)
      : await thunkAPI.dispatch(createMetafile({path: filepath})).unwrap();
  },
);

export const fetchParentMetafile = createAppAsyncThunk<
  DirectoryMetafile | undefined,
  FilebasedMetafile
>('metafiles/fetchParent', async (metafile, thunkAPI) => {
  const metafiles: ReturnType<typeof metafileSelectors.selectByFilepath> =
    metafileSelectors.selectByFilepath(thunkAPI.getState(), dirname(metafile.path.toString()));
  return metafiles.length > 0 ? (metafiles[0] as DirectoryMetafile) : undefined;
});

export const createMetafile = createAppAsyncThunk<
  Metafile,
  ExactlyOne<{path: PathLike; metafile: MetafileTemplate}>
>('metafiles/createMetafile', async (input, thunkAPI) => {
  const filetype = await thunkAPI.dispatch(fetchFiletype(input.path ?? '')).unwrap();
  return thunkAPI.dispatch(
    metafileAdded({
      ...(input.metafile ?? {}),
      id: uuid(),
      name: input.metafile ? input.metafile.name : input.path ? extractFilename(input.path) : '',
      modified: input.metafile?.modified ?? DateTime.local().valueOf(),
      handler: input.metafile?.handler ?? filetype?.handler ?? 'Editor',
      filetype: input.metafile?.filetype ?? filetype?.filetype ?? 'Text',
      flags: input.metafile?.flags ?? [],
      ...(input.path ? {path: input.path, state: 'unmodified' satisfies FilesystemStatus} : {}),
    }),
  ).payload;
});

export const updateDirectoryMetafile = createAppAsyncThunk<
  DirectoryMetafile | undefined,
  {id: UUID; shallow?: boolean}
>('metafiles/updateDirectoryMetafile', async ({id, shallow = false}, thunkAPI) => {
  const metafile = thunkAPI.getState().metafiles.entities[id];
  if (!isDefined(metafile) || !isFilebasedMetafile(metafile)) return undefined;

  const mtime = shallow ? 0 : await hasFilebasedUpdates(metafile);
  if (!isDefined(mtime)) return metafile as DirectoryMetafile;

  const contains: UUID[] = [];
  if (!shallow) {
    const descendants = await getDescendantPaths(metafile.path);
    await Promise.all(
      descendants.map(async desc => {
        const existing = metafileSelectors.selectByFilepath(thunkAPI.getState(), desc);
        if (existing.length > 0) {
          existing.map(metafile => contains.push(metafile.id));
        } else {
          const dirMetafile = await thunkAPI.dispatch(createMetafile({path: desc})).unwrap();
          contains.push(dirMetafile.id);
        }
      }),
    );
  }
  const updating = hasUpdates(metafile, {contains});

  return updating
    ? (thunkAPI.dispatch(
        metafileUpdated({
          ...metafile,
          contains: contains,
          mtime: mtime,
          state: 'unmodified',
        }),
      ).payload as DirectoryMetafile)
    : (metafile as DirectoryMetafile);
});

export const updateFileMetafile = createAppAsyncThunk<FileMetafile | undefined, UUID>(
  'metafiles/updateFileMetafile',
  async (id, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles.entities[id];
    if (!isDefined(metafile) || !isFilebasedMetafile(metafile)) return undefined;

    const mtime = await hasFilebasedUpdates(metafile);
    if (!isDefined(mtime)) return metafile as FileMetafile;
    const content = (await readFileAsync(metafile.path, {encoding: 'utf-8'})).toString();

    return hasUpdates(metafile, {content})
      ? (thunkAPI.dispatch(
          metafileUpdated({
            ...metafile,
            content: content,
            mtime: mtime,
            state: 'unmodified',
          }),
        ).payload as FileMetafile)
      : (metafile as FileMetafile);
  },
);

export const updateFilebasedMetafile = createAppAsyncThunk<
  DirectoryMetafile | FileMetafile | undefined,
  FilebasedMetafile
>('metafiles/updateFilebasedMetafile', async (metafile, thunkAPI) => {
  return metafile.filetype === 'Directory'
    ? await thunkAPI.dispatch(updateDirectoryMetafile({id: metafile.id})).unwrap()
    : await thunkAPI.dispatch(updateFileMetafile(metafile.id)).unwrap();
});

export const updateVersionedMetafile = createAppAsyncThunk<
  VersionedMetafile | FilebasedMetafile | undefined,
  UUID
>('metafiles/updateVersionedMetafile', async (id, thunkAPI) => {
  const metafile = thunkAPI.getState().metafiles.entities[id];
  if (!isDefined(metafile) || !isFilebasedMetafile(metafile)) return undefined;

  const repo = await thunkAPI.dispatch(fetchRepo({metafile})).unwrap();
  const branch = await thunkAPI.dispatch(fetchBranch({metafile})).unwrap();
  if (!isDefined(repo) || !isDefined(branch)) return metafile; // not under version control

  if (isDirectoryMetafile(metafile)) {
    const root = await getRoot(metafile.path);
    const descendants = root
      ? metafileSelectors.selectByRoot(thunkAPI.getState(), root.toString())
      : [];
    const statuses = root
      ? (await worktreeStatus({dir: root.toString(), pathspec: metafile.path}))?.entries
      : undefined;

    if (isDefined(statuses)) {
      const [newEntries, updatedMetafiles, unmatchedMetafiles] = symmetrical(
        statuses,
        descendants,
        (status, descendant) => isEqualPaths(status.path, descendant.path),
      );

      // update all matching metafiles with their current status
      removeDuplicates(updatedMetafiles, (a, b) => a[1].id === b[1].id).map(
        ([status, metafile]) => {
          if (metafile.status !== status.status) {
            thunkAPI.dispatch(
              metafileUpdated({
                ...metafile,
                repo: repo.id,
                branch: branch.id,
                status: status.status,
              }),
            );
          }
        },
      );

      // descendants without a matching status update need to find any ascendant status updates,
      // or update to `unmodified` status
      await Promise.all(
        unmatchedMetafiles.map(async metafile => {
          const matcher = (directory: string): boolean => {
            const match = statuses.find(status => isEqualPaths(status.path, directory));
            return isDefined(match);
          };

          const match = await getMatchUp(metafile.path, matcher);
          const parentStatus = match
            ? statuses.find(status => isEqualPaths(status.path, match))
            : undefined;

          if (
            (parentStatus && metafile.status !== parentStatus.status) ||
            (!parentStatus && metafile.status !== 'unmodified')
          ) {
            thunkAPI.dispatch(
              metafileUpdated({
                ...metafile,
                repo: repo.id,
                branch: branch.id,
                status: parentStatus?.status ?? 'unmodified',
              }),
            );
          }
        }),
      );

      // status entries without a matching metafile in the Redux store need to be created
      await Promise.all(
        newEntries.map(async file => {
          const metafile = await thunkAPI.dispatch(fetchMetafile({path: file.path})).unwrap();
          thunkAPI.dispatch(
            metafileUpdated({
              ...metafile,
              repo: repo.id,
              branch: branch.id,
              status: file.status,
            }),
          );
        }),
      );
    }
  }

  const status = await fileStatus(metafile.path);
  const conflicted = await checkUnmergedPath(metafile.path);
  const typedConflicts = isDirectoryMetafile(metafile)
    ? conflicted.map(c => c.path)
    : conflicted[0]?.conflicts ?? [];

  return isDefined(status) &&
    hasUpdates<Metafile>(metafile, {
      repo: repo.id,
      branch: branch.id,
      status,
      conflicts: typedConflicts,
    })
    ? (thunkAPI.dispatch(
        metafileUpdated({
          ...metafile,
          repo: repo.id,
          branch: branch.id,
          status: status,
          conflicts: typedConflicts,
        }),
      ).payload as VersionedMetafile)
    : metafile;
});

/**
 * Write content updates to files in the filesystem and update Metafile object with content and
 * version information.
 * @param obj - A destructured object for named parameters.
 * @param obj.id - The UUID of a {@link Metafile} object that should have either `content` (for
 * {@link FileMetafile}) or `contains` (for {@link DirectoryMetafile}) written to the filesystem
 * at the `path` location.
 * @param obj.filepath - The relative or absolute file path to use, regardless of whether the
 * metafile contains a valid `path` field.
 * @returns {boolean} A boolean indicating true if the filesystem and metafile were successfully
 * updated, false otherwise.
 */
export const saveFile = createAppAsyncThunk<boolean, {id: UUID; filepath?: string}>(
  'metafiles/saveFile',
  async ({id, filepath}, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles.entities[id];
    const targetPath = filepath ?? metafile?.path;

    if (
      (isFileMetafile(metafile) || isVirtualMetafile(metafile)) &&
      metafile.content &&
      targetPath
    ) {
      // update metafile
      const updated = thunkAPI.dispatch(
        metafileUpdated({...metafile, path: targetPath, state: 'unmodified'}),
      ).payload;
      // write file
      await writeFileAsync(targetPath, metafile.content);
      // update parent metafile
      const parent = await thunkAPI
        .dispatch(fetchParentMetafile(updated as FilebasedMetafile))
        .unwrap();
      if (parent) thunkAPI.dispatch(updateDirectoryMetafile(parent));
      // // update git info
      await Promise.all(
        metafileSelectors
          .selectByFilepath(thunkAPI.getState(), targetPath)
          .filter(isFilebasedMetafile)
          .map(async m => await thunkAPI.dispatch(updateVersionedMetafile(m.id))),
      );
      return true;
    }
    return false;
  },
);

/**
 * Delete file from the filesystem and remove Metafile object from the store.
 * @param obj - A destructured object for named parameters.
 * @param obj.id - The UUID of a {@link Metafile} object that should be deleted.
 * @returns {boolean} A boolean indicating true if the filesystem and metafile were successfully
 * deleted, false otherwise.
 */
export const deleteFile = createAppAsyncThunk<boolean, UUID>(
  'metafiles/deleteFile',
  async (id, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles.entities[id];

    if (isFilebasedMetafile(metafile)) {
      // delete file
      await unlink(metafile.path);
      // remove metafile
      thunkAPI.dispatch(metafileRemoved(metafile.id));
      // update parent metafile
      const parent = await thunkAPI.dispatch(fetchParentMetafile(metafile)).unwrap();
      if (parent) thunkAPI.dispatch(updateDirectoryMetafile(parent));
      return true;
    }
    return false;
  },
);

export const stageMetafile = createAppAsyncThunk<void, UUID>(
  'metafiles/stageMetafile',
  async (id, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles.entities[id];

    if (isVersionedMetafile(metafile) && !isStaged(metafile.status)) {
      await add(metafile.path);
      const parent = await thunkAPI.dispatch(fetchParentMetafile(metafile)).unwrap();
      if (parent) await thunkAPI.dispatch(updateVersionedMetafile(parent.id));
      else await thunkAPI.dispatch(updateVersionedMetafile(metafile.id));
      await thunkAPI.dispatch(updateBranch(metafile.branch));
    }
  },
);

export const unstageMetafile = createAppAsyncThunk<void, UUID>(
  'metafiles/unstageMetafile',
  async (id, thunkAPI) => {
    const metafile = thunkAPI.getState().metafiles.entities[id];

    if (isVersionedMetafile(metafile) && isStaged(metafile.status)) {
      await restore({filepath: metafile.path, staged: true});
      const parent = await thunkAPI.dispatch(fetchParentMetafile(metafile)).unwrap();
      if (parent) await thunkAPI.dispatch(updateVersionedMetafile(parent.id));
      else await thunkAPI.dispatch(updateVersionedMetafile(metafile.id));
      await thunkAPI.dispatch(updateBranch(metafile.branch));
    }
  },
);

/**
 * Switch branches or restore working tree files in the filesystem and return an updated Metafile
 * object. This will create a new linked worktree (if not already present) based on the HEAD of
 * the branch reference provided. This thunk also creates a new Metafile object pointing to the
 * same file in the new branch.
 * @param obj - A destructured object for named parameters.
 * @param obj.id - The UUID of a {@link Metafile} object that should be reparented to a new linked
 * worktree (branch and root path).
 * @param obj.ref - The name of the branch to check out and switch to.
 * @returns {Metafile | undefined} A new {@link Metafile} object pointing to the same file as the
 * metafile parameter except rooted in the new worktree, or undefined if a linked worktree could
 * not be created.
 */
export const switchBranch = createAppAsyncThunk<Metafile | undefined, {id: UUID; ref: string}>(
  'metafiles/switchBranch',
  async ({id, ref}, thunkAPI) => {
    const metafile = metafileSelectors.selectById(thunkAPI.getState(), id);
    const {dir} = await getWorktreePaths(metafile?.path ?? '');
    if (!dir) return undefined; // unless metafile has a root path, there is no repository

    const branchA = branchSelectors.selectById(thunkAPI.getState(), metafile?.branch ?? '');
    // `addBranch` handles cases where no new worktree (or branch) is needing and gracefully
    // returns the target branch; this includes when the target branch is the current branch in the
    // repository, and when the target branch is already in a linked worktree
    const branchB = await thunkAPI.dispatch(addBranch({root: dir.toString(), ref})).unwrap();

    if (isVersionedMetafile(metafile) && branchA && branchB) {
      // relative path from root to file
      const relativePath = relative(branchA.root.toString(), metafile.path.toString());
      // absolute path from new linked worktree root to file
      const absolutePath = join(branchB.root.toString(), relativePath);
      return await thunkAPI.dispatch(fetchMetafile({path: absolutePath})).unwrap();
    }

    console.error(
      `Unable to switch ${metafile?.name} [${id}] from '${branchA?.scope}/${branchA?.ref}' to '${branchB?.scope}/${branchB?.ref}'`,
    );
    return undefined;
  },
);

export const revertChanges = createAppAsyncThunk<void, VersionedMetafile>(
  'metafiles/revertChanges',
  async (metafile, thunkAPI) => {
    const branch = await thunkAPI.dispatch(fetchBranch({metafile})).unwrap();

    if (metafile.status !== 'unmodified' && branch) {
      await checkoutPathspec({
        dir: branch.root,
        pathspec: metafile.path.toString(),
        ours: true,
      });
      const updated = await thunkAPI.dispatch(updateFilebasedMetafile(metafile)).unwrap();
      if (updated) await thunkAPI.dispatch(updateVersionedMetafile(updated?.id)).unwrap();
    }
  },
);

// export const updateConflicted = createAppAsyncThunk<Metafile[], Conflict[]>(
//   'metafiles/fetchConflicted',
//   async (conflicts, thunkAPI) => {
//     const conflictedFiles = removeDuplicates(conflicts, (c1, c2) => isEqualPaths(c1.path, c2.path));
//     return flattenArray(
//       await Promise.all(
//         conflictedFiles.map(async conflict => {
//           const metafile = await thunkAPI
//             .dispatch(fetchMetafile({ path: conflict.path, handlers: ['Editor', 'Explorer'] }))
//             .unwrap();
//           return isFilebasedMetafile(metafile)
//             ? await thunkAPI.dispatch(updateVersionedMetafile(metafile)).unwrap()
//             : metafile;
//         })
//       )
//     );
//   }
// );
