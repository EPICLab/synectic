import { ExactlyOne, Prettify, removeUndefined } from '../../containers/utils';
import { createAppAsyncThunk } from '../hooks';
import branchSelectors from '../selectors/branches';
import commitSelectors from '../selectors/commits';
import metafileSelectors from '../selectors/metafiles';
import repoSelectors from '../selectors/repos';
import { Commit, commitAdded, commitRemoved } from '../slices/commits';
import { isVersionedMetafile } from '../slices/metafiles';
import { PathLike, UUID } from '../types';
import { BranchIdentifiers, updateBranches } from './branches';
import { updateFilebasedMetafile, updateVersionedMetafile } from './metafiles';
import { fetchRepo } from './repos';

export type CommitIdentifiers = Prettify<Pick<Commit, 'oid'> & { root: PathLike }>;

export const fetchCommit = createAppAsyncThunk<
  Commit,
  ExactlyOne<{ commitIdentifiers: CommitIdentifiers; commit: Commit }>
>('commits/fetchCommit', async (input, thunkAPI) => {
  const existing = input.commit
    ? commitSelectors.selectById(thunkAPI.getState(), input.commit.oid.toString())
    : commitSelectors.selectById(thunkAPI.getState(), input.commitIdentifiers.oid.toString());

  if (existing) return existing;
  return input.commit
    ? thunkAPI.dispatch(commitAdded(input.commit)).payload
    : await thunkAPI.dispatch(buildCommit(input.commitIdentifiers)).unwrap();
});

export const fetchParentCommits = createAppAsyncThunk<Commit[], UUID>(
  'commits/fetchParents',
  async (oid, thunkAPI) => {
    const commit = commitSelectors.selectById(thunkAPI.getState(), oid);
    if (!commit) return [];

    const parents = removeUndefined(
      commit.parents.map(oid => commitSelectors.selectById(thunkAPI.getState(), oid.toString()))
    );
    return parents;
  }
);

/**
 * Fetch {@link Commit} objects from the Redux store that represent the commit information
 * contained within a specific git branch. This function attempts to locate existing {@link Commit}
 * objects in the Redux store, and adds new {@link Commit} objects if no match was found.
 */
export const fetchCommits = createAppAsyncThunk<
  Commit[],
  ExactlyOne<{ branchIdentifiers: BranchIdentifiers; branchId: UUID }>
>('commits/fetchCommits', async (input, thunkAPI) => {
  const branchIdentifiers: BranchIdentifiers | undefined = input.branchId
    ? thunkAPI.getState().branches.entities[input.branchId]
    : input.branchIdentifiers;
  if (!branchIdentifiers) return [];

  const config = await window.api.git.getConfig({
    dir: branchIdentifiers.root,
    keyPath: `branch.${branchIdentifiers.ref}.remote`
  });
  const remote = config && config.scope !== 'none' ? config.value : 'origin';
  const commits = (
    await window.api.git.revList({
      dir: branchIdentifiers.root,
      commitish: [
        branchIdentifiers.scope === 'local'
          ? branchIdentifiers.ref
          : `remotes/${remote}/${branchIdentifiers.ref}`
      ]
    })
  )
    .trim()
    .split(/\r\n|\n/);

  return await Promise.all(
    commits.map(
      async oid =>
        await thunkAPI
          .dispatch(fetchCommit({ commitIdentifiers: { oid: oid, root: branchIdentifiers.root } }))
          .unwrap()
    )
  );
});

/**
 * Build a {@link Commit} object that is added to the Redux store. This function does not create
 * git commits within a repository worktree (i.e. it does not interact with the filesystem), but
 * instead updates the store with all of the required git commit information. Use
 * {@linkcode addCommit} to create a new commit within the filesystem.
 */
export const buildCommit = createAppAsyncThunk<Commit, CommitIdentifiers>(
  'commits/buildCommit',
  async ({ oid, root }, thunkAPI) => {
    const objectInfo = await window.api.git.catFile({ dir: root, objectRef: oid });

    return thunkAPI.dispatch(
      commitAdded(
        objectInfo ?? {
          oid: oid,
          message: '',
          parents: [],
          author: {
            name: '',
            email: '',
            timestamp: undefined
          },
          committer: {
            name: '',
            email: '',
            timestamp: undefined
          }
        }
      )
    ).payload;
  }
);

export const addCommit = createAppAsyncThunk<
  Commit | undefined,
  { repoId: UUID; branchId: UUID; message: string }
>('commits/addCommit', async ({ repoId, branchId, message }, thunkAPI) => {
  const repo = repoSelectors.selectById(thunkAPI.getState(), repoId);
  const branch = branchSelectors.selectById(thunkAPI.getState(), branchId);
  if (!repo || !branch) return undefined;

  const oid = await window.api.git.commit({ dir: branch.root, message: message });
  if (!oid) {
    console.error(`Unable to commit to ${branch.root}...`);
    return undefined;
  }
  const commit = await thunkAPI
    .dispatch(fetchCommit({ commitIdentifiers: { oid: oid, root: branch.root } }))
    .unwrap();

  await thunkAPI.dispatch(updateBranches(repo)).unwrap();

  const metafiles = metafileSelectors.selectStagedByRepo(
    thunkAPI.getState(),
    repoId,
    branchId,
    false
  );
  metafiles.forEach(async metafile => {
    await thunkAPI.dispatch(updateFilebasedMetafile(metafile));
    if (isVersionedMetafile(metafile))
      await thunkAPI.dispatch(updateVersionedMetafile(metafile.id));
  });

  return commit;
});

/**
 * Remove a Commit object from the Redux store. This will delete the commit from the history of the
 * specified branch, but will only remove the Commit object in Redux if no other branches contain
 * that particular commit.
 */
export const revertCommit = createAppAsyncThunk<boolean, CommitIdentifiers>(
  'commits/revertCommit',
  async ({ oid, root }, thunkAPI) => {
    const metafiles = metafileSelectors.selectByRoot(thunkAPI.getState(), root);
    const repo = await thunkAPI.dispatch(fetchRepo({ filepath: root })).unwrap();
    if (!repo) return false;

    const succeeded = await window.api.git.reset({ dir: root, mode: 'soft', commit: oid });
    if (succeeded) {
      await thunkAPI.dispatch(commitRemoved(oid.toString()));
      await thunkAPI.dispatch(updateBranches(repo)).unwrap();
      metafiles.forEach(async metafile => {
        await thunkAPI.dispatch(updateFilebasedMetafile(metafile));
        if (isVersionedMetafile(metafile))
          await thunkAPI.dispatch(updateVersionedMetafile(metafile.id));
      });
    }
    return succeeded;
  }
);
