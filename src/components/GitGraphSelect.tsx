import React, { useState } from 'react';
import { createStyles, FormControl, makeStyles, MenuItem, Select, Theme, withStyles } from '@material-ui/core';
import InputBase from '@material-ui/core/InputBase';

import type { Repository, UUID } from '../types';
import { RootState } from '../store/store';
import { modalAdded, modalRemoved } from '../store/slices/modals';
import { v4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectAllRepos } from '../store/selectors/repos';

const StyledInput = withStyles((theme: Theme) =>
  createStyles({
    input: {
      borderRadius: 4,
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
      border: '1px solid #ced4da',
      fontSize: 14,
      padding: '10px 26px 10px 12px',
      transition: theme.transitions.create(['border-color', 'box-shadow']),
      '&:focus': {
        borderRadius: 4,
        borderColor: '#80bdff',
        boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)',
      },
    },
  }),
)(InputBase);

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    margin: {
      margin: theme.spacing(1),
    },
    defaultItem: {
      color: 'rgba(125,125,125,1)',
    }
  }),
);

export const GitGraphSelect: React.FunctionComponent = () => {
  const repos = useAppSelector((state: RootState) => selectAllRepos.selectAll(state));
  const [repo, setRepo] = useState<Repository>();
  const [modal, setModal] = useState<UUID>();
  const dispatch = useAppDispatch();
  const classes = useStyles();

  const repoChange = async (event: React.ChangeEvent<{ value: unknown }>) => {
    const foundRepo = repos.find(r => r.id === event.target.value as UUID);
    if (foundRepo) {
      const modalId = v4();
      setModal(modalId); // track the modal UUID so that we can remove the modal later
      dispatch(modalAdded({ id: modalId, type: 'GitGraph', target: foundRepo.id }));
      setRepo(foundRepo); // update the select menu
    }
    if (!foundRepo && modal) {
      dispatch(modalRemoved(modal));
      setModal(undefined);
      setRepo(undefined);
    }
  };

  return (
    <div style={{ marginLeft: 'auto' }}>
      <FormControl className={classes.margin}>
        <Select
          labelId='repo-select-label'
          id='repo-select'
          value={repo ? repo.id : ''}
          displayEmpty
          onChange={repoChange}
          input={<StyledInput />}
        >
          <MenuItem key='' value='' className={classes.defaultItem}>Git Repository</MenuItem>
          {repos.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
        </Select>
      </FormControl>
    </div>
  );
}
