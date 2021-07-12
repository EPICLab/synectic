import React from 'react';
import { useSelector } from 'react-redux';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import type { UUID } from '../types';
import { RootState } from '../store/root';
import { FormControl, InputLabel, MenuItem, Select } from '@material-ui/core';


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      width: '100%',
      maxWidth: 530,
      backgroundColor: theme.palette.background.paper,
    },
    formControl_lg: {
      margin: theme.spacing(1),
      minWidth: 496,
    },
    formControl_sm: {
      margin: theme.spacing(1),
      minWidth: 240,
    },
    formItem: {
      padding: 10,
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

type BaseBranchProps = {
  repo: UUID,
  base: string,
  setBase: React.Dispatch<React.SetStateAction<string>>;
}

const BaseBranchSelect: React.FunctionComponent<BaseBranchProps> = props => {
    const classes = useStyles();
    const repos = useSelector((state: RootState) => Object.values(state.repos));

    const baseChange = (event: React.ChangeEvent<{ value: unknown }>) => props.setBase(event.target.value as string);

    return (
      <FormControl variant='outlined' className={classes.formControl_sm} size='small'>
        <InputLabel id='base-branch-select-label'>Base</InputLabel>
          <Select
            labelId='base-branch-select-label'
            id='base-branch-select'
            value={props.base}
            onChange={baseChange}
            label='Base'
          >
          <MenuItem value='None' className={classes.formItem}>None</MenuItem>
            {props.repo ? repos.find(r => r.id === props.repo)?.local.map(opt =>
              <MenuItem key={opt} value={opt} className={classes.formItem}>{opt}</MenuItem>) : null
            }
          </Select>
      </FormControl>
    );
}

export default BaseBranchSelect;