import React, { useEffect, useState } from 'react';
import { shallowEqual } from 'react-redux';
import { createStyles, FormControl, makeStyles, MenuItem, Select, Theme, withStyles } from '@material-ui/core';
import InputBase from '@material-ui/core/InputBase';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { v4 } from 'uuid';
import repoSelectors from '../../store/selectors/repos';
import modalSelectors from '../../store/selectors/modals';
import { Modal, modalAdded, modalRemoved } from '../../store/slices/modals';

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
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [selected, setSelected] = useState('');
  const graphs: Modal[] = useAppSelector((state: RootState) => modalSelectors.selectByType(state, 'GitGraph'), shallowEqual);
  const dispatch = useAppDispatch();
  const styles = useStyles();

  const handleChange = (event: React.ChangeEvent<{ value: string }>) => setSelected(event.target.value);

  useEffect(() => {
    if (graphs.length > 0) graphs.map(graph => dispatch(modalRemoved(graph.id)));
    const selectedRepo = repos.find(r => r.id === selected);
    if (selectedRepo) dispatch(modalAdded({ id: v4(), type: 'GitGraph', target: selected }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repos, selected]);

  return (
    <div style={{ marginLeft: 'auto' }}>
      <FormControl className={styles.margin}>
        <Select
          labelId='repo-select-label'
          id='repo-select'
          value={repos.find(r => r.id === selected) ? selected : ''}
          defaultValue=''
          displayEmpty
          disabled={repos.length === 0}
          onChange={handleChange}
          input={<StyledInput />}
        >
          <MenuItem key='' value='' className={styles.defaultItem}>{selected ? 'Clear Map' : 'Repository Map'}</MenuItem>
          {repos.map((repo) =>
            <MenuItem key={repo.id} value={repo.id}>
              {repo.name}
            </MenuItem>
          )}
        </Select>
      </FormControl>
    </div>
  );
}

export default GitGraphSelect;