import { DateTime } from 'luxon';
import { checkProject } from '../../containers/conflicts';
import { branchLog } from '../../containers/git-plumbing';
import { merge } from '../../containers/merges';
import { useAppDispatch } from '../../store/hooks';
import { Branch } from '../../store/slices/branches';
import { Repository } from '../../store/slices/repos';
import { createCard } from '../../store/thunks/cards';
import { createMetafile, updateConflicted } from '../../store/thunks/metafiles';
import { Status } from '../StatusIcon';

type MissingGitConfigs = string[] | undefined;

export const checkDelta = async (
    setDeltaStatus: React.Dispatch<React.SetStateAction<Status>>,
    setDeltaCommits: React.Dispatch<React.SetStateAction<number>>,
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    setLog: React.Dispatch<React.SetStateAction<string>>,
    repo: Repository,
    base: Branch,
    compare: Branch
) => {
    setDeltaStatus('Running');
    const log = await branchLog(repo.root, base.ref, compare.ref,
        (progress) => {
            setProgress(typeof progress.total === 'number' ? Math.round((progress.loaded / progress.total) * 100) : 0);
            setLog(`${progress.loaded}` + (progress.total ? `/${progress.total}` : '') + `: ${progress.phase}`);
        });
    setDeltaCommits(log.length);
    setDeltaStatus(log.length > 0 ? 'Passing' : 'Failing');
}

export const runMerge = async (
    setConflicts: React.Dispatch<React.SetStateAction<Status>>,
    setConfigs: React.Dispatch<React.SetStateAction<MissingGitConfigs>>,
    setProgress: React.Dispatch<React.SetStateAction<number>>,
    setLog: React.Dispatch<React.SetStateAction<string>>,
    dispatch: ReturnType<typeof useAppDispatch>,
    repo: Repository,
    base: Branch,
    compare: Branch
) => {
    setConflicts('Running');
    const result = await merge(repo.root, base.ref, compare.ref);
    const isConflicting = result.mergeConflicts ? result.mergeConflicts.length > 0 : false;
    console.log(result);

    if (isConflicting) {
        const conflicts = await checkProject(
            repo.root,
            (progress) => {
                setProgress(typeof progress.total === 'number' ? Math.round((progress.loaded / progress.total) * 100) : 0);
                setLog(`${progress.loaded}` + (progress.total ? `/${progress.total}` : '') + `: ${progress.phase}`);
            });
        await dispatch(updateConflicted(conflicts)); // updates version control status on related metafiles
        const manager = await dispatch(createMetafile({
            metafile: {
                modified: DateTime.local().valueOf(),
                name: 'Conflicts',
                handler: 'ConflictManager',
                filetype: 'Text',
                loading: [],
                repo: repo.id,
                path: repo.root,
                merging: { base: base.ref, compare: compare.ref }
            }
        })).unwrap();
        await dispatch(createCard({ metafile: manager }));
    }
    return setConflicts(isConflicting ? 'Failing' : 'Passing');
}

// const checkBuilds = async (
//     setBuilds: React.Dispatch<React.SetStateAction<Status>>,
//     repo: Repository,
//     base: Branch
// ) => {
//     setBuilds('Running');
//     // check for build failures by running build scripts from target project
//     const results = await build(repo, base.ref);
//     const hasBuilt = results.installCode === 0 && results.buildCode === 0;
//     console.log(`BUILD:`, { results });
//     return setBuilds(hasBuilt ? 'Passing' : 'Failing');
// }