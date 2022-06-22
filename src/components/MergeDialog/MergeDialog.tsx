import React, { useState } from 'react';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { Status } from '../Status';
import { UUID } from '../../store/types';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import branchSelectors from '../../store/selectors/branches';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Dialog, Divider, Grid, Typography } from '@material-ui/core';
import { delay, isDefined } from '../../containers/utils';
import RepoSelect from '../RepoSelect';
import BranchSelect from '../BranchSelect';
import GitConfigForm from '../GitConfigForm';
import { Timeline } from '@material-ui/lab';
import DeltaTimeline from './DeltaTimeline';
import MergeTimeline from './MergeTimeline';
import TimelineButtons from './TimelineButtons';
import { checkDelta, runMerge } from './merge-actions';
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
    const [deltaStatus, setDeltaStatus] = useState<Status>('Unchecked');
    const [deltaCommits, setDeltaCommits] = useState(0);
    const [deltaProgress, setDeltaProgress] = useState(0);
    const [deltaLog, setDeltaLog] = useState('');
    const [conflictStatus, setConflicts] = useState<Status>('Unchecked');
    const [mergeProgress, setMergeProgress] = useState(0);
    const [mergeLog, setMergeLog] = useState('');
    const [configs, setConfigs] = useState<MissingGitConfigs>(undefined);
    // const [builds, setBuilds] = useState<Status>('Unchecked');

    const repo = repoId ? repos[repoId] : undefined;
    const base = baseId ? branches[baseId] : undefined;
    const compare = compareId ? branches[compareId] : undefined;
    const mergeable = isDefined(repo) && isDefined(base) && isDefined(compare) && `${base.scope}/${base.ref}` !== `${compare.scope}/${compare.ref}`;

    const check = async () => {
        if (!mergeable) return;
        await checkDelta(setDeltaStatus, setDeltaCommits, setDeltaProgress, setDeltaLog, repo, base, compare);
        await runMerge(setConflicts, setConfigs, setMergeProgress, setMergeLog, dispatch, repo, base, compare);
        if (conflictStatus === 'Failing') {
            await delay(2500);
            dispatch(modalRemoved(props.id));
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
                    <Timeline align='left' className={styles.timeline}>
                        <DeltaTimeline status={deltaStatus} connector={conflictStatus !== 'Unchecked'}
                            progress={deltaProgress} subtext={deltaLog} commits={deltaCommits} />
                        <MergeTimeline status={conflictStatus} progress={mergeProgress} subtext={mergeLog} />
                    </Timeline>
                </div>
                <GitConfigForm root={repo?.root} open={configs !== undefined} divider={conflictStatus === 'Failing'} />
                <div className={styles.section2}>
                    <TimelineButtons id={props.id} status={conflictStatus} mergeable={mergeable} check={check} />
                </div>
            </div>
        </Dialog>
    );
}

export default MergeDialog;