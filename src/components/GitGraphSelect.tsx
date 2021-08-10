import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createStyles, FormControl, makeStyles, MenuItem, Select, Theme, withStyles } from '@material-ui/core';
import InputBase from '@material-ui/core/InputBase';

import { v4 } from 'uuid';
import type { Modal, Repository, UUID } from '../types';
import { RootState } from '../store/store';
import { addModal } from '../store/slices/modals';
import { ActionKeys } from '../store/actions';

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
  const repos = useSelector((state: RootState) => Object.values(state.repos));
  const [repo, setRepo] = useState<Repository>();
  const [modal, setModal] = useState<UUID>();
  const dispatch = useDispatch();
  const classes = useStyles();

  const repoChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const foundRepo = repos.find(r => r.id === event.target.value as UUID);
    const gitGraphModal: Modal = {
      id: v4(),
      type: 'GitGraph',
      target: foundRepo.id
    }
    if (foundRepo) {
      const addModalAction = addModal(gitGraphModal);
      setModal(addModalAction.payload.id); // track the modal UUID so that we can remove the modal later
      dispatch(addModalAction);
      setRepo(foundRepo); // update the select menu
    }
    if (!foundRepo && modal) {
      dispatch({ type: ActionKeys.REMOVE_MODAL, id: modal });
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
