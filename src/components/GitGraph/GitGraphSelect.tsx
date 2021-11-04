import React, { useState, useEffect } from 'react';
import { createStyles, FormControl, makeStyles, MenuItem, Select, Theme, withStyles } from '@material-ui/core';
import InputBase from '@material-ui/core/InputBase';
import type { Repository, UUID } from '../../types';
import { RootState } from '../../store/store';
import { modalAdded, modalRemoved } from '../../store/slices/modals';
import { v4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';

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
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo, setRepo] = useState<UUID>();
  const [graph, setGraph] = useState<UUID>();
  const dispatch = useAppDispatch();
  const classes = useStyles();

  /** if Clear Cache is called while a repo is selected, the Select component goes throws the following:
   
    Material-UI: You have provided an out-of-range value `b48f6199-3b49-4255-bcef-abd0754d553b` for the select component.
    Consider providing a value that matches one of the available options or ''.
    The available values are ``.
   */

  useEffect(() => {
    clearMap();
  }, [repos]);

  const updateMap = (selected: Repository) => {
    const id = v4();
    setGraph(id); // track the modal UUID so that we can remove the graph later
    dispatch(modalAdded({ id: id, type: 'GitGraph', target: selected.id }));
    setRepo(selected.id); // update the select menu
  }

  const clearMap = () => {
    if (graph) dispatch(modalRemoved(graph));
    setGraph(undefined);
    setRepo('');
  }

  const repoChange = async (event: React.ChangeEvent<{ value: UUID }>) => {
    const selected = repos.find(r => r.id === event.target.value);
    selected ? updateMap(selected) : clearMap();
  };

  return (
    <div style={{ marginLeft: 'auto' }}>
      <FormControl className={classes.margin}>
        <Select
          labelId='repo-select-label'
          id='repo-select'
          value={repo ? repo : ''}
          displayEmpty
          disabled={repos.length === 0}
          defaultValue=''
          onChange={repoChange}
          input={<StyledInput />}
        >
          <MenuItem key='' value='' className={classes.defaultItem}>Repository Map</MenuItem>
          {repos.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
        </Select>
      </FormControl>
    </div>
  );
}
