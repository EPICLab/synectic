import React, { useCallback, useEffect, useState } from 'react';
import { createStyles, FormControl, makeStyles, MenuItem, Select, Theme, withStyles } from '@material-ui/core';
import InputBase from '@material-ui/core/InputBase';
import { RootState } from '../../store/store';
import { modalAdded, modalRemoved } from '../../store/slices/modals';
import { v4 } from 'uuid';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import { UUID } from '../../store/types';
import modalSelectors from '../../store/selectors/modals';
import { shallowEqual } from 'react-redux';

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

const GitGraphSelect = () => {
  const classes = useStyles();
  const dispatch = useAppDispatch();
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const graphs = useAppSelector((state: RootState) => modalSelectors.selectByType(state, 'GitGraph'), shallowEqual);
  const [repo, setRepo] = useState<UUID | undefined>(graphs.length > 0 ? graphs[0].target : undefined);

  const clear = useCallback(() => {
    setRepo(undefined);
    graphs.map(graph => dispatch(modalRemoved(graph.id)));
  }, [dispatch, graphs]);

  useEffect(() => {
    if (repo) {
      const match = repos.find(r => r.id === repo);
      if (match === undefined) clear();
    }
  }, [clear, repo, repos]);

  const handleSelection = async (event: React.ChangeEvent<{ value: UUID }>) => {
    clear();
    const selected = repos.find(r => r.id === event.target.value);
    if (selected) {
      setRepo(selected.id);
      dispatch(modalAdded({ id: v4(), type: 'GitGraph', target: selected.id }));
    }
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
          onChange={handleSelection}
          input={<StyledInput />}
        >
          <MenuItem key='' value='' className={classes.defaultItem}>{repo ? 'Clear Map' : 'Repository Map'}</MenuItem>
          {repos.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
        </Select>
      </FormControl>
    </div>
  );
}

export default GitGraphSelect;