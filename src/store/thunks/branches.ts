import { PathLike } from 'fs-extra';
import { normalize } from 'path';
import { v4 } from 'uuid';
import isBoolean from 'validator/lib/isBoolean';
import { deleteBranch, fetchMergingBranches, getBranchRoot, getConfig, getRoot, getWorktreePaths, listBranch, log, revParse, worktreeAdd, worktreeList, worktreeRemove, worktreeStatus } from '../../containers/git';
import { ExactlyOne, isDefined, removeObjectProperty } from '../../containers/utils';
import { createAppAsyncThunk } from '../hooks';
import branchSelectors from '../selectors/branches';
import repoSelectors from '../selectors/repos';
import { Branch, branchAdded, branchReplaced, isMergingBranch } from '../slices/branches';
import { DirectoryMetafile, FilebasedMetafile, isVersionedMetafile } from '../slices/metafiles';
import { Repository, repoUpdated } from '../slices/repos';
import { CommitObject, UUID } from '../types';
import { fetchParentMetafile } from './metafiles';

type BranchIdentifiers = { root: PathLike, branch: string, scope: 'local' | 'remote' };

export const fetchBranch = createAppAsyncThunk<Branch | undefined, ExactlyOne<{ branchIdentifiers: BranchIdentifiers, metafile: FilebasedMetafile }>>(
    'branches/fetchBranch',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();

        if (input.metafile) {
            // if metafile already has a branch UUID, check for matching branch
            let branch: Branch | undefined = input.metafile.branch ? branchSelectors.selectById(state, input.metafile.branch) : undefined;
            const parent: DirectoryMetafile | undefined = !branch ? await thunkAPI.dispatch(fetchParentMetafile(input.metafile)).unwrap() : undefined;
            // otherwise if parent metafile already has a branch UUID, check for matching branch
            branch = (parent && isVersionedMetafile(parent)) ? branchSelectors.selectById(state, parent.branch) : branch;
            if (branch) return await thunkAPI.dispatch(updateBranch(branch)).unwrap();
        }
        const root: Awaited<ReturnType<typeof getRoot>> = input.metafile ? await getRoot(input.metafile.path) : input.branchIdentifiers.root;
        // if filepath has a root path, then check for a matching branch
        const current = root ? (await listBranch({ dir: root, showCurrent: true }))[0]?.ref : undefined;
        const branchSelectTarget: { scope: 'local' | 'remote', ref: string } | undefined =
            input.branchIdentifiers?.branch ? {
                scope: input.branchIdentifiers.scope,
                ref: input.branchIdentifiers.branch
            } : current ? {
                scope: 'local',
                ref: current
            } : undefined;
        let branch = root && branchSelectTarget ? branchSelectors.selectByRef(state, branchSelectTarget.ref, branchSelectTarget.scope)[0] : undefined;
        // otherwise create a new branch
        branch = (!branch && input.branchIdentifiers) ? await thunkAPI.dispatch(buildBranch(input.branchIdentifiers)).unwrap() : branch;
        return branch ? await thunkAPI.dispatch(updateBranch(branch)).unwrap() : undefined;
    }
);

export const fetchBranches = createAppAsyncThunk<{ local: Branch[], remote: Branch[] }, PathLike>(
    'branches/fetchBranches',
    async (root, thunkAPI) => {
        const branches: Awaited<ReturnType<typeof listBranch>> = await listBranch({ dir: root, all: true });
        const local = (await Promise.all(branches.filter(branch => branch.scope === 'local')
            .filter(branch => branch.ref !== 'HEAD')
            .map(branch => thunkAPI.dispatch(fetchBranch({ branchIdentifiers: { root: root, branch: branch.ref, scope: 'local' } })).unwrap())
        )).filter(isDefined);
        const remote = (await Promise.all(branches.filter(branch => branch.scope === 'remote')
            .filter(branch => branch.ref !== 'HEAD')
            .map(branch => thunkAPI.dispatch(fetchBranch({ branchIdentifiers: { root: root, branch: branch.ref, scope: 'remote' } })).unwrap())
        )).filter(isDefined);

        return { local, remote };
    }
);

/**
 * Create a Branch object that is added to the Redux store. This function does not create git branches within
 * a repository worktree (i.e. it does not interact with the filesystem). Instead, this function updates the 
 * store state to reflect any newly created branches.
 */
export const buildBranch = createAppAsyncThunk<Branch, BranchIdentifiers>(
    'branches/buildBranch',
    async (identifiers, thunkAPI) => {
        const branchRoot: Awaited<ReturnType<typeof getBranchRoot>> = await getBranchRoot(identifiers.root, identifiers.branch);
        const root: PathLike = (identifiers.scope === 'local' && branchRoot) ? branchRoot : identifiers.root;
        const { dir, gitdir, worktreeDir, worktreeGitdir } = await getWorktreePaths(root);

        const rootGitdir = worktreeGitdir ? worktreeGitdir : gitdir ? gitdir : '';
        const linked = isDefined(worktreeDir);
        const config = await getConfig({ dir: dir ? dir : root, keyPath: `branch.${identifiers.branch}.remote` });
        const remote = (config && config.scope !== 'none') ? config.value : 'origin';
        const commits = await log({ dir: root, revRange: identifiers.scope === 'local' ? identifiers.branch : `remotes/${remote}/${identifiers.branch}` });
        const status = (await worktreeStatus({ dir: root }))?.status ?? 'uncommitted';
        const head = commits.length > 0 ? (commits[0] as CommitObject).oid : '';
        const revBare = await revParse({ dir: root, options: ['isBareRepository'] });
        const bare = isBoolean(revBare) ?? Boolean(revBare);

        return thunkAPI.dispatch(branchAdded({
            id: v4(),
            scope: identifiers.scope,
            ref: identifiers.branch,
            linked: linked,
            bare: bare,
            root: root,
            gitdir: rootGitdir,
            remote: remote,
            status: status,
            commits: commits,
            head: head
        })).payload;
    }
);

/**
 * Checkout a branch in a {@link https://git-scm.com/docs/git-worktree linked worktree} and return a Branch object representing 
 * the updated branch information.
 * 
 * @param obj - A destructed object for named parameters.
 * @param obj.ref - The name of the branch to checkout.
 * @param obj.root - The relative or absolute path to the repository root directory (i.e. the `dir` in the `WorktreePaths` type).
 * @returns {Branch} A new Branch object representing the updated worktree information, or an existing Branch if `ref` matches
 * the existing current branch in the repository root directory.
 */
export const addBranch = createAppAsyncThunk<Branch | undefined, { ref: string, root: PathLike }>(
    'branches/addBranch',
    async ({ ref, root }, thunkAPI) => {
        const state = thunkAPI.getState();

        // check whether ref matches the current branch in the repository root path, if so return a metafile for it
        const current = (await listBranch({ dir: root, showCurrent: true }))[0]?.ref;
        if (ref === current) return await thunkAPI
            .dispatch(fetchBranch({ branchIdentifiers: { root: root, branch: ref, scope: 'local' } }))
            .unwrap();

        // check whether a linked worktree has already been created for ref
        const repo = repoSelectors.selectByRoot(state, root);
        // the current branch is included in `worktrees`, but that case is already handled above so we won't be searching for it
        const worktrees: Awaited<ReturnType<typeof worktreeList>> = repo ? await worktreeList({ dir: repo.root }) : [];
        const existingWorktree = worktrees.find(w => w.ref === ref);

        // if no linked worktree exists then create it, and then update the branch as needed before fetching the new metafile
        const linkedRoot = existingWorktree
            ? existingWorktree.root
            : repo
                ? normalize(`${root.toString()}/../.syn/${repo.name}/${ref}`)
                : undefined;
        if (linkedRoot) {
            if (!existingWorktree) await worktreeAdd({ dir: root, path: linkedRoot, commitish: ref });
            return await thunkAPI.dispatch(fetchBranch({ branchIdentifiers: { root: linkedRoot, branch: ref, scope: 'local' } })).unwrap();
        }
        return undefined;
    }
);

/**
 * Remove a Branch object from the Redux store. This will delete the local branch (including in a linked worktree), but will
 * not alter any remote branches associated with the repository. This function does interact with the filesystem in order to
 * remove the target branch and update the branches in the repository according to the Redux store.
 * 
 * @param obj - A destructed object for named parameters.
 * @param obj.repoId - The UUID of a Repository object found in the Redux store.
 * @param obj.branch - The name of the branch to remove.
 * @returns {boolean} A boolean indicating whether the branch was successfully removed.
 */
export const removeBranch = createAppAsyncThunk<boolean, { repoId: UUID, branch: Branch }>(
    'branches/removeBranch',
    async ({ repoId, branch }, thunkAPI) => {
        const state = thunkAPI.getState();

        const repo = repoSelectors.selectById(state, repoId);
        if (!repo) return false;
        const current = (await listBranch({ dir: repo.root, showCurrent: true }))[0]?.ref;
        if (branch.ref === current) return false;
        const worktreeRemoved = branch.linked ? await worktreeRemove({ dir: branch.root, worktree: branch.ref }) : true;
        const branchRemoved = repo ? await deleteBranch({ dir: repo.root, branchName: branch.ref, force: true }) : false;
        await thunkAPI.dispatch(updateBranches(repo));

        return worktreeRemoved && branchRemoved;
    }
);

/**
 * Update the root directory path and linked worktree status of a Branch to reflect the current filesystem and git 
 * status of a branch. Also appends/removes merging information in the case of an in-progress merge where this branch
 * is the base. This function updates the store state to reflect any recent changes to these fields.
 */
export const updateBranch = createAppAsyncThunk<Branch, Branch>(
    'branches/updateBranch',
    async (branch, thunkAPI) => {
        const branchRoot = await getBranchRoot(branch.root, branch.ref);
        const root = (branch.scope === 'local' && branchRoot) ? branchRoot : branch.root;
        const { worktreeDir } = await getWorktreePaths(root);

        const linked = isDefined(worktreeDir);
        const updatedRoot = linked ? worktreeDir : branch.root;
        const status = (await worktreeStatus({ dir: updatedRoot }))?.status ?? 'uncommitted';
        const merging = (await fetchMergingBranches(updatedRoot))?.compare;

        const updates: Branch = { ...branch, linked: linked, root: updatedRoot, status: status };
        const updatedBranch = merging ? { ...updates, merging: merging } : isMergingBranch(updates) ? removeObjectProperty(updates, 'merging') : updates;
        return thunkAPI.dispatch(branchReplaced(updatedBranch)).payload;
    }
);

/**
 * Update the list of branches associated with a Repository entry in the Redux store. This function captures
 * added/removed branches so that the repository remains up-to-date with the state of branches in the underlying
 * git repository on the filesystem.
 */
export const updateBranches = createAppAsyncThunk<Repository, Repository>(
    'branches/updateBranches',
    async (repo, thunkAPI) => {
        const branches = await thunkAPI.dispatch(fetchBranches(repo.root)).unwrap();
        await Promise.all(branches.local.map(branch => thunkAPI.dispatch(updateBranch(branch))));
        const branchIds = { local: branches.local.map(b => b.id), remote: branches.remote.map(b => b.id) };
        return thunkAPI.dispatch(repoUpdated({ ...repo, ...branchIds })).payload;
    }
);