import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { createStyles, makeStyles, Theme, withStyles } from '@material-ui/core/styles';
import { Dialog, Button, Grid, Divider, Typography, FormControl, InputLabel, MenuItem, Select, CircularProgress } from '@material-ui/core';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent } from '@material-ui/lab';
import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import { green, red } from '@material-ui/core/colors';

import { Repository, UUID } from '../types';
import { RootState } from '../store/root';
import { branchLog, merge } from '../containers/git';
import { build } from '../containers/builds';

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
})(CircularProgress);

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
      "& > :last-child .MuiTimelineItem-content": {
        height: 28
      }
    },
    tl_item: {
      padding: theme.spacing(0, 2),
      "&:before": {
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
    section3: {
      margin: theme.spacing(1, 1),
    },
  }),
);

type CheckState =
  | 'Unchecked'
  | 'Running'
  | 'Passing'
  | 'Failing';

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
  branchConflicts: [CheckState, string[] | undefined],
  buildStatus: CheckState
}

const TimelineComponent: React.FunctionComponent<TimelineProps> = props => {
  const classes = useStyles();
  const [commitCountDelta, setCommitCountDelta] = useState<CheckState>('Unchecked');
  const [branchConflicts, setBranchConflicts] = useState<[CheckState, string[] | undefined]>(['Unchecked', undefined]);
  const [buildStatus, setBuildStatus] = useState<CheckState>('Unchecked');

  useEffect(() => {
    setCommitCountDelta(props.commitCountDelta);
    setBranchConflicts(props.branchConflicts);
    setBuildStatus(props.buildStatus);
  }, [branchConflicts, buildStatus, commitCountDelta, props]);

  return (
    <Timeline align='left' className={classes.timeline} >
      { commitCountDelta != 'Unchecked' ?
        <TimelineItem className={classes.tl_item} >
          <TimelineSeparator>
            {StatusIcon(props.commitCountDelta)}
            {branchConflicts[0] != 'Unchecked' ? <TimelineConnector /> : null}
          </TimelineSeparator>
          <TimelineContent className={classes.tl_content} >
            <Typography>Checking branches for new commits...</Typography>

          </TimelineContent>
        </TimelineItem>
        : null
      }
      { branchConflicts[0] != 'Unchecked' ?
        <TimelineItem className={classes.tl_item} >
          <TimelineSeparator>
            {StatusIcon(props.branchConflicts[0])}
            {buildStatus != 'Unchecked' ? <TimelineConnector /> : null}
          </TimelineSeparator>
          <TimelineContent className={classes.tl_content} >
            <Typography>Checking for merge conflicts...</Typography>
            {branchConflicts[0] === 'Failing' ? <Typography color='secondary' variant='body2'>Missing git-config: {JSON.stringify(branchConflicts[1])}</Typography> : null}
          </TimelineContent>
        </TimelineItem>
        : null
      }
      { buildStatus != 'Unchecked' ?
        <TimelineItem className={classes.tl_item} >
          <TimelineSeparator>
            {StatusIcon(props.buildStatus)}
          </TimelineSeparator>
          <TimelineContent className={classes.tl_content} >
            <Typography>Checking for build failures...</Typography>
          </TimelineContent>
        </TimelineItem>
        : null
      }
    </Timeline>
  );
}

type DialogProps = {
  open: boolean;
  repos: Repository[];
  onClose: () => void;
}

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const random = (): 'Passing' | 'Failing' => {
  const random = (Math.floor(Math.random() * 5) + 1) >= 3 ? true : false;
  return random ? 'Passing' : 'Failing';
}

const MergeDialog: React.FunctionComponent<DialogProps> = props => {
  const classes = useStyles();
  const [repo, setRepo] = useState<UUID>('');
  const [base, setBase] = useState<string>('');
  const [compare, setCompare] = useState<string>('');
  const [commitCountDelta, setCommitCountDelta] = useState<CheckState>('Unchecked');
  const [branchConflicts, setBranchConflicts] = useState<[CheckState, string[] | undefined]>(['Unchecked', undefined]);
  const [buildStatus, setBuildStatus] = useState<CheckState>('Unchecked');

  const repoChange = (event: React.ChangeEvent<{ value: unknown }>) => setRepo(event.target.value as UUID);
  const baseChange = (event: React.ChangeEvent<{ value: unknown }>) => setBase(event.target.value as string);
  const compareChange = (event: React.ChangeEvent<{ value: unknown }>) => setCompare(event.target.value as string);

  const branchCheck = async () => {
    const fullRepo = props.repos.find(r => r.id === repo);
    if (!fullRepo) return;
    const result = await merge(fullRepo.root, base, compare, true);
    console.log(`merge dryRun: ${base}...${compare}`);
    console.log(result);
  }

  const check = async () => {
    setCommitCountDelta('Running');
    setBranchConflicts(['Unchecked', undefined]);
    setBuildStatus('Unchecked');

    const fullRepo = props.repos.find(r => r.id === repo);
    if (!fullRepo) {
      setCommitCountDelta('Unchecked');
      return;
    }
    const repoLog = fullRepo ? (await branchLog(fullRepo.root, base, compare)) : undefined;
    const commitStatus = repoLog ? (repoLog.length > 0 ? 'Passing' : 'Failing') : 'Unchecked';
    setCommitCountDelta(commitStatus);

    if (commitStatus == 'Failing') return;
    setBranchConflicts(['Running', undefined]);

    // const conflictCheck = await merge(fullRepo.root, base, compare, true);
    // const conflictStatus = conflictCheck.mergeCommit ? 'Passing' : 'Failing';
    // setBranchConflicts([conflictStatus, conflictCheck.missingConfigs]);
    await sleep(2000);
    setBranchConflicts(['Passing', undefined]);

    // if (conflictStatus == 'Failing') return;
    setBuildStatus('Running');

    // await sleep(2000);
    const result = await build(fullRepo, base);
    console.log(result);
    setBuildStatus(random());
  }

  return (
    <Dialog id='dialog' open={props.open} onClose={() => props.onClose()}>
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
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {props.repos.map(repo => <MenuItem key={repo.id} value={repo.id}>{repo.name}</MenuItem>)}
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
              <MenuItem value=''>
                <em>None</em>
              </MenuItem>
              {repo ? props.repos.find(r => r.id === repo)?.local.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>) : null}
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
              {repo ? props.repos.find(r => r.id === repo)?.local.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>) : null}
            </Select>
          </FormControl>
          <TimelineComponent commitCountDelta={commitCountDelta} branchConflicts={branchConflicts} buildStatus={buildStatus} />
        </div>
        <div className={classes.section3}>
          <Button
            variant='outlined'
            color='primary'
            className={classes.button}
            onClick={check}
          >
            Check
          </Button>
          <Button
            variant='outlined'
            color='primary'
            className={classes.button}
            onClick={branchCheck}
          >
            Check Branches
          </Button>
          <Button
            variant='outlined'
            color='primary'
            className={classes.button}
          >
            Merge
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

const MergeButton: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);
  const repos = useSelector((state: RootState) => Object.values(state.repos));

  const handleClose = () => setOpen(!open);

  return (
    <>
      <Button id='diffpicker-button' variant='contained' color='primary' onClick={() => setOpen(!open)}>Merge...</Button>
      {open ? <MergeDialog open={open} onClose={handleClose} repos={repos} /> : null}
    </>
  );
}

export default MergeButton;