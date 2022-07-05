// import * as path from 'path';
// import { PathLike } from 'fs-extra';
// import * as io from './io';
// import { getIgnore } from './git-plumbing';
// import { asyncFilter, isDefined, removeUndefined } from './utils';
// import { Ignore } from 'ignore';
// import { getWorktreePaths } from './git-path';
// import { VersionedMetafile } from '../store/slices/metafiles';
// import { ProgressCallback } from 'isomorphic-git';

// WARNING!: This Conflict type is different than the one in `merges.ts`; the `conflicts` field signatures vary
// export type Conflict = Pick<VersionedMetafile, 'path' | 'conflicts'>;
// export type Conflict = {
//     readonly path: PathLike;
//     readonly conflicts: [number, number][];
// };

// export const checkFilepath = async (filepath: PathLike, ignoreManager?: Ignore): Promise<Conflict | undefined> => {
//     const { dir } = await getWorktreePaths(filepath);
//     if (dir && !(await io.isDirectory(filepath))) {
//         const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
//         const ignore = ignoreManager ? ignoreManager : (await getIgnore(dir, true));
//         if (ignore.ignores(path.relative(dir.toString(), filepath.toString()))) return undefined;
//         const content = await io.readFileAsync(filepath, { encoding: 'utf-8' });
//         const matches = Array.from(content.matchAll(conflictPattern));
//         const conflicts: [number, number][] = removeUndefined(matches.map(m => isDefined(m.index) ? [m.index, m.index + m.toString().length] : undefined));
//         if (conflicts.length > 0) return { path: filepath, conflicts: conflicts };
//     }
//     return undefined;
// };

// export const checkProject = async (root: PathLike | undefined, onProgress?: ProgressCallback): Promise<Conflict[]> => {
//     if (root) {
//         const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
//         const ignore = (await getIgnore(root, true));

//         const paths = (await io.readDirAsyncDepth(root))
//             .filter(p => p !== root)                                          // filter root filepath from results
//             .filter(p => !ignore.ignores(path.relative(root.toString(), p))); // filter based on git-ignore rules
//         const dirpaths = await asyncFilter(paths, async p => io.isDirectory(p));
//         const filepaths = paths.filter(p => !dirpaths.includes(p));

//         let count = 0;
//         const matching = await Promise.all(filepaths.map(async f => {
//             const content = await io.readFileAsync(f, { encoding: 'utf-8' });
//             const matches = Array.from(content.matchAll(conflictPattern));
//             const conflicts: [number, number][] = removeUndefined(matches.map(m => isDefined(m.index) ? [m.index, m.index + m.length] : undefined));
//             // Emit progress event
//             if (onProgress) {
//                 await onProgress({
//                     phase: `Checking for conflicts: ${f}`,
//                     loaded: ++count,
//                     total: filepaths.length
//                 });
//             }
//             return { path: f, conflicts: conflicts };
//         }));

//         return matching.filter(match => match.conflicts.length > 0);
//     } else {
//         return [];
//     }
// };