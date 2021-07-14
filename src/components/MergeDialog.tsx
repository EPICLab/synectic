import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import type { Modal, UUID } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { RootState } from '../store/root';
import { build } from '../containers/builds';
import { GitConfigForm } from './GitConfigForm';
import { merge } from '../containers/git-porcelain';
import { branchLog } from '../containers/git-plumbing';
import { Button, Dialog, Divider, Grid, Typography } from '@material-ui/core';
import TimelineComponent from './MergeTimeline';
import DropSelect from './DropSelect';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      fullWidth: true,
      maxWidth: 530,
      backgroundColor: theme.palette.background.paper,
    },
    button: {
      margin: theme.spacing(1),
    },
    section1: {
      width: 450,
      margin: theme.spacing(3, 2, 1),
    },
    section2: {
      maxWidth: 530,
      margin: theme.spacing(1, 1),
    },
  }),
);

type CheckState =
  | 'Unchecked'
  | 'Running'
  | 'Passing'
  | 'Failing';

type MissingGitConfigs = string[] | undefined;

const MergeDialog: React.FunctionComponent<Modal> = props => {
  const classes = useStyles();
  const repos = useSelector((state: RootState) => Object.values(state.repos));
  const [repo, setRepo] = useState<UUID>('');
  const [base, setBase] = useState<string>('');
  const [compare, setCompare] = useState<string>('');
  const [commitCountDelta, setCommitCountDelta] = useState<CheckState>('Unchecked');
  const [branchConflicts, setBranchConflicts] = useState<[CheckState, MissingGitConfigs]>(['Unchecked', undefined]);
  const [buildStatus, setBuildStatus] = useState<CheckState>('Unchecked');
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

  const branchCheck = async () => {
    const fullRepo = repos.find(r => r.id === repo);
    if (!fullRepo) return;
    const result = await merge(fullRepo.root, base, compare, true);
    console.log(`merge dryRun: ${base}...${compare}`);
    console.log(result);
  }

  const check = async () => {
    console.log(`<<MERGE CHECK>>\nbase: ${base} => compare: ${compare}`);
    setCommitCountDelta('Running');
    setBranchConflicts(['Unchecked', undefined]);
    setBuildStatus('Unchecked');

    const fullRepo = repos.find(r => r.id === repo);
    if (!fullRepo) {
      setCommitCountDelta('Unchecked');
      return;
    }
    const repoLog = fullRepo ? (await branchLog(fullRepo.root, base, compare)) : undefined;
    const commitStatus = repoLog ? (repoLog.length > 0 ? 'Passing' : 'Failing') : 'Unchecked';
    setCommitCountDelta(commitStatus);

    if (commitStatus == 'Failing') return;
    setBranchConflicts(['Running', undefined]);

    const conflictCheck = await merge(fullRepo.root, base, compare, true);
    const conflictStatus = conflictCheck.mergeCommit || conflictCheck.fastForward ? 'Passing' : 'Failing';
    setBranchConflicts([conflictStatus, conflictCheck.missingConfigs]);

    if (conflictStatus == 'Failing') return;
    setBuildStatus('Running');

    const buildResults = await build(fullRepo, base, compare);
    const buildStatus = (buildResults.installCode === 0 && buildResults.buildCode === 0) ? 'Passing' : 'Failing';
    setBuildStatus(buildStatus);
  }

  const branches = repos.find(r => r.id === repo)?.local.map(b => ({ key: b, value: b }));

  return (
    <Dialog id='dialog' open={true} onClose={() => dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id })}>
      <div className={classes.root}>
        <div className={classes.section1}>
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
        <div className={classes.section2}>
          <Grid container alignItems='center' justifyContent='center'>
            <Grid item xs={12}>
              <DropSelect label='Repo' target={repo} setTarget={setRepo} options={repos.map(r => ({ key: r.id, value: r.name }))} />
            </Grid>
            <Grid item xs={6}>
              <DropSelect label='Base' target={base} setTarget={setBase} options={branches ? branches : []} />
            </Grid>
            <Grid item xs={6}>
              <DropSelect label='Compare' target={compare} setTarget={setCompare} options={branches ? branches : []} />
            </Grid>
          </Grid>
          <TimelineComponent commitCountDelta={commitCountDelta} branchConflicts={branchConflicts} buildStatus={buildStatus} />
        </div>
        {(branchConflicts[1] && branchConflicts[1].length > 0) ? <Divider variant='middle' /> : null}
        <div className={classes.section2}>
          <GitConfigForm
            open={(branchConflicts[1] && branchConflicts[1].length > 0) ? true : false}
          />
        </div>
        <div className={classes.section2}>
          <Button variant='outlined' color='primary' className={classes.button} onClick={check}>Check</Button>
          <Button variant='outlined' color='primary' className={classes.button} onClick={branchCheck}>Check Branches</Button>
          <Button variant='outlined' color='primary' className={classes.button}>Merge</Button>
        </div>
      </div>
    </Dialog>
  );
}

export default MergeDialog;