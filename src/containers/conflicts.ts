import * as path from 'path';
import { PathLike } from 'fs-extra';
import * as io from './io';
import { getIgnore } from './git-plumbing';
import { asyncFilter, removeUndefined } from './format';
import { getBranchRoot, getRepoRoot } from './git-porcelain';
import { Ignore } from 'ignore';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppThunkAPI } from '../store/hooks';
import { v4 } from 'uuid';
import { fetchMetafile } from '../store/thunks/metafiles';
import { DateTime } from 'luxon';
import { loadCard } from '../store/thunks/handlers';

export type Conflict = {
    /** The relative or absolute path to the file containing conflicts. */
    filepath: PathLike,
    /** An array of indexed conflicts indicating the starting position of each conflict in the file. */
    conflicts: number[]
}

export const loadConflictManagers = createAsyncThunk<void, void, AppThunkAPI>(
    'conflicts/loadConflictManagers',
    async (_, thunkAPI) => {
        const repos = removeUndefined(Object.values(thunkAPI.getState().repos.entities));
        await Promise.all(repos.map(async repo => {
            await Promise.all(repo.local.map(async branch => {
                const root = await getBranchRoot(repo, branch);
                const conflicts = await checkProject(root);
                if (root && conflicts.length > 0) {
                    const conflictManager = await thunkAPI.dispatch(fetchMetafile({
                        virtual: {
                            id: v4(),
                            modified: DateTime.local().valueOf(),
                            name: `Version Conflicts`,
                            handler: 'ConflictManager',
                            repo: repo.id,
                            path: root,
                            merging: { base: branch, compare: '' }
                        }
                    })).unwrap();
                    console.log(`Loading ConflictManager for repo: ${repo.name}, branch: ${branch}...`);
                    await thunkAPI.dispatch(loadCard({ metafile: conflictManager }));
                }
            }));
        }));
    }
);

export const checkFilepath = async (filepath: PathLike, ignoreManager?: Ignore): Promise<Conflict | undefined> => {
    const root = await getRepoRoot(filepath);
    if (root && !(await io.isDirectory(filepath))) {
        const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
        const ignore = ignoreManager ? ignoreManager : (await getIgnore(root, true));
        if (ignore.ignores(path.relative(root.toString(), filepath.toString()))) return undefined;
        const content = await io.readFileAsync(filepath, { encoding: 'utf-8' });
        const matches = Array.from(content.matchAll(conflictPattern));
        const matching = { filepath: filepath, conflicts: removeUndefined(matches.map(m => m.index)) };
        if (matching.conflicts.length > 0) return matching;
    }
    return undefined;
}

export const checkProject = async (root: PathLike | undefined): Promise<Conflict[]> => {
    if (root) {
        const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
        const ignore = (await getIgnore(root, true));

        const paths = (await io.readDirAsyncDepth(root, 1))
            .filter(p => p !== root)                                          // filter root filepath from results
            .filter(p => !ignore.ignores(path.relative(root.toString(), p))); // filter based on git-ignore rules
        const dirpaths = await asyncFilter(paths, async p => io.isDirectory(p));
        const filepaths = paths.filter(p => !dirpaths.includes(p));

        const matching = await Promise.all(filepaths.map(async f => {
            const content = await io.readFileAsync(f, { encoding: 'utf-8' });
            const matches = Array.from(content.matchAll(conflictPattern));
            return { filepath: f, conflicts: removeUndefined(matches.map(m => m.index)) };
        }));

        return matching.filter(match => match.conflicts.length > 0);
    } else {
        return [];
    }
}