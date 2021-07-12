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

type CompareBranchProps = {
  repo: UUID,
  compare: string,
  setCompare: React.Dispatch<React.SetStateAction<string>>;
}

const CompareBranchSelect: React.FunctionComponent<CompareBranchProps> = props => {
    const classes = useStyles();
    const repos = useSelector((state: RootState) => Object.values(state.repos));

    const compareChange = (event: React.ChangeEvent<{ value: unknown }>) => props.setCompare(event.target.value as string);

    return (
        <FormControl variant='outlined' className={classes.formControl_sm} size='small'>
          <InputLabel id='compare-branch-select-label'>Compare</InputLabel>
            <Select
              labelId='compare-branch-select-label'
              id='compare-branch-select'
              value={props.compare}
              onChange={compareChange}
              label='Compare'
            >
            <MenuItem value=''>
              <em>None</em>
            </MenuItem>
              {props.repo ? repos.find(r => r.id === props.repo)?.local.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>) : null}
          </Select>
      </FormControl>
    );
}

export default CompareBranchSelect;