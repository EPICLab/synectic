import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { normalize } from 'path';
import { v4 } from 'uuid';
import isBoolean from 'validator/lib/isBoolean';
import { getBranchRoot, getRoot, getWorktreePaths, listBranch, log, removeBranch, revParse, worktreeAdd, worktreeList, worktreeRemove, worktreeStatus } from '../../containers/git';
import { getConfig } from '../../containers/old-git/git-porcelain';
import { ExactlyOne, isDefined } from '../../containers/utils';
import { AppThunkAPI } from '../hooks';
import branchSelectors from '../selectors/branches';
import repoSelectors from '../selectors/repos';
import { Branch, branchAdded, branchUpdated } from '../slices/branches';
import { DirectoryMetafile, FilebasedMetafile, isVersionedMetafile } from '../slices/metafiles';
import { Repository, repoUpdated } from '../slices/repos';
import { CommitObject, UUID } from '../types';
import { fetchParentMetafile } from './metafiles';

type BranchIdentifiers = { root: PathLike, branch: string, scope: 'local' | 'remote' };

export const fetchBranch = createAsyncThunk<Branch | undefined, ExactlyOne<{ branchIdentifiers: BranchIdentifiers, metafile: FilebasedMetafile }>, AppThunkAPI>(
    'branches/fetchBranch',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();

        if (input.metafile) {
            // if metafile already has a branch UUID, check for matching branch
            let branch: Branch | undefined = input.metafile.branch ? branchSelectors.selectById(state, input.metafile.branch) : undefined;
            const parent: DirectoryMetafile | undefined = !branch ? await thunkAPI.dispatch(fetchParentMetafile(input.metafile)).unwrap() : undefined;
            // otherwise if parent metafile already has a branch UUID, check for matching branch
            branch = (parent && isVersionedMetafile(parent)) ? branchSelectors.selectById(state, parent.branch) : branch;
            if (branch) return await thunkAPI.dispatch(updateBranchLinkedStatus(branch)).unwrap();
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
        branch = (!branch && input.branchIdentifiers) ? await thunkAPI.dispatch(createBranch(input.branchIdentifiers)).unwrap() : branch;
        return branch ? await thunkAPI.dispatch(updateBranchLinkedStatus(branch)).unwrap() : undefined;
    }
);

export const fetchBranches = createAsyncThunk<{ local: Branch[], remote: Branch[] }, PathLike, AppThunkAPI>(
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
export const createBranch = createAsyncThunk<Branch, BranchIdentifiers, AppThunkAPI>(
    'branches/createBranch',
    async (identifiers, thunkAPI) => {
        const branchRoot: Awaited<ReturnType<typeof getBranchRoot>> = await getBranchRoot(identifiers.root, identifiers.branch);
        const root = (identifiers.scope === 'local' && branchRoot) ? branchRoot : identifiers.root;
        const { dir, gitdir, worktreeDir, worktreeGitdir } = await getWorktreePaths(root);

        const rootGitdir = worktreeGitdir ? worktreeGitdir : gitdir ? gitdir : '';
        const linked = isDefined(worktreeDir);
        const config = await getConfig({ dir: dir ? dir : root, keyPath: `branch.${identifiers.branch}.remote` });
        const remote = (config && config.scope !== 'none') ? config.value : 'origin';
        const commits = await log({ dir: root, ref: identifiers.scope === 'local' ? identifiers.branch : `remotes/${remote}/${identifiers.branch}` });
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
 * Delete a Branch object from the Redux store. This will delete both linked worktrees and locally tracked branches, but will not
 * delete remote branches from a repository.
 */
export const deleteBranch = createAsyncThunk<boolean, { repoId: UUID, branch: Branch }, AppThunkAPI>(
    'branches/deleteBranch',
    async ({ repoId, branch }, thunkAPI) => {
        const state = thunkAPI.getState();

        const repo = repoSelectors.selectById(state, repoId);
        if (!repo) return false;
        const current = (await listBranch({ dir: repo.root, showCurrent: true }))[0]?.ref;
        if (branch.ref === current) return false;
        const worktreeRemoved = branch.linked ? await worktreeRemove({ dir: branch.root, worktree: branch.ref }) : true;
        const branchRemoved = repo ? await removeBranch({ dir: repo.root, branchName: branch.ref, force: true }) : false;
        await thunkAPI.dispatch(updateRepositoryBranches(repo));

        return worktreeRemoved && branchRemoved;
    }
);

/**
 * Update the list of branches associated with a Repository entry in the Redux store. This function captures
 * added/removed branches so that the repository remains up-to-date with the state of branches in the underlying
 * git repository on the filesystem.
 */
export const updateRepositoryBranches = createAsyncThunk<Repository, Repository, AppThunkAPI>(
    'branches/updateRepositoryBranches',
    async (repo, thunkAPI) => {
        const branches = await thunkAPI.dispatch(fetchBranches(repo.root)).unwrap();
        const branchIds = { local: branches.local.map(b => b.id), remote: branches.remote.map(b => b.id) };
        return thunkAPI.dispatch(repoUpdated({ ...repo, ...branchIds })).payload;
    }
);

/**
 * Update the root directory path and linked worktree status of a Branch to reflect the current filesystem and git 
 * status of a branch. This function updates the store state to reflect any recent changes to these fields.
 */
export const updateBranchLinkedStatus = createAsyncThunk<Branch, Branch, AppThunkAPI>(
    'branches/updateBranchLinkedStatus',
    async (branch, thunkAPI) => {
        const branchRoot = await getBranchRoot(branch.root, branch.ref);
        const root = (branch.scope === 'local' && branchRoot) ? branchRoot : branch.root;
        const { worktreeDir } = await getWorktreePaths(root);

        const linked = isDefined(worktreeDir);
        const updatedRoot = linked ? worktreeDir : branch.root;

        return thunkAPI.dispatch(branchUpdated({ ...branch, linked: linked, root: updatedRoot })).payload;
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
export const checkoutBranch = createAsyncThunk<Branch | undefined, { ref: string, root: PathLike }, AppThunkAPI>(
    'branches/checkoutBranch',
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