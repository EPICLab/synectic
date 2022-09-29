import React, { useState } from 'react';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { LinearProgressWithLabel, Status } from '../Status';
import { UUID } from '../../store/types';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import branchSelectors from '../../store/selectors/branches';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Dialog, Divider, Grid, Typography } from '@material-ui/core';
import { isDefined } from '../../containers/utils';
import RepoSelect from '../RepoSelect';
import BranchSelect from '../Branches/BranchSelect';
import GitConfigForm from '../GitConfigForm';
import TimelineButtons from './TimelineButtons';
import { merge, MergeResult } from '../../containers/old-git/merges';
import { getBranchRoot } from '../../containers/git';
import { createMetafile, fetchMetafile, updateVersionedMetafile } from '../../store/thunks/metafiles';
import { DateTime } from 'luxon';
import { buildCard } from '../../store/thunks/cards';
import { isFilebasedMetafile } from '../../store/slices/metafiles';
import * as git from '../../containers/git';
import { updateBranches } from '../../store/thunks/branches';
// import { build } from '../../containers/builds';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        mergeDialog: {
            width: '100%',
            maxWidth: 530,
            backgroundColor: theme.palette.background.paper,
        },
        timeline: {
            margin: theme.spacing(1),
            '& > :last-child .MuiTimelineItem-content': {
                height: 28
            }
        },
        button: {
            margin: theme.spacing(1),
        },
        section1: {
            margin: theme.spacing(3, 2, 1),
        },
        section2: {
            margin: theme.spacing(1, 1),
        },
    }),
);

type MissingGitConfigs = string[] | undefined;

const MergeDialog = (props: Modal) => {
    const repos = useAppSelector((state: RootState) => repoSelectors.selectEntities(state));
    const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
    const dispatch = useAppDispatch();
    const styles = useStyles();

    const [repoId, setRepoId] = useState<UUID | undefined>(props.options?.['repo'] ? props.options?.['repo'] as UUID : undefined);
    const [baseId, setBaseId] = useState<UUID | undefined>(props.options?.['base'] ? props.options?.['base'] as UUID : undefined);
    const [compareId, setCompareId] = useState<UUID | undefined>(props.options?.['compare'] ? props.options?.['compare'] as UUID : undefined);
    const [status, setStatus] = useState<Status>('Unchecked');
    const [progress, setProgress] = useState<{ percent: number, message: string }>({ percent: 0, message: '' });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [configs, setConfigs] = useState<MissingGitConfigs>(undefined);
    // const [builds, setBuilds] = useState<Status>('Unchecked');

    const repo = repoId ? repos[repoId] : undefined;
    const base = baseId ? branches[baseId] : undefined;
    const compare = compareId ? branches[compareId] : undefined;
    const mergeable = isDefined(repo) && isDefined(base) && isDefined(compare) && `${base.scope}/${base.ref}` !== `${compare.scope}/${compare.ref}`;

    const start = async () => {
        if (!mergeable) return;
        setStatus('Running');
        setProgress({ percent: 0, message: 'Merging' });

        const newResult = await git.mergeBranch({
            dir: repo.root,
            base: base.ref,
            commitish: compare.ref,
            onProgress: (progress) => setProgress({
                percent: Math.round((1 / 3 * progress.loaded / progress.total) * 100),
                message: progress.phase
            })
        });
        console.log({ newResult });

        let result: MergeResult;
        try {
            result = await merge(repo.root, base.ref, compare.ref, (progress) => setProgress({
                percent: Math.round((1 / 3 * progress.loaded / progress.total) * 100),
                message: progress.phase
            }));
        } catch (error) {
            console.error(`Caught during merging:`, error);
            return;
        }
        const hasErrors = result.stderr.length > 0;
        const hasMerged = result.mergeStatus.mergeCommit ? result.mergeStatus.mergeCommit : false;
        await dispatch(updateBranches(repo));

        const branchRoot = await getBranchRoot(repo.root, base.ref);

        if (result.mergeConflicts && result.mergeConflicts.length > 0 && branchRoot) {
            const conflicts = await Promise.all(result.mergeConflicts
                .map(async filepath => dispatch(fetchMetafile(filepath)).unwrap()));
            await Promise.all(conflicts.filter(isFilebasedMetafile)
                .map(metafile => dispatch(updateVersionedMetafile(metafile)).unwrap()));
            const manager = await dispatch(createMetafile({
                metafile: {
                    modified: DateTime.local().valueOf(),
                    name: 'Conflicts',
                    handler: 'ConflictManager',
                    filetype: 'Text',
                    loading: [],
                    repo: repo.id,
                    path: branchRoot,
                    merging: { base: base.ref, compare: compare.ref }
                }
            })).unwrap();
            await dispatch(buildCard({ metafile: manager }));

            setStatus('Failing');
            setProgress({
                percent: 100,
                message: `Resolve ${result.mergeConflicts ? result.mergeConflicts.length : 0} conflict${result.mergeConflicts?.length == 1 ? '' : 's'} and commit resolution before continuing.`
            });
        }
        if (hasErrors) {
            setStatus('Failing');
            setProgress({ percent: 0, message: result.stderr });
        }
        if (hasMerged && status != 'Failing') {
            setStatus('Passing');
            setProgress({ percent: 100, message: 'Merged' });
        }
        // await checkBuilds(setBuilds, repo, base);
    }

    return (
        <Dialog id='dialog' open={true} onClose={() => dispatch(modalRemoved(props.id))}>
            <div className={styles.mergeDialog}>
                <div className={styles.section1}>
                    <Grid container alignItems='center'>
                        <Grid item xs>
                            <Typography gutterBottom variant='h4'>
                                Merge
                            </Typography>
                        </Grid>
                        <Grid item>
                        </Grid>
                    </Grid>
                    <Typography color='textSecondary' variant='body2'>
                        Select the repository, base, and compare branches to merge.
                    </Typography>
                </div>
                <Divider variant='middle' />
                <div className={styles.section2}>
                    <Grid container alignItems='center' justifyContent='center'>
                        <Grid item xs={12}>
                            <RepoSelect
                                repos={Object.values(repos).filter(isDefined)}
                                selectedRepo={repoId ? repoId : ''}
                                setSelectedRepo={setRepoId}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <BranchSelect
                                label='Base'
                                repo={repo}
                                selectedBranch={baseId ? baseId : ''}
                                optionsFilter={b => b.id !== compareId}
                                setSelectedBranch={setBaseId}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <BranchSelect
                                label='Compare'
                                repo={repo}
                                selectedBranch={compareId ? compareId : ''}
                                optionsFilter={b => b.id !== baseId}
                                setSelectedBranch={setCompareId}
                            />
                        </Grid>
                    </Grid>
                    {(status !== 'Unchecked') ?
                        <div className={styles.section2}>
                            <LinearProgressWithLabel value={progress.percent} subtext={progress.message} />
                        </div>
                        : null}
                </div>
                <GitConfigForm root={repo?.root} open={configs !== undefined} divider={status === 'Failing'} />
                <div className={styles.section2}>
                    <TimelineButtons id={props.id} status={status} mergeable={mergeable} start={start} />
                </div>
            </div>
        </Dialog>
    );
}

export default MergeDialog;