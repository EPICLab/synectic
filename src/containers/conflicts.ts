import * as path from 'path';
import { PathLike } from 'fs-extra';
import * as io from './io';
import { getIgnore } from './git-plumbing';
import { asyncFilter, isDefined, removeUndefined } from './utils';
import { Ignore } from 'ignore';
import { getRoot, getWorktreePaths } from './git-path';
import { VersionedMetafile } from '../store/slices/metafiles';

export type Conflict = Pick<VersionedMetafile, 'path' | 'conflicts'>;

export const checkFilepath = async (filepath: PathLike, ignoreManager?: Ignore): Promise<Conflict | undefined> => {
    const root = await getRoot(filepath);
    if (root && !(await io.isDirectory(filepath))) {
        const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
        const ignore = ignoreManager ? ignoreManager : (await getIgnore(root, true));
        if (ignore.ignores(path.relative(root.toString(), filepath.toString()))) return undefined;
        const content = await io.readFileAsync(filepath, { encoding: 'utf-8' });
        const matches = Array.from(content.matchAll(conflictPattern));
        const conflicts: [number, number][] = removeUndefined(matches.map(m => isDefined(m.index) ? [m.index, m.index + m.toString().length] : undefined));
        if (conflicts.length > 0) return { path: filepath, conflicts: conflicts };
    }
    return undefined;
};

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
            const conflicts: [number, number][] = removeUndefined(matches.map(m => isDefined(m.index) ? [m.index, m.index + m.length] : undefined));
            return { path: f, conflicts: conflicts };
        }));

        return matching.filter(match => match.conflicts.length > 0);
    } else {
        return [];
    }
};

export const resolveConflictBranches = async (root: PathLike): Promise<{ base: string | undefined, compare: string }> => {
    const branchPattern = /(?<=^Merge branch(es)? .*)('.+?')+/gm;
    const worktree = await getWorktreePaths(root);
    const mergeMsg = worktree.gitdir ? await io.readFileAsync(path.join(worktree.gitdir.toString(), 'MERGE_MSG'), { encoding: 'utf-8' }) : '';
    const match = mergeMsg.match(branchPattern);
    return match
        ? match.length === 2
            ? { base: match[0].replace(/['"]+/g, ''), compare: match[1].replace(/['"]+/g, '') }
            : { base: undefined, compare: match[0].replace(/['"]+/g, '') }
        : { base: undefined, compare: '' };
};