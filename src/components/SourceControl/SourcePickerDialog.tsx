import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, FormControl, Grid, InputLabel, MenuItem, Select, Typography } from '@material-ui/core';

import type { Modal, UUID } from '../../types';
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
  const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
  const dispatch = useAppDispatch();
  const [selectedRepo, setSelectedRepo] = useState<UUID>('');
  const [selectedBranch, setSelectedBranch] = useState<UUID>('');

  const handleClose = () => dispatch(modalRemoved(props.id));

  const handleClick = async () => {
    const repo = repos.find(r => r.id === selectedRepo);
    const branch = branches[selectedBranch];
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
              {selectedRepo ? repos.find(r => r.id === selectedRepo)?.local
                .map(branchId => branches[branchId])
                .filter(isDefined)
                .map(branch =>
                  <MenuItem key={branch.id} value={branch.id}>{branch.ref}</MenuItem>)
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