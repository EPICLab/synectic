import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, Typography } from '@material-ui/core';
import type { Modal, UUID } from '../../types';
import { branchLog } from '../../containers/git-plumbing';
import TimelineComponent from './MergeTimeline';
import DropSelect from '../DropSelect';
import { RootState } from '../../store/store';
import { build } from '../../containers/builds';
import { GitConfigForm } from '../GitConfigForm';
// import { merge as isomerge } from '../containers/git-porcelain';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import { modalRemoved } from '../../store/slices/modals';
import { merge } from '../../containers/merges';
import { loadCard } from '../../store/thunks/handlers';
import { fetchConflicted, fetchMetafile } from '../../store/thunks/metafiles';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { checkProject } from '../../containers/conflicts';
import branchSelectors from '../../store/selectors/branches';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 530,
      backgroundColor: theme.palette.background.paper,
    },
    button: {
      margin: theme.spacing(1),
    },
    section1: {
      margin: theme.spacing(3, 2, 1),
    },
    section2: {
      // flexGrow: 1,
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
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo, setRepo] = useState<UUID>('');
  const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
  const [base, setBase] = useState<UUID>('');
  const [compare, setCompare] = useState<UUID>('');
  const [commitCountDelta, setCommitCountDelta] = useState<CheckState>('Unchecked');
  const [branchConflicts, setBranchConflicts] = useState<[CheckState, MissingGitConfigs]>(['Unchecked', undefined]);
  const [buildStatus, setBuildStatus] = useState<CheckState>('Unchecked');
  const dispatch = useAppDispatch();

  const repoOptions = repos.map(r => ({ key: r.id, value: r.name }));
  const selectedRepo = repos.find(r => r.id === repo);
  const branchOptions = selectedRepo ? selectedRepo.local.reduce((accumulator: { key: UUID, value: string }[], branchId) => {
    const branch = branches[branchId];
    return branch ? (accumulator.push({ key: branch.id, value: branch.ref }), accumulator) : accumulator;
  }, []) : [];

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const mergeable = repo !== '' && base !== '' && compare !== '' && base !== compare;

  // const branchCheck = async () => {
  //   const fullRepo = repos.find(r => r.id === repo);
  //   if (!fullRepo) return;
  //   const result = await isomerge(fullRepo.root, base, compare, true);
  //   console.log(`merge dryRun: ${base}...${compare}`);
  //   console.log(result);
  // }

  const check = async () => {
    const baseBranch = branches[base];
    const compareBranch = branches[compare];
    if (!baseBranch || !compareBranch) return;

    console.log(`<<MERGE CHECK>>\nbase: ${baseBranch.ref} => compare: ${compareBranch.ref}`);
    setCommitCountDelta('Running');
    setBranchConflicts(['Unchecked', undefined]);
    setBuildStatus('Unchecked');

    const fullRepo = repos.find(r => r.id === repo);
    if (!fullRepo) {
      setCommitCountDelta('Unchecked');
      return;
    }
    // check to verify that new commits exist between the target branches
    const repoLog = fullRepo ? (await branchLog(fullRepo.root, baseBranch.ref, compareBranch.ref)) : undefined;
    const commitStatus = repoLog ? (repoLog.length > 0 ? 'Passing' : 'Failing') : 'Unchecked';
    setCommitCountDelta(commitStatus);

    if (commitStatus == 'Failing') return;
    setBranchConflicts(['Running', undefined]);

    // check for merge conflicts by running merge with dryRun option enabled (at least when using git-porcelain/merge)
    // >>>      const conflictCheck = await merge(fullRepo.root, base, compare, true);

    const mergeCheck = await merge(fullRepo.root, baseBranch.ref, compareBranch.ref);
    const conflictStatus = mergeCheck.mergeConflicts ? 'Failing' : 'Passing';
    setBranchConflicts([conflictStatus, []]);

    if (conflictStatus == 'Failing') {
      const conflicts = await checkProject(fullRepo.root);
      await dispatch(fetchConflicted(conflicts)); // updates version control status in Redux store
      const conflictManager = await dispatch(fetchMetafile({
        virtual: {
          id: v4(),
          modified: DateTime.local().valueOf(),
          name: `Conflicts`,
          handler: 'ConflictManager',
          repo: fullRepo.id,
          path: fullRepo.root,
          merging: { base: baseBranch.ref, compare: compareBranch.ref }
        }
      })).unwrap();
      if (conflictManager) await dispatch(loadCard({ metafile: conflictManager }));
      await delay(3000);
      dispatch(modalRemoved(props.id));
    }
    if (conflictStatus == 'Failing') return;
    setBuildStatus('Running');

    // check for build failures by running build scripts from target project
    const buildResults = await build(fullRepo, baseBranch.ref, compareBranch.ref);
    const buildStatus = (buildResults.installCode === 0 && buildResults.buildCode === 0) ? 'Passing' : 'Failing';
    setBuildStatus(buildStatus);
  }

  return (
    <Dialog id='dialog' open={true} onClose={() => dispatch(modalRemoved(props.id))}>
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
              <DropSelect label='Repo' target={repo} setTarget={setRepo} options={repoOptions} />
            </Grid>
            <Grid item xs={6}>
              <DropSelect label='Base' target={base} setTarget={setBase} options={branchOptions} />
            </Grid>
            <Grid item xs={6}>
              <DropSelect label='Compare' target={compare} setTarget={setCompare} options={branchOptions} />
            </Grid>
          </Grid>
          <TimelineComponent commitCountDelta={commitCountDelta} branchConflicts={branchConflicts} buildStatus={buildStatus} />
        </div>
        {(branchConflicts[0] === 'Failing') ? <Divider variant='middle' /> : null}
        <div className={classes.section2}>
          <GitConfigForm
            root={repos.find(r => r.id === repo)?.root}
            open={(branchConflicts[1] && branchConflicts[1].length > 0) ? true : false}
          />
        </div>
        <div className={classes.section2}>
          <Button
            variant='outlined'
            color='primary'
            className={classes.button}
            disabled={!mergeable}
            onClick={check}>
            Merge
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default MergeDialog;