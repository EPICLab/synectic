import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import type { Modal, UUID } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { RootState } from '../store/root';
//import { build } from '../containers/builds';
//import { GitConfigForm } from './GitConfigForm';
//import { merge } from '../containers/git-porcelain';
//import { branchLog } from '../containers/git-plumbing';
import { Button, Dialog, Divider, FormControl, Grid, InputLabel, MenuItem, OutlinedInput, Select, Typography } from '@material-ui/core';
//import TimelineComponent from './MergeTimeline';
//import SimpleSelect from './SimpleSelect';

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

const BaseBranch: React.FunctionComponent<Modal> = props => {
    const classes = useStyles();
    const repos = useSelector((state: RootState) => Object.values(state.repos));
    const [repo, setRepo] = useState<UUID>('');
    const [base, setBase] = useState<string>('');
    const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

    const baseChange = (event: React.ChangeEvent<{ value: unknown }>) => setBase(event.target.value as string);

    return (
        <Dialog id='dialog' open={true} onClose={() => dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id })}>
            <div className={classes.root}>
                <div className={classes.section2}>
                    <FormControl variant='outlined' className={classes.formControl_sm} size='small'>
                        <InputLabel id='base-branch-select-label'>Base</InputLabel>
                        <Select
                            labelId='base-branch-select-label'
                            id='base-branch-select'
                            value={base}
                            onChange={baseChange}
                            label='Base'
                        >
                            <MenuItem value='None' className={classes.formItem}>None</MenuItem>
                            {repo ? repos.find(r => r.id === repo)?.local.map(opt =>
                                <MenuItem key={opt} value={opt} className={classes.formItem}>{opt}</MenuItem>) : null
                            }
                        </Select>
                    </FormControl>
                </div>
            </div>
        </Dialog>
    );
}

export default BaseBranch;