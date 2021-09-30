import { useCallback, useEffect, useState } from 'react';
import { PathLike } from 'fs-extra';
import * as io from '../io';
import { getIgnore } from '../git-plumbing';
import * as path from 'path';
import { asyncFilter } from '../format';

type Conflict = {
    filepath: PathLike,
    conflicts: number
}

export type useGitConflictsHook = {
    root: PathLike,
    conflicts: Conflict[],
    check: () => Promise<void>
}

const useGitConflicts = (root: PathLike): useGitConflictsHook => {
    const [conflicts, setConflicts] = useState<Conflict[]>([]);


    const check = useCallback(async () => {
        const conflictPattern = /<<<<<<<[^]+?=======[^]+?>>>>>>>/gm;
        const ignore = (await getIgnore(root));
        // this rule is standard for git-based projects
        ignore.add('.git');
        // .gitignore files often include 'node_modules/' as a rule, but node-ignore treats that rule as requiring the trailing '/'
        // so the 'node_module' directory will not be ignored. See: https://github.com/kaelzhang/node-ignore#2-filenames-and-dirnames
        ignore.add('node_modules');

        const filepaths = (await io.readDirAsyncDepth(root))
            .filter(p => p !== root)                                            // filter root filepath from results
            .filter(p => !ignore.ignores(path.relative(root.toString(), p)));   // filter ignored files and directories
        const directories = await asyncFilter(filepaths, async (e: string) => io.isDirectory(e));
        const files = filepaths.filter(f => !directories.includes(f));

        const matching = await Promise.all(files.map(async f => {
            const content = await io.readFileAsync(f, { encoding: 'utf-8' });
            const matches = content.match(conflictPattern);
            return { filepath: f, conflicts: matches ? matches.length : 0 };
        }));
        const conflicting = matching.filter(match => match.conflicts > 0);

        setConflicts(conflicting);
    }, [root]);

    useEffect(() => { check() }, []);

    return { root, conflicts, check };
}

export default useGitConflicts;