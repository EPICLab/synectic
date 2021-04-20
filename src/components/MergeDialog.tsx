import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import * as MUI from '@material-ui/core';
import * as MUILab from '@material-ui/lab';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import { green, red } from '@material-ui/core/colors';

import type { Modal, UUID } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { RootState } from '../store/root';
import { build } from '../containers/builds';
import { GitConfigForm } from './GitConfigForm';
import { merge } from '../containers/git-porcelain';
import { branchLog } from '../containers/git-plumbing';

const StyledCheckIcon = withStyles({
  root: {
    height: 22,
    width: 22,
    margin: 4,
    padding: 0,
    verticalAlign: 'middle',
    color: green[500]
  }
})(CheckIcon);

const StyledClearIcon = withStyles({
  root: {
    height: 22,
    width: 22,
    padding: 0,
    margin: 4,
    verticalAlign: 'middle',
    color: red[500]
  }
})(ClearIcon);

const StyledCircularProgress = withStyles({
  root: {
    margin: 4,
    padding: 2,
    verticalAlign: 'middle'
  }
})(MUI.CircularProgress);

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 530,
      backgroundColor: theme.palette.background.paper,
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

const StatusIcon = (state: CheckState) => {
  switch (state) {
    case 'Running':
      return <StyledCircularProgress size={18} />;
    case 'Passing':
      return <StyledCheckIcon />;
    case 'Failing':
      return <StyledClearIcon />;
    default:
      return null;
  }
}

type TimelineProps = {
  commitCountDelta: CheckState,
  branchConflicts: [CheckState, MissingGitConfigs],
  buildStatus: CheckState
}

const TimelineComponent: React.FunctionComponent<TimelineProps> = props => {
  const classes = useStyles();
  const [commitCountDelta, setCommitCountDelta] = useState<CheckState>('Unchecked');
  const [branchConflicts, setBranchConflicts] = useState<[CheckState, MissingGitConfigs]>(['Unchecked', undefined]);
  const [buildStatus, setBuildStatus] = useState<CheckState>('Unchecked');

  useEffect(() => {
    setCommitCountDelta(props.commitCountDelta);
    setBranchConflicts(props.branchConflicts);
    setBuildStatus(props.buildStatus);
  }, [branchConflicts, buildStatus, commitCountDelta, props]);

  return (
    <MUILab.Timeline align='left' className={classes.timeline} >
      { commitCountDelta != 'Unchecked' ?
        <MUILab.TimelineItem className={classes.tl_item} >
          <MUILab.TimelineSeparator>
            {StatusIcon(props.commitCountDelta)}
            {branchConflicts[0] != 'Unchecked' ? <MUILab.TimelineConnector /> : null}
          </MUILab.TimelineSeparator>
          <MUILab.TimelineContent className={classes.tl_content} >
            <MUI.Typography>Checking branches for new commits...</MUI.Typography>

          </MUILab.TimelineContent>
        </MUILab.TimelineItem>
        : null
      }
      { branchConflicts[0] != 'Unchecked' ?
        <MUILab.TimelineItem className={classes.tl_item} >
          <MUILab.TimelineSeparator>
            {StatusIcon(props.branchConflicts[0])}
            {buildStatus != 'Unchecked' ? <MUILab.TimelineConnector /> : null}
          </MUILab.TimelineSeparator>
          <MUILab.TimelineContent className={classes.tl_content} >
            <MUI.Typography>Checking for merge conflicts...</MUI.Typography>
            {(branchConflicts[1] !== undefined) ?
              <MUI.Typography color='secondary' variant='body2'>
                Missing git-config: {JSON.stringify(branchConflicts[1])}
              </MUI.Typography> : null}
          </MUILab.TimelineContent>
        </MUILab.TimelineItem>
        : null
      }
      { buildStatus != 'Unchecked' ?
        <MUILab.TimelineItem className={classes.tl_item} >
          <MUILab.TimelineSeparator>
            {StatusIcon(props.buildStatus)}
          </MUILab.TimelineSeparator>
          <MUILab.TimelineContent className={classes.tl_content} >
            <MUI.Typography>Checking for build failures...</MUI.Typography>
          </MUILab.TimelineContent>
        </MUILab.TimelineItem>
        : null
      }
    </MUILab.Timeline>
  );
}

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
    <MUI.Dialog id='dialog' open={true} onClose={() => dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id })}>
      <div className={classes.root}>
        <div className={classes.section1}>
          <MUI.Grid container alignItems='center'>
            <MUI.Grid item xs>
              <MUI.Typography gutterBottom variant='h4'>
                Merge
            </MUI.Typography>
            </MUI.Grid>
            <MUI.Grid item>
            </MUI.Grid>
          </MUI.Grid>
          <MUI.Typography color='textSecondary' variant='body2'>
            Select the repository, base, and compare branches to merge.
        </MUI.Typography>
        </div>
        <MUI.Divider variant='middle' />
        <div className={classes.section2}>
          <MUI.FormControl variant='outlined' className={classes.formControl1}>
            <MUI.InputLabel id='repo-select-label'>Repository</MUI.InputLabel>
            <MUI.Select
              labelId='repo-select-label'
              id='repo-select'
              value={repo}
              onChange={repoChange}
              label='Repository'
            >
              <MUI.MenuItem value=''>
                <em>None</em>
              </MUI.MenuItem>
              {repos.map(repo => <MUI.MenuItem key={repo.id} value={repo.id}>{repo.name}</MUI.MenuItem>)}
            </MUI.Select>
          </MUI.FormControl>
          <MUI.FormControl variant='outlined' className={classes.formControl2}>
            <MUI.InputLabel id='base-branch-select-label'>Base</MUI.InputLabel>
            <MUI.Select
              labelId='base-branch-select-label'
              id='base-branch-select'
              value={base}
              onChange={baseChange}
              label='Base'
            >
              <MUI.MenuItem value=''>
                <em>None</em>
              </MUI.MenuItem>
              {repo ? repos.find(r => r.id === repo)?.local.map(opt => <MUI.MenuItem key={opt} value={opt}>{opt}</MUI.MenuItem>) : null}
            </MUI.Select>
          </MUI.FormControl>
          <MUI.FormControl variant='outlined' className={classes.formControl2}>
            <MUI.InputLabel id='compare-branch-select-label'>Compare</MUI.InputLabel>
            <MUI.Select
              labelId='compare-branch-select-label'
              id='compare-branch-select'
              value={compare}
              onChange={compareChange}
              label='Compare'
            >
              <MUI.MenuItem value=''>
                <em>None</em>
              </MUI.MenuItem>
              {repo ? repos.find(r => r.id === repo)?.local.map(opt => <MUI.MenuItem key={opt} value={opt}>{opt}</MUI.MenuItem>) : null}
            </MUI.Select>
          </MUI.FormControl>
          <TimelineComponent commitCountDelta={commitCountDelta} branchConflicts={branchConflicts} buildStatus={buildStatus} />

        </div>
        {(branchConflicts[1] && branchConflicts[1].length > 0) ? <MUI.Divider variant='middle' /> : null}
        <div className={classes.section2}>
          <GitConfigForm
            open={(branchConflicts[1] && branchConflicts[1].length > 0) ? true : false}
          />
        </div>
        <div className={classes.section2}>
          <MUI.Button variant='outlined' color='primary' className={classes.button} onClick={check}>Check</MUI.Button>
          <MUI.Button variant='outlined' color='primary' className={classes.button} onClick={branchCheck}>Check Branches</MUI.Button>
          <MUI.Button variant='outlined' color='primary' className={classes.button}>Merge</MUI.Button>
        </div>
      </div>
    </MUI.Dialog>
  );
}

export default MergeDialog;