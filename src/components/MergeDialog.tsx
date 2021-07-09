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
import { Button, Dialog, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@material-ui/core';
import TimelineComponent from './MergeTimeline';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 530,
      backgroundColor: theme.palette.background.paper,
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120
    },
    formControl1: {
      margin: theme.spacing(1),
      minWidth: 496
    },
    formControl2: {
      margin: theme.spacing(1),
      minWidth: 240,
    },
    button: {
      margin: theme.spacing(1),
    },
    timeline: {
      margin: theme.spacing(1),
      '& > :last-child .MuiTimelineItem-content': {
        height: 28
      }
    },
    tl_item: {
      padding: theme.spacing(0, 2),
      '&:before': {
        flex: 0,
        padding: theme.spacing(0)
      }
    },
    tl_content: {
      padding: theme.spacing(0.5, 1, 0),
    },
    section1: {
      margin: theme.spacing(3, 2, 1),
    },
    section2: {
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

  const repoChange = (event: React.ChangeEvent<{ value: unknown }>) => setRepo(event.target.value as UUID);
  const baseChange = (event: React.ChangeEvent<{ value: unknown }>) => setBase(event.target.value as string);
  const compareChange = (event: React.ChangeEvent<{ value: unknown }>) => setCompare(event.target.value as string);

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
          <FormControl variant='outlined' className={classes.formControl1}>
            <InputLabel id='repo-select-label'>Repository</InputLabel>
            <Select
              labelId='repo-select-label'
              id='repo-select'
              value={repo}
              onChange={repoChange}
              label='Repository'
            >
              <MenuItem value='None' />
              {repos.map(repo => <MenuItem key={repo.id} value={repo.id}>{repo.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl variant="outlined" className={classes.formControl}>
            <InputLabel id="demo-simple-select-outlined-label">Age</InputLabel>
            <Select
              labelId="demo-simple-select-outlined-label"
              id="demo-simple-select-outlined"
              value={base}
              onChange={baseChange}
              label="Age"
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value={10}>Ten</MenuItem>
              <MenuItem value={20}>Twenty</MenuItem>
              <MenuItem value={30}>Thirty</MenuItem>
            </Select>
          </FormControl>
          <FormControl variant='outlined' className={classes.formControl2}>
            <InputLabel id='base-branch-select-label'>Base</InputLabel>
            <Select
              labelId='base-branch-select-label'
              id='base-branch-select'
              value={base}
              onChange={baseChange}
              label='Base'
            >
              <MenuItem value='None' />
              {repo ? repos.find(r => r.id === repo)?.local.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>) : null}
            </Select>
          </FormControl>
          <FormControl variant='outlined' className={classes.formControl2}>
            <InputLabel id='compare-branch-select-label'>Compare</InputLabel>
            <Select
              labelId='compare-branch-select-label'
              id='compare-branch-select'
              value={compare}
              onChange={compareChange}
              label='Compare'
            >
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {repo ? repos.find(r => r.id === repo)?.local.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>) : null}
            </Select>
          </FormControl>
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