import React, { Dispatch, SetStateAction, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@material-ui/core';

import type { Modal, Repository, UUID } from '../../types';
import { RootState } from '../../store/store';
import { loadCard } from '../../store/thunks/handlers';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import { modalRemoved } from '../../store/slices/modals';
import { fetchMetafile } from '../../store/thunks/metafiles';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';
import { getBranchRoot } from '../../containers/git-path';
import branchSelectors from '../../store/selectors/branches';
import { isDefined, removeUndefinedProperties } from '../../containers/format';

const emptyRepo: Repository = {
  id: '',
  name: '',
  root: '',
  corsProxy: '',
  url: '',
  default: '',
  local: [],
  remote: [],
  oauth: 'github',
  username: '',
  password: '',
  token: ''
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 410,
      backgroundColor: theme.palette.background.paper,
    },
    formControl: {
      margin: theme.spacing(1),
      width: `calc(100% - ${theme.spacing(2)}px)`,
      minWidth: 320
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

const SourcePickerDialog: React.FunctionComponent<Modal> = props => {
  const classes = useStyles();
  const repos = useAppSelector((state: RootState) => repoSelectors.selectEntities(state));
  const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
  const dispatch = useAppDispatch();
  const [selectedRepo, setSelectedRepo] = useState<UUID>('');
  const [selectedBranch, setSelectedBranch] = useState<UUID>('');
  const repo = repos[selectedRepo];
  const branch = branches[selectedBranch];

  const handleClose = () => dispatch(modalRemoved(props.id));

  const handleClick = async () => {
    const optionals = repo && branch && removeUndefinedProperties({ path: await getBranchRoot(repo.root, branch.ref) });
    const metafile = await dispatch(fetchMetafile({
      virtual: {
        id: v4(),
        modified: DateTime.local().valueOf(),
        name: 'Source Control',
        handler: 'SourceControl',
        repo: selectedRepo,
        branch: selectedBranch,
        ...optionals
      }
    })).unwrap();
    if (metafile) dispatch(loadCard({ metafile: metafile }));
    handleClose();
  }

  return (
    <Dialog id='source-dialog' data-testid='source-picker-dialog' role='dialog' open={true} onClose={() => handleClose()}>
      <div className={classes.root}>
        <div className={classes.section1}>
          <Grid container alignItems='center'>
            <Grid item xs>
              <Typography gutterBottom variant='h4'>
                Source Control
              </Typography>
            </Grid>
            <Grid item>
            </Grid>
          </Grid>
          <Typography color='textSecondary' variant='body2'>
            Select the repository and branch to view tracked changes.
          </Typography>
        </div>
        <Divider variant='middle' />
        <div className={classes.section2}>
          <RepoSelect repos={Object.values(repos).filter(isDefined)} selectedRepo={selectedRepo} setSelectedRepo={setSelectedRepo} />
          <BranchSelect repo={repo} selectedBranch={selectedBranch} setSelectedBranch={setSelectedBranch} />
        </div>
        <div className={classes.section2}>
          <Button id='create-source-control-button'
            data-testid='create-source-control-button'
            variant='outlined'
            color='primary'
            className={classes.button}
            disabled={selectedRepo === '' || selectedBranch === ''}
            onClick={() => handleClick()}
          >
            Open Source Control
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

const RepoSelect: React.FunctionComponent<{ repos: Repository[], selectedRepo: UUID, setSelectedRepo: Dispatch<SetStateAction<UUID>> }> = props => {
  const classes = useStyles();

  return (
    <FormControl variant='outlined' className={classes.formControl}
      id='form-control-repo' aria-label='Repo Selection'>
      <InputLabel id='source-repo-select-label'>Repository</InputLabel>
      <Select
        labelId='source-repo-select-label'
        id='source-select-repo'
        value={props.selectedRepo}
        autoWidth={true}
        onChange={(e) => props.setSelectedRepo(e.target.value as UUID)}
        label='Repository'
      >
        <MenuItem value=''><em>None</em></MenuItem>
        {props.repos.map(repo => (
          <MenuItem key={repo.id} value={repo.id}>{repo.name}</MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

const BranchSelect: React.FunctionComponent<{ repo: Repository | undefined, selectedBranch: UUID, setSelectedBranch: Dispatch<SetStateAction<UUID>> }> = props => {
  const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, props.repo ? props.repo : emptyRepo, true));
  const classes = useStyles();

  return (
    <FormControl variant='outlined' className={classes.formControl}
      id='form-control-branch' aria-label='Branch Selection'>
      <InputLabel id='source-branch-select-label'>Branch</InputLabel>
      <Select
        labelId='source-branch-select-label'
        id='source-select-branch'
        value={props.selectedBranch}
        autoWidth={true}
        onChange={(e) => props.setSelectedBranch(e.target.value as string)}
        label='Branch'
      >
        {props.repo ?
          branches.map(branch => <MenuItem key={branch.id} value={branch.id}>{branch.ref}</MenuItem>)
          : <MenuItem value=''><em>None</em></MenuItem>
        }
      </Select>
    </FormControl>
  );
}

export default SourcePickerDialog;