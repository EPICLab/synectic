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

const RepoSelect: React.FunctionComponent<Modal> = props => {
    const classes = useStyles();
    const repos = useSelector((state: RootState) => Object.values(state.repos));
    const [repo, setRepo] = useState<UUID>('');
    const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

    const repoChange = (event: React.ChangeEvent<{ value: unknown }>) => setRepo(event.target.value as UUID);

    return (
        <Dialog id='dialog' open={true} onClose={() => dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id })}>
            <div className={classes.root}>
                <div className={classes.section2}>
                    <FormControl variant='outlined' className={classes.formControl_lg} size='small'>
                        <InputLabel id='repo-select-label'>Repository</InputLabel>
                        <Select
                            labelId='repo-select-label'
                            id='repo-select'
                            value={repo}
                            onChange={repoChange}
                            label='Repository'
                            input={<OutlinedInput margin='dense' />}
                        >
                            <MenuItem value='None' className={classes.formItem}>None</MenuItem>
                            {repos.map(repo => <MenuItem key={repo.id} value={repo.id} className={classes.formItem}>{repo.name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </div>
            </div>
        </Dialog> 
    );
}

export default RepoSelect;