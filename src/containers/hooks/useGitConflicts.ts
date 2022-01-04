import { useEffect } from 'react';
import { PathLike } from 'fs-extra';
import useMap from './useMap';
import useGitWatcher from './useGitWatcher';
import { WatchEventType } from './useWatcher';
import { checkFilepath, checkProject, Conflict } from '../conflicts';
import { diffArrays } from 'diff';

export type useGitConflictsHook = {
    root: PathLike | undefined,
    conflicts: Conflict[],
    update: () => Promise<void>;
}

/**
 * Custom React Hook for monitoring for merge conflicts within a git project directory. Uses `useGitWatcher` hook under the hood
 * for managing `useWatcher` hooks, which becomes a no-op and will skip any metafiles not under version control. Updates are
 * contained in the resulting `conflicts` list returned by this hook.
 * @param root The relative or absolute path to the git root directory.
 * @returns A `useGitConflictsHook` object containing the root path, a list of conflicting files detected, and a `check` function 
 * for manually triggering conflict checks.
 */
const useGitConflicts = (root: PathLike | undefined): useGitConflictsHook => {
    useGitWatcher(root, async (event: WatchEventType, filename: PathLike) => update(event, filename));
    const [conflicts, conflictActions] = useMap<string, Conflict>([]);

    // initialization
    useEffect(() => { updateAll() }, []);

    const updateAll = async () => {
        const conflicted = await checkProject(root);
        conflicted.map(conflict => {
            const previous = conflicts.get(conflict.filepath.toString());
            const changed = previous ? diffArrays(previous.conflicts, conflict.conflicts).filter(diff => diff.added || diff.removed).length > 0 : false;
            if (!previous || changed) conflictActions.set(conflict.filepath.toString(), conflict);
        });
    }

    const update = async (event: WatchEventType, filename: PathLike) => {
        if (!['unlink', 'unlinkDir'].includes(event)) {
            console.log(filename);
            const conflict = await checkFilepath(filename);
            if (conflict) {
                conflictActions.set(conflict.filepath.toString(), conflict);
            } else {
                conflictActions.remove(filename.toString());
            }
        }
    };

    return { root, conflicts: Array.from(conflicts.values()), update: updateAll };
}

export default useGitConflicts;