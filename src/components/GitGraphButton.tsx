import { createStyles, FormControl, InputLabel, makeStyles, MenuItem, Select, Theme } from '@material-ui/core';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/root';
import { Repository, UUID } from '../types';
import { GitGraph } from './GitGraph';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '25ch',
    },
    formControl1: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.background.paper,
      position: 'absolute',
      top: '0',
      right: '0',
      width: '25ch'
    },
  }),
);

export const GitGraphButton: React.FunctionComponent = () => {
  const classes = useStyles();
  const repos = useSelector((state: RootState) => Object.values(state.repos));
  const [repo, setRepo] = useState<Repository>();

  const repoChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const foundRepo = repos.find(r => r.id === event.target.value as UUID);
    if (foundRepo) {
      console.log(`foundRepo: ${foundRepo.name}`);
      setRepo(foundRepo);
    }
  };

  return (
    <>
      <FormControl variant='filled' size='small' className={classes.formControl1}>
        <InputLabel id='repo-select-label'>Repository</InputLabel>
        <Select
          labelId='repo-select-label'
          id='repo-select'
          value={repo ? repo.id : ''}
          onChange={repoChange}
          label='Repository'
        >
          <MenuItem value=''>
            <em>None</em>
          </MenuItem>
          {repos.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
        </Select>
      </FormControl>
      { repo ?
        <GitGraph repo={repo} />
        : null
      }
    </>
  );
}