import { useCallback, useEffect, useState } from 'react';
import { PathLike } from 'fs-extra';
import * as io from '../io';
import * as path from 'path';
import { getIgnore } from '../git-plumbing';
import useDirectory from './useDirectory';
import { isDefined } from '../format';

type Conflict = {
    filepath: PathLike,
    conflicts: number
}

export type useGitConflictsHook = {
    root: PathLike | undefined,
    conflicts: Conflict[],
    check: () => Promise<void>
}

/**
 * Custom React Hook for monitoring for merge conflicts on the current branch of a git repository. 
 * when cha
 * @param root The relative or absolute path to the git root directory.
 * @returns A `useGitConflictsHook` object containing the root path, a list of conflicting files detected, and a `check` function 
 * for manually triggering conflict checks.
 */
const useGitConflicts = (root: PathLike | undefined): useGitConflictsHook => {
    const [conflicts, setConflicts] = useState<Conflict[]>([]);
    const { files } = useDirectory(root);

    const check = useCallback(async () => {
        if (root) {
            const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
            const ignore = (await getIgnore(root));
            // this rule is standard for git-based projects
            ignore.add('.git');
            // .gitignore files often include 'node_modules/' as a rule, but node-ignore treats that rule as requiring the trailing '/'
            // so the 'node_module' directory will not be ignored. See: https://github.com/kaelzhang/node-ignore#2-filenames-and-dirnames
            ignore.add('node_modules');

            const filepaths = files
                .map(metafile => metafile.path)
                .filter(isDefined)
                .filter(f => !ignore.ignores(path.relative(root.toString(), f.toString())));   // filter ignored files

            const matching = await Promise.all(filepaths.map(async f => {
                const content = await io.readFileAsync(f, { encoding: 'utf-8' });
                const matches = content.match(conflictPattern);
                return { filepath: f, conflicts: matches ? matches.length : 0 };
            }));

            const conflicting = matching.filter(match => match.conflicts > 0);

            setConflicts(conflicting);
        }
    }, [root, files]);

    // trigger checks based on updates to files within the project directory
    useEffect(() => { check() }, [files]);

    return { root, conflicts, check };
}

export default useGitConflicts;