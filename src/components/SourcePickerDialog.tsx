import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@material-ui/core';

import type { Modal, UUID } from '../types';
import { RootState } from '../store/store';
import { getMetafile } from '../containers/metafiles';
import { loadCard } from '../containers/handlers';
import { getBranchRoot } from '../containers/git-porcelain';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { repoSelectors } from '../store/selectors/repos';
import { modalRemoved } from '../store/slices/modals';

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
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const dispatch = useAppDispatch();
  const [selectedRepo, setSelectedRepo] = useState<UUID>('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const handleClose = () => dispatch(modalRemoved(props.id));

  const handleClick = async () => {
    const repo = repos.find(r => r.id === selectedRepo);
    const branchRoot = repo ? await getBranchRoot(repo, selectedBranch) : '';
    const metafile = await dispatch(getMetafile({
      virtual: {
        name: 'Source Control',
        handler: 'SourceControl',
        repo: selectedRepo,
        branch: selectedBranch,
        path: branchRoot ? branchRoot : ''
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
          <FormControl variant='outlined' className={classes.formControl}
            id='form-control-repo' aria-label='Repo Selection'>
            <InputLabel id='source-repo-select-label'>Repository</InputLabel>
            <Select
              labelId='source-repo-select-label'
              id='source-select-repo'
              value={selectedRepo}
              autoWidth={true}
              onChange={(e) => setSelectedRepo(e.target.value as UUID)}
              label='Repository'
            >
              <MenuItem value=''><em>None</em></MenuItem>
              {Object.values(repos).map(repo => (
                <MenuItem key={repo.id} value={repo.id}>{repo.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl variant='outlined' className={classes.formControl}
            id='form-control-branch' aria-label='Branch Selection'>
            <InputLabel id='source-branch-select-label'>Branch</InputLabel>
            <Select
              labelId='source-branch-select-label'
              id='source-select-branch'
              value={selectedBranch}
              autoWidth={true}
              onChange={(e) => setSelectedBranch(e.target.value as string)}
              label='Branch'
            >
              {selectedRepo ? repos.find(r => r.id === selectedRepo)?.local.map(branch =>
                <MenuItem key={branch} value={branch}>{branch}</MenuItem>)
                : <MenuItem value=''><em>None</em></MenuItem>
              }
            </Select>
          </FormControl>
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

export default SourcePickerDialog;