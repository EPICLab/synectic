import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, Typography } from '@material-ui/core';
import { branchLog } from '../../containers/git-plumbing';
import TimelineComponent from '../SourceControl/MergeTimeline';
import { RootState } from '../../store/store';
// import { build } from '../../containers/builds';
import GitConfigForm from '../SourceControl/GitConfigForm';
// import { merge as isomerge } from '../containers/git-porcelain';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { merge } from '../../containers/merges';
import { loadCard } from '../../store/thunks/handlers';
import { fetchConflicted, fetchMetafile } from '../../store/thunks/metafiles';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { checkProject } from '../../containers/conflicts';
import branchSelectors from '../../store/selectors/branches';
import { isDefined } from '../../containers/format';
import { UUID } from '../../store/types';
import BranchSelect from '../SourceControl/BranchSelect';
import RepoSelect from '../SourceControl/RepoSelect';

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

const MergeDialog = (props: Modal) => {
  const classes = useStyles();
  const repos = useAppSelector((state: RootState) => repoSelectors.selectEntities(state));
  const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
  const dispatch = useAppDispatch();
  const [selectedRepo, setSelectedRepo] = useState<UUID>(props.options && props.options['repo'] ? props.options['repo'] as UUID : '');
  const [selectedBase, setSelectedBase] = useState<UUID>(props.options && props.options['base'] ? props.options['base'] as UUID : '');
  const [selectedCompare, setSelectedCompare] = useState<UUID>(props.options && props.options['compare'] ? props.options['compare'] as UUID : '');

  const [commitCountDelta, setCommitCountDelta] = useState<CheckState>('Unchecked');
  const [branchConflicts, setBranchConflicts] = useState<[CheckState, MissingGitConfigs]>(['Unchecked', undefined]);
  // const [buildStatus, setBuildStatus] = useState<CheckState>('Unchecked');
  const repo = repos[selectedRepo];

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
  const mergeable = selectedRepo !== '' && selectedBase !== '' && selectedCompare !== '' && selectedBase !== selectedCompare;

  const check = async () => {
    const baseBranch = branches[selectedBase];
    const compareBranch = branches[selectedCompare];
    if (!baseBranch || !compareBranch) return;

    setCommitCountDelta('Running');
    setBranchConflicts(['Unchecked', undefined]);
    // setBuildStatus('Unchecked');

    if (!repo) {
      setCommitCountDelta('Unchecked');
      return;
    }
    // check to verify that new commits exist between the target branches
    const repoLog = repo ? (await branchLog(repo.root, baseBranch.ref, compareBranch.ref)) : undefined;
    const commitStatus = repoLog ? (repoLog.length > 0 ? 'Passing' : 'Failing') : 'Unchecked';
    setCommitCountDelta(commitStatus);

    if (commitStatus == 'Failing') return;
    setBranchConflicts(['Running', undefined]);

    // check for merge conflicts by running merge with dryRun option enabled (at least when using git-porcelain/merge)
    // >>>      const conflictCheck = await merge(fullRepo.root, base, compare, true);

    const mergeCheck = await merge(repo.root, baseBranch.ref, compareBranch.ref);
    const conflictStatus = (mergeCheck.mergeConflicts && mergeCheck.mergeConflicts.length > 0) ? 'Failing' : 'Passing';
    setBranchConflicts([conflictStatus, []]);

    if (conflictStatus == 'Failing') {
      const conflicts = await checkProject(repo.root);
      await dispatch(fetchConflicted(conflicts)); // updates version control status in Redux store
      const conflictManager = await dispatch(fetchMetafile({
        virtual: {
          id: v4(),
          modified: DateTime.local().valueOf(),
          name: `Conflicts`,
          handler: 'ConflictManager',
          repo: repo.id,
          path: repo.root,
          merging: { base: baseBranch.ref, compare: compareBranch.ref }
        }
      })).unwrap();
      if (conflictManager) await dispatch(loadCard({ metafile: conflictManager }));
      await delay(2500);
      dispatch(modalRemoved(props.id));
    }
    if (conflictStatus == 'Failing') return;
    // setBuildStatus('Running');

    // check for build failures by running build scripts from target project
    // const buildResults = await build(repo, baseBranch.ref);
    // console.log(`BUILD`, { buildResults });
    // const buildStatus = (buildResults.installCode === 0 && buildResults.buildCode === 0) ? 'Passing' : 'Failing';
    // setBuildStatus(buildStatus);
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
              <RepoSelect
                repos={Object.values(repos).filter(isDefined)}
                selectedRepo={selectedRepo}
                setSelectedRepo={setSelectedRepo}
              />
            </Grid>
            <Grid item xs={6}>
              <BranchSelect
                label='Base'
                repo={repo}
                selectedBranch={selectedBase}
                optionsFilter={b => b.id !== selectedCompare}
                setSelectedBranch={setSelectedBase}
              />
            </Grid>
            <Grid item xs={6}>
              <BranchSelect
                label='Compare'
                repo={repo}
                selectedBranch={selectedCompare}
                optionsFilter={b => b.id !== selectedBase}
                setSelectedBranch={setSelectedCompare}
              />
            </Grid>
          </Grid>
          <TimelineComponent commitCountDelta={commitCountDelta} branchConflicts={branchConflicts} />
        </div>
        {(branchConflicts[0] === 'Failing') ? <Divider variant='middle' /> : null}
        <div className={classes.section2}>
          <GitConfigForm
            root={repo?.root}
            open={(branchConflicts[1] && branchConflicts[1].length > 0) ? true : false}
          />
        </div>
        <div className={classes.section2}>
          {branchConflicts[0] === 'Passing' ?
            <Button
              variant='outlined'
              color='primary'
              className={classes.button}
              onClick={() => dispatch(modalRemoved(props.id))}>
              OK
            </Button> :
            <Button
              variant='outlined'
              color='primary'
              className={classes.button}
              disabled={!mergeable}
              onClick={check}>
              Merge
            </Button>}
        </div>
      </div>
    </Dialog>
  );
}

export default MergeDialog;