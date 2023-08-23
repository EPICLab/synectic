import { PathLike } from 'fs-extra';
import { ExactlyOne, isDefined, partition, removeObjectProperty } from '../../containers/utils';
import { createAppAsyncThunk } from '../hooks';
import branchSelectors from '../selectors/branches';
import repoSelectors from '../selectors/repos';
import {
  Branch,
  UnmergedBranch,
  branchAdded,
  branchReplaced,
  isUnmergedBranch
} from '../slices/branches';
import { FilebasedMetafile, isVersionedMetafile } from '../slices/metafiles';
import { Repository, repoUpdated } from '../slices/repos';
import { MergeOutput, SHA1, UUID } from '../types';
import { fetchParentMetafile } from './metafiles';
import { MergeAction } from '../../containers/git';
import { fetchCommits } from './commits';

export type BranchIdentifiers = Pick<Branch, 'root' | 'ref' | 'scope'>;

/**
 * Fetch a {@link Branch} object from the Redux store. This function does not create git branches
 * within a repository worktree (i.e. it does not interact with the filesystem). Instead, this
 * function checks for an existing branch based on `branchIdentifiers` or `metafile` parameters,
 * and adds a new {@link Branch} to the Redux store if no matches were found.
 * @param obj - A destructed object for named parameters.
 * @param obj.branchIdentifiers - Fetch based on {@link BranchIdentifiers} fields.
 * @param obj.metafile - Fetch based on {@link FilebasedMetafile} fields.
 * @returns {Branch} A new {@link Branch} object representing the updated worktree information, or
 * an existing Branch if `ref` matches the existing current branch in the repository root directory.
 */
export const fetchBranch = createAppAsyncThunk<
  Branch | undefined,
  ExactlyOne<{ branchIdentifiers: BranchIdentifiers; metafile: FilebasedMetafile }>
>('branches/fetchBranch', async (input, thunkAPI) => {
  const state = thunkAPI.getState();

  // handle branchIdentifiers using the least expensive method first
  if (input.branchIdentifiers) {
    // check for a directly matching branch before using any expensive methods
    const branchRoot = await window.api.git.getBranchRoot(
      input.branchIdentifiers.root,
      input.branchIdentifiers.ref
    );
    const root =
      input.branchIdentifiers.scope === 'local' && branchRoot
        ? branchRoot
        : input.branchIdentifiers.root;
    const branch = branchRoot
      ? branchSelectors.selectByRef(
          state,
          root,
          input.branchIdentifiers.ref,
          input.branchIdentifiers.scope
        )
      : undefined;
    if (branch) return branch;
  }

  // if no branchIdentifier matches or a metafile was provided instead, parse relevant fields
  const root = input.metafile
    ? await window.api.git.getRoot(input.metafile.path)
    : input.branchIdentifiers.root;
  const current =
    input.metafile && root
      ? await window.api.git.revParse({ dir: root, opts: ['abbrevRef'], args: ['HEAD'] })
      : undefined;
  const ref = input.metafile ? current : input.branchIdentifiers.ref;
  const scope = input.metafile ? 'local' : input.branchIdentifiers.scope;

  // handle metafile using the least expensive method first
  if (input.metafile) {
    // check for a directly matching branch before using any expensive methods
    let branch = isVersionedMetafile(input.metafile)
      ? branchSelectors.selectById(state, input.metafile.branch)
      : undefined;
    if (branch) return branch;

    // otherwise, if parent metafile already has a branch UUID then check for matching branch
    const parent = !branch
      ? await thunkAPI.dispatch(fetchParentMetafile(input.metafile)).unwrap()
      : undefined;
    branch =
      parent && isVersionedMetafile(parent)
        ? branchSelectors.selectById(state, parent.branch)
        : branch;
    if (branch) return branch;

    // otherwise, check for the current branch in the root git directory (derived from metafile)
    branch = root && ref ? branchSelectors.selectByRef(state, root, ref, scope) : undefined;
    if (branch) return branch;
  }

  // if no matches were found for branchIdentifiers or metafile, then build a new branch
  const branch =
    root && ref ? await thunkAPI.dispatch(buildBranch({ ref, root, scope })).unwrap() : undefined;
  return branch;
});

/**
 * Fetch all branches within a repository based in the specified root directory. This function wraps
 * around {@linkcode fetchBranch} and filters the results into `local` and `remote` branch arrays.
 */
export const fetchBranches = createAppAsyncThunk<{ local: Branch[]; remote: Branch[] }, PathLike>(
  'branches/fetchBranches',
  async (root, thunkAPI) => {
    const branches = (
      await Promise.all(
        (await window.api.git.showBranch({ dir: root, all: true }))
          .filter(branch => branch.ref !== 'HEAD')
          .map(branch =>
            thunkAPI
              .dispatch(
                fetchBranch({
                  branchIdentifiers: { root: root.toString(), ref: branch.ref, scope: branch.scope }
                })
              )
              .unwrap()
          )
      )
    ).filter(isDefined);
    const [local, remote] = partition(branches, branch => branch.scope === 'local');
    return { local, remote };
  }
);

/**
 * Build a {@link Branch} object that is added to the Redux store. This function does not
 * create git branches within a repository worktree (i.e. it does not interact with the
 * filesystem), but instead updates the store to reflect any newly created branches.
 * Use {@linkcode addBranch} to create a new branch within the filesystem.
 */
export const buildBranch = createAppAsyncThunk<Branch, BranchIdentifiers>(
  'branches/buildBranch',
  async (identifiers, thunkAPI) => {
    const branchRoot = await window.api.git.getBranchRoot(identifiers.root, identifiers.ref);
    const root = identifiers.scope === 'local' && branchRoot ? branchRoot : identifiers.root;
    const { dir, gitdir, worktreeDir, worktreeGitdir } = await window.api.git.getWorktreePaths(
      root
    );

    const rootGitdir = worktreeGitdir ? worktreeGitdir : gitdir ? gitdir : '';
    const linked = isDefined(worktreeDir);
    const current = dir
      ? (await window.api.git.revParse({
          dir: dir,
          opts: ['abbrevRef'],
          args: ['HEAD']
        })) === identifiers.ref
      : false;
    const config = await window.api.git.getConfig({
      dir: dir ? dir : root,
      keyPath: `branch.${identifiers.ref}.remote`
    });
    const remote = config && config.scope !== 'none' ? config.value : 'origin';
    const commits = (
      await thunkAPI
        .dispatch(
          fetchCommits({
            branchIdentifiers: { root: root, ref: identifiers.ref, scope: identifiers.scope }
          })
        )
        .unwrap()
    ).map(commit => commit.oid.toString());

    const status =
      !linked && !current
        ? 'clean'
        : (await window.api.git.worktreeStatus({ dir: root }))?.status ?? 'uncommitted';
    const head = commits.length > 0 ? commits[0]?.toString() ?? '' : '';
    const revBare = await window.api.git.revParse({ dir: root, opts: ['isBareRepository'] });
    const bare = revBare?.toLowerCase() === 'true';
    const merging = (await window.api.git.fetchMergingBranches(root))?.compare;

    const repo = dir ? repoSelectors.selectByRoot(thunkAPI.getState(), dir) : undefined;
    const repoHas = (branch: UUID): boolean =>
      repo ? repo.local.includes(branch) || repo.remote.includes(branch) : false;
    const existing = Object.values(thunkAPI.getState().branches.entities)
      .filter(
        branch =>
          branch?.scope === identifiers.scope &&
          branch?.ref === identifiers.ref &&
          repoHas(branch.id)
      )
      .filter(isDefined)[0];

    const base = {
      id: existing ? existing.id : window.api.uuid(),
      scope: identifiers.scope,
      ref: identifiers.ref,
      linked: linked,
      current: current,
      bare: bare,
      root: root,
      gitdir: rootGitdir,
      remote: remote,
      status: status,
      commits: commits,
      head: head
    };

    const branch: Branch | UnmergedBranch = merging
      ? { ...base, status: 'unmerged', merging }
      : isUnmergedBranch(base)
      ? removeObjectProperty(base, 'merging')
      : base;

    if (existing) {
      return thunkAPI.dispatch(branchReplaced(branch)).payload;
    } else {
      return thunkAPI.dispatch(branchAdded(branch)).payload;
    }
  }
);

/**
 * Checkout a branch in a {@link https://git-scm.com/docs/git-worktree linked worktree} and return
 * a Branch object representing the updated branch information.
 * @param obj - A destructed object for named parameters.
 * @param obj.root - The relative or absolute path to the repository root directory (i.e. the `dir`
 * in the `WorktreePaths` type).
 * @param obj.ref - The name of the branch to checkout.
 * @param obj.head - Optional SHA1 commit hash for targeting a specific commit as the HEAD of the
 * new branch.
 * @returns {Branch} A new Branch object representing the updated worktree information, or an
 * existing Branch if `ref` matches the existing current branch in the repository root directory.
 */
export const addBranch = createAppAsyncThunk<
  Branch | undefined,
  { root: string; ref: string; head?: SHA1 | undefined }
>('branches/addBranch', async ({ root, ref, head }, thunkAPI) => {
  const state = thunkAPI.getState();

  // check whether ref matches the current branch in the repository root path, if so return branch
  const current = await window.api.git.revParse({
    dir: root,
    opts: ['abbrevRef'],
    args: ['HEAD']
  });
  if (ref === current)
    return await thunkAPI
      .dispatch(fetchBranch({ branchIdentifiers: { root: root, ref: ref, scope: 'local' } }))
      .unwrap();

  // check whether a linked worktree has already been created for ref
  const repo = repoSelectors.selectByRoot(state, root);
  // the current branch is included in `worktrees`, but that case is already handled above so we
  // won't be searching for it
  const worktrees = repo ? await window.api.git.worktreeList({ dir: repo.root }) : [];
  const existingWorktree = worktrees.find(w => w.ref === ref);

  // check whether ref does not exist in repository; i.e. a new branch is being requested at head
  const existingRef =
    (await window.api.git.revParse({ dir: root, opts: ['verify'], args: [ref] })) === 'true';

  // if no linked worktree exists then create it, and then update the branch as needed before
  // fetching the new metafile
  const linkedRoot = existingWorktree
    ? existingWorktree.root
    : repo
    ? window.api.fs.normalize(`${root.toString()}/../.syn/${repo.name}/${ref}`)
    : undefined;

  if (linkedRoot) {
    if (!existingWorktree)
      if (existingRef) {
        await window.api.git.worktreeAdd({
          dir: root,
          path: linkedRoot,
          commitish: ref
        });
      } else if (head && repo) {
        await window.api.git.worktreeAdd({
          dir: root,
          path: linkedRoot,
          commitish: head.toString(),
          newBranch: ref
        });
      }
    return thunkAPI
      .dispatch(fetchBranch({ branchIdentifiers: { root: linkedRoot, ref: ref, scope: 'local' } }))
      .unwrap();
  }
  return undefined;
});

/**
 * Remove a Branch object from the Redux store. This will delete the local branch (including in a
 * linked worktree), but will not alter any remote branches associated with the repository. This
 * function does interact with the filesystem in order to remove the target branch and update the
 * branches in the repository according to the Redux store.
 * @param obj - A destructed object for named parameters.
 * @param obj.repoId - The UUID of a Repository object found in the Redux store.
 * @param obj.branchId - The UUID of a Branch object found in the Redux store; points to the
 * underlying branch to be removed.
 * @returns {boolean} A boolean indicating whether the branch was successfully removed.
 */
export const removeBranch = createAppAsyncThunk<boolean, { repoId: UUID; branchId: UUID }>(
  'branches/removeBranch',
  async ({ repoId, branchId }, thunkAPI) => {
    const state = thunkAPI.getState();
    const repo = repoSelectors.selectById(state, repoId);
    if (!repo) return false;
    const branch = branchSelectors.selectById(state, branchId);
    if (!branch) return false;
    const current = await window.api.git.revParse({
      dir: repo.root,
      opts: ['abbrevRef'],
      args: ['HEAD']
    });
    if (branch.ref === current) return false;
    const worktreeRemoved = branch.linked
      ? await window.api.git.worktreeRemove({ dir: branch.root, worktree: branch.ref })
      : true;
    const branchRemoved = repo
      ? await window.api.git.deleteBranch({ dir: repo.root, branchName: branch.ref, force: true })
      : false;
    await thunkAPI.dispatch(updateBranches(repo));

    return worktreeRemoved && branchRemoved;
  }
);

/**
 * Merge changes from the named commits (or branches) into the base branch. This function does
 * interact with the filesystem in order to execute a merge and collect the results. Changes
 * to state are updated in the Redux store for the Repository and Branch objects associated
 * with this merge action.
 */
export const mergeBranch = createAppAsyncThunk<
  MergeOutput | undefined,
  { repoId: UUID; baseBranch: UUID; commitishes: string[] }
>('branches/mergeBranch', async ({ repoId, baseBranch, commitishes }, thunkAPI) => {
  const repo = repoSelectors.selectById(thunkAPI.getState(), repoId);
  if (!isDefined(repo)) return undefined;
  const base = branchSelectors.selectById(thunkAPI.getState(), baseBranch);
  if (!isDefined(base)) return undefined;

  let result: MergeOutput;
  try {
    result = await window.api.git.mergeBranch({
      dir: base?.root ?? repo.root,
      base: base?.ref ?? '',
      commitish: commitishes.join(' ')
    });
  } catch (error) {
    console.error({ error });
    result = {
      status: 'Failing',
      alreadyMerged: false,
      fastForward: false,
      output: error as string
    };
  }

  await thunkAPI.dispatch(updateBranch(base.id));
  return result;
});

/**
 * Continue an in-progress merge such that changes from the named commits (or branches) are
 * merged into the base branch. This function interacts with the filesystem in order to
 * send continuation action commands to the underlying VCS. Changes to state are updated in
 * the Redux store for the Repository and Branch objects associated with this merge action.
 */
export const mergeBranchContinue = createAppAsyncThunk<
  MergeOutput | undefined,
  { repoId: UUID; baseBranch: UUID; action: MergeAction }
>('branches/mergeBranchResume', async ({ repoId, baseBranch, action }, thunkAPI) => {
  const repo = repoSelectors.selectById(thunkAPI.getState(), repoId);
  if (!isDefined(repo)) return undefined;
  const base = branchSelectors.selectById(thunkAPI.getState(), baseBranch);
  if (!isDefined(base)) return undefined;

  let result: MergeOutput;
  try {
    const succeeded = await window.api.git.mergeInProgress({
      dir: base?.root ?? repo.root,
      action: action
    });
    result = {
      status: succeeded ? 'Passing' : 'Failing',
      alreadyMerged: false,
      fastForward: false,
      output: String(succeeded)
    };
  } catch (error) {
    console.error({ error });
    result = {
      status: 'Failing',
      alreadyMerged: false,
      fastForward: false,
      output: error as string
    };
  }

  await thunkAPI.dispatch(updateBranch(base.id));
  return result;
});

/**
 * Update the root directory path and linked worktree status of a Branch object in the Redux store
 * to reflect the current filesystem and git status of a branch. Also appends/removes merging
 * information in the case of an in-progress merge where this branch is the base. This function
 * updates the store state to reflect any recent changes to these fields.
 */
export const updateBranch = createAppAsyncThunk<Branch | undefined, UUID>(
  'branches/updateBranch',
  async (id, thunkAPI) => {
    const branch = branchSelectors.selectById(thunkAPI.getState(), id);
    if (!branch) return undefined;
    const branchRoot = await window.api.git.getBranchRoot(branch.root, branch.ref);
    const root = branch.scope === 'local' && branchRoot ? branchRoot : branch.root;
    const { dir, worktreeDir } = await window.api.git.getWorktreePaths(root);

    const linked = isDefined(worktreeDir);
    const rootLocal =
      isDefined(branchRoot) && isDefined(dir) && window.api.fs.isEqualPaths(branchRoot, dir);
    const current =
      dir && branch.scope === 'local'
        ? (await window.api.git.listBranch({ dir: dir, showCurrent: true })).some(
            b => b.ref === branch.ref
          )
        : false;
    const updatedRoot = linked ? worktreeDir : branch.root;
    const commits = (await thunkAPI.dispatch(fetchCommits({ branchId: id })).unwrap()).map(commit =>
      commit.oid.toString()
    );
    const status =
      rootLocal && !current
        ? 'clean'
        : (await window.api.git.worktreeStatus({ dir: updatedRoot }))?.status ?? 'uncommitted';
    const head = commits.length > 0 ? commits[0]?.toString() ?? '' : '';
    const merging = (await window.api.git.fetchMergingBranches(updatedRoot))?.compare;

    const updates: Branch = {
      ...branch,
      linked: linked,
      root: updatedRoot,
      status: status,
      commits: commits,
      head: head
    };
    const updatedBranch = merging
      ? { ...updates, merging: merging }
      : isUnmergedBranch(updates)
      ? removeObjectProperty(updates, 'merging')
      : updates;
    return thunkAPI.dispatch(branchReplaced(updatedBranch)).payload;
  }
);

/**
 * Update the list of branches associated with a Repository entry in the Redux store. This
 * function captures added/removed branches so that the repository remains up-to-date with the
 * state of branches in the underlying git repository on the filesystem.
 */
export const updateBranches = createAppAsyncThunk<Repository, Repository>(
  'branches/updateBranches',
  async (repo, thunkAPI) => {
    const branches = await thunkAPI.dispatch(fetchBranches(repo.root)).unwrap();
    branches.local.forEach(branch => thunkAPI.dispatch(updateBranch(branch.id)));
    const branchIds = {
      local: branches.local.map(b => b.id),
      remote: branches.remote.map(b => b.id)
    };
    return thunkAPI.dispatch(repoUpdated({ ...repo, ...branchIds })).payload;
  }
);
