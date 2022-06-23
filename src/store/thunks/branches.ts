import * as fs from 'fs-extra';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { listBranches, ReadCommitResult } from 'isomorphic-git';
import { v4 } from 'uuid';
import { ExactlyOne, isDefined } from '../../containers/utils';
import { getBranchRoot, getRoot, getWorktreePaths } from '../../containers/git-path';
import { checkout, currentBranch, getConfig, log } from '../../containers/git-porcelain';
import { AppThunkAPI } from '../hooks';
import branchSelectors from '../selectors/branches';
import { Branch, branchAdded } from '../slices/branches';
import { DirectoryMetafile, FilebasedMetafile, isFilebasedMetafile, isVersionedMetafile, Metafile, metafileUpdated } from '../slices/metafiles';
import { createMetafile, fetchParentMetafile } from './metafiles';
import metafileSelectors from '../selectors/metafiles';
import { UUID } from '../types';
import { join, relative } from 'path';
import { Repository, repoUpdated } from '../slices/repos';
import repoSelectors from '../selectors/repos';

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
            if (branch) return branch;
        }
        const root: fs.PathLike | undefined = input.metafile ? await getRoot(input.metafile.path) : input.branchIdentifiers.root;
        // if filepath has a root path, then check for a matching branch
        const current = root ? await currentBranch({ dir: root }) : undefined;
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
        return branch;
    }
);

export const createBranch = createAsyncThunk<Branch, BranchIdentifiers, AppThunkAPI>(
    'branches/createBranch',
    async (identifiers, thunkAPI) => {
        const branchRoot = await getBranchRoot(identifiers.root, identifiers.branch);
        const root = (identifiers.scope === 'local' && branchRoot) ? branchRoot : identifiers.root;
        const { dir, gitdir, worktreeGitdir } = await getWorktreePaths(root);

        const rootGitdir = worktreeGitdir ? worktreeGitdir : (gitdir ? gitdir : '');
        const config = await getConfig({ dir: dir ? dir : root, keyPath: `branch.${identifiers.branch}.remote` });
        const remote = (config && config.scope !== 'none') ? config.value : 'origin';
        const commits = await log({ dir: root, ref: identifiers.scope === 'local' ? identifiers.branch : `remotes/${remote}/${identifiers.branch}`, depth: 50 });
        const head = commits.length > 0 ? (commits[0] as ReadCommitResult).oid : '';

        return thunkAPI.dispatch(branchAdded({
            id: v4(),
            scope: identifiers.scope,
            ref: identifiers.branch,
            root: root,
            gitdir: rootGitdir,
            remote: remote,
            commits: commits,
            head: head
        })).payload;
    }
);

export const fetchBranches = createAsyncThunk<{ local: Branch[], remote: Branch[] }, PathLike, AppThunkAPI>(
    'branches/fetchBranches',
    async (root, thunkAPI) => {
        const localBranches = await listBranches({ fs: fs, dir: root.toString() });
        const local = (await Promise.all(localBranches
            .filter(branch => branch !== 'HEAD') // remove HEAD ref pointer, which is only a reference pointer
            .map(branch => thunkAPI.dispatch(fetchBranch({ branchIdentifiers: { root: root, branch: branch, scope: 'local' } })).unwrap())
        )).filter(isDefined);

        const remoteBranches = await listBranches({ fs: fs, dir: root.toString(), remote: 'origin' });
        const remote = (await Promise.all(remoteBranches
            .filter(branch => branch !== 'HEAD') // remove HEAD ref pointer, which is only a reference pointer
            .map(branch => thunkAPI.dispatch(fetchBranch({ branchIdentifiers: { root: root, branch: branch, scope: 'remote' } })).unwrap())
        )).filter(isDefined);
        return { local, remote };
    }
);

/** Verify that a repository is tracking all local and remote branches. */
export const updateRepository = createAsyncThunk<Repository, Repository, AppThunkAPI>(
    'branches/updateRepository',
    async (repo, thunkAPI) => {
        const branches = await thunkAPI.dispatch(fetchBranches(repo.root)).unwrap();
        const branchIds = { local: branches.local.map(b => b.id), remote: branches.remote.map(b => b.id) };
        return thunkAPI.dispatch(repoUpdated({ ...repo, ...branchIds })).payload;
    }
);

/** Checkout git branches from remote to local scope and switch branch references in a targeted Metafile. */
/** Switch branches or restore working tree files for a specific Metafile. If the overwrite option is enabled, the checkout will destructively
 * overwrite the current branch in the main worktree root directory. Otherwise, the checkout will create a new linked worktree and clone the
 * branch files into the linked worktree directory. A new Metafile is created and returned with the filepath into the new linked worktree directory
 * unless there is an existing Metafile with that path, in which case the Metafile is updated with the new branch UUID (only occurs when the `overwrite`
 * option is used).
 */
export const checkoutBranch = createAsyncThunk<Metafile | undefined, { metafileId: UUID, branchRef: string, progress?: boolean, overwrite?: boolean }, AppThunkAPI<string>>(
    'branches/checkoutBranch',
    async ({ metafileId, branchRef, overwrite = false, progress = false }, thunkAPI) => {
        let state = thunkAPI.getState();
        const metafile = metafileSelectors.selectById(state, metafileId);
        if (!metafile) return thunkAPI.rejectWithValue(`Cannot update non-existing metafile for id:'${metafileId}'`);
        if (!isFilebasedMetafile(metafile)) return thunkAPI.rejectWithValue(`Cannot update non-filebased metafile for id:'${metafileId}'`);
        if (!isVersionedMetafile(metafile)) return thunkAPI.rejectWithValue(`Cannot update non-versioned metafile for id:'${metafileId}'`);
        const repo = repoSelectors.selectById(state, metafile.repo);
        const currentBranch = branchSelectors.selectById(state, metafile.branch);
        if (!repo || !currentBranch) return thunkAPI.rejectWithValue(`Repository and/or branch missing for metafile id:'${metafileId}'`);

        await checkout({ dir: repo.root.toString(), ref: branchRef, overwrite: overwrite, url: repo.url, onProgress: progress ? (e) => console.log(e.phase) : undefined });
        await thunkAPI.dispatch(updateRepository(repo)); // update branches in repo in case new local branches were created during checkout
        state = thunkAPI.getState(); // updated branches wouldn't be available in the cached state created above
        const updatedBranch = branchSelectors.selectByRef(state, branchRef, 'local')[0];
        if (!updatedBranch) return thunkAPI.rejectWithValue(`Unable to find branch after checkout:'local/${branchRef}'`);

        const relativePath = relative(currentBranch.root.toString(), metafile.path.toString()); // relative path from root to metafile file object
        const absolutePath = join(updatedBranch.root.toString(), relativePath);
        const existingMetafile = metafileSelectors.selectByFilepath(state, absolutePath)[0];
        return existingMetafile
            ? thunkAPI.dispatch(metafileUpdated({ ...existingMetafile, branch: updatedBranch.id })).payload
            : await thunkAPI.dispatch(createMetafile({ path: absolutePath })).unwrap();
    }
)