import * as fs from 'fs-extra';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { PathLike } from 'fs-extra';
import { listBranches } from 'isomorphic-git';
import { v4 } from 'uuid';
import { ExactlyOne, isDefined } from '../../containers/utils';
import { getBranchRoot, getRoot, getWorktreePaths } from '../../containers/git-path';
import { checkout, currentBranch, getConfig, log } from '../../containers/git-porcelain';
import { AppThunkAPI } from '../hooks';
import branchSelectors from '../selectors/branches';
import { Branch, branchAdded } from '../slices/branches';
import { DirectoryMetafile, FilebasedMetafile, isFilebasedMetafile, isVersionedMetafile, Metafile, metafileUpdated } from '../slices/metafiles';
import { createMetafile, fetchParentMetafile, updatedVersionedMetafile } from './metafiles';
import metafileSelectors from '../selectors/metafiles';
import { UUID } from '../types';
import { resolveWorktree } from '../../containers/git-worktree';
import { join, relative } from 'path';
import { extractStats } from '../../containers/io';
import { Repository, repoUpdated } from '../slices/repos';

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
        let branch: Branch | undefined = root ? branchSelectors.selectByRoot(state, root, branchSelectTarget) : undefined;
        // otherwise create a new branch
        branch = (!branch && input.branchIdentifiers) ? await thunkAPI.dispatch(createBranch(input.branchIdentifiers)).unwrap() : branch;
        return branch;
    }
);

export const createBranch = createAsyncThunk<Branch, BranchIdentifiers, AppThunkAPI>(
    'branches/createBranch',
    async (identifiers, thunkAPI) => {
        const branchRoot: fs.PathLike | undefined = (identifiers.scope === 'local') ? await getBranchRoot(identifiers.root, identifiers.branch) : undefined;
        const root = branchRoot ? branchRoot : identifiers.root;
        const { dir, gitdir, worktreeGitdir } = await getWorktreePaths(root);

        const rootGitdir = worktreeGitdir ? worktreeGitdir : (gitdir ? gitdir : '');
        const config = await getConfig({ dir: dir ? dir : root, keyPath: `branch.${identifiers.branch}.remote` });
        const remote = (config && config.scope !== 'none') ? config.value : 'origin';
        const commits = await log({ dir: root, ref: identifiers.scope === 'local' ? identifiers.branch : `remotes/${remote}/${identifiers.branch}`, depth: 50 });
        const head = commits.length > 0 ? commits[0].oid : '';

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

type CheckoutOptions = { metafile: UUID, branchRef: string, progress?: boolean, overwrite?: boolean };

/** Checkout git branches from remote to local scope and switch branch references in a targeted Metafile. */
export const checkoutBranch = createAsyncThunk<Metafile | undefined, CheckoutOptions, AppThunkAPI<string>>(
    'branches/checkoutBranch',
    async (input, thunkAPI) => {
        const state = thunkAPI.getState();
        const metafile = metafileSelectors.selectById(state, input.metafile);
        const oldBranch: Branch | undefined = (metafile && isVersionedMetafile(metafile)) ? branchSelectors.selectById(state, metafile.branch) : undefined;
        const newBranch = branchSelectors.selectByRef(state, input.branchRef)[0];
        const repo: Repository | undefined = (metafile && metafile.repo) ? thunkAPI.getState().repos.entities[metafile.repo] : undefined;

        if (!metafile) return thunkAPI.rejectWithValue(`Cannot update non-existing metafile for id:'${input.metafile}'`);
        if (!oldBranch) return thunkAPI.rejectWithValue(`Branch missing for metafile id:'${input.metafile}'`);
        if (!newBranch) return thunkAPI.rejectWithValue(`Branch missing for target ref:'${input.branchRef}'`);
        if (!repo) return thunkAPI.rejectWithValue(`Repository missing for metafile id:'${input.metafile}'`);
        if (!isFilebasedMetafile(metafile)) return thunkAPI.rejectWithValue(`Cannot checkout branches for virtual metafile:'${input.metafile}'`);
        if (!metafile || !repo) return undefined;

        let updated: Metafile | undefined;
        if (input.overwrite) {
            // checkout the target branch into the main worktree; this is destructive to any uncommitted changes in the main worktree
            if (input.progress) await checkout({ dir: repo.root.toString(), ref: newBranch.ref, onProgress: (e) => console.log(e.phase) });
            else await checkout({ dir: repo.root.toString(), ref: newBranch.ref });
            updated = metafileSelectors.selectById(state, metafile.id);
        } else {
            // create a new linked worktree and checkout the target branch into it; non-destructive to uncommitted changes in the main worktree
            const oldWorktree = await resolveWorktree(repo, oldBranch.id, oldBranch.ref); // get an existing worktree
            const newWorktree = await resolveWorktree(repo, newBranch.id, newBranch.ref); // get a new linked-worktree, including creating a directory (if needed)
            if (!oldWorktree)
                return thunkAPI.rejectWithValue(`No worktree could be resolved for current worktree =>\n\trepo: '${repo.name}'\n\told branch: '${oldBranch.ref}'\n\tnew branch: '${newBranch.ref}'`);
            if (!newWorktree)
                return thunkAPI.rejectWithValue(`No worktree could be resolved for new worktree =>\n\trepo: '${repo.name}'\n\told branch: '${oldBranch.ref}'\n\tnew branch: '${newBranch.ref}'`);

            // update branches in repo in case new local branches have been checked out
            const branches = repo ? await thunkAPI.dispatch(fetchBranches(repo.root)).unwrap() : undefined;
            (repo && branches) ? thunkAPI.dispatch(repoUpdated({ ...repo, ...{ local: branches.local.map(b => b.id), remote: branches.remote.map(b => b.id) } })) : undefined;

            // either extract existing metafile or create a new metafile for the original metafile filepath
            const relativePath = relative(oldWorktree.path.toString(), metafile.path.toString());
            const absolutePath = join(newWorktree.path.toString(), relativePath);
            const fileExists = (await extractStats(absolutePath)) ? true : false;
            const existingMetafile = fileExists ? metafileSelectors.selectByFilepath(state, join(newWorktree.path.toString(), relativePath)) : undefined;
            updated = (existingMetafile && existingMetafile.length > 0) ? existingMetafile[0]
                : await thunkAPI.dispatch(createMetafile({ path: join(newWorktree.path.toString(), relativePath) })).unwrap();
        }
        // get an updated metafile based on the updated worktree path
        if (!updated) return thunkAPI.rejectWithValue(`Cannot locate updated metafile with new branch for path: '${metafile.path}'`);

        if (isFilebasedMetafile(updated)) {
            updated = await thunkAPI.dispatch(updatedVersionedMetafile(updated)).unwrap();
            updated = thunkAPI.dispatch(metafileUpdated({ ...updated, loading: metafile.loading.filter(flag => flag !== 'checkout') })).payload;
        }
        if (input.progress) console.log('checkout complete...');
        return updated;
    }
)