import React, { useState, useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';

import type { Modal } from '../types';
import { useAppDispatch } from '../store/hooks';
import { modalRemoved } from '../store/slices/modals';
import { extractRepoName, isGitRepo, isValidRepositoryURL, resolveURL } from '../containers/git-plumbing';
import { cloneDirectoryDialog } from '../containers/dialogs';
import { cloneRepository } from '../containers/repos';
import StatusIcon, { Status } from './StatusIcon';
import { loadBranchVersions } from '../containers/branch-tracker';


const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: '100%',
            maxWidth: 530,
            minWidth: 330,
            backgroundColor: theme.palette.background.paper,
        },
        input: {
            paddingLeft: 8
        },
        textfield: {
            width: 450
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

const CloneDialog: React.FunctionComponent<Modal> = props => {
    const classes = useStyles();
    const [url, setUrl] = useState('');
    const [invalid, setInvalid] = useState(false);
    const [targetPath, setTargetPath] = useState('');
    const [status, setStatus] = useState<Status>('Unchecked');
    const dispatch = useAppDispatch();

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInvalid(!isValidRepositoryURL(event.target.value));
        setUrl(resolveURL(event.target.value));
    }

    const getTargetPath = async () => {
        const path = await dispatch(cloneDirectoryDialog(extractRepoName(url))).unwrap();
        if (path) setTargetPath(path);
    }

    useEffect(() => {
        const initiateCloning = async () => {
            const existing = await isGitRepo(targetPath);
            if (!existing) {
                setStatus('Running');
                await dispatch(cloneRepository({ url: url, root: targetPath }));
                setStatus('Passing');
                await dispatch(loadBranchVersions());
                await delay(2000);
                dispatch(modalRemoved(props.id));
            } else {
                setStatus('Failing');
            }
        }

        if (targetPath !== '' && !invalid) initiateCloning();
    }, [targetPath]);

    return (
        <Dialog id='dialog' open={true} onClose={() => dispatch(modalRemoved(props.id))}>
            <div className={classes.root}>
                <div className={classes.section1}>
                    <Grid container alignItems='center'>
                        <Grid item xs>
                            <Typography gutterBottom variant='h4'>
                                Clone
                            </Typography>
                        </Grid>
                        <Grid item>
                        </Grid>
                    </Grid>
                    <Typography color='textSecondary' variant='body2'>
                        Enter a repository URL to clone.
                    </Typography>
                </div>
                <Divider variant='middle' />
                <div className={classes.section2}>
                    <Grid container alignItems='center' justifyContent='center' >
                        <Grid item xs={12} className={classes.input} >
                            <TextField id='repoUrl' label='Repository URL' variant='outlined' className={classes.textfield}
                                onChange={handleChange} error={invalid} helperText={invalid ? 'Invalid repository URL.' : ''} />
                        </Grid>
                    </Grid>
                </div>
                {(targetPath !== '' && !invalid) ?
                    <div className={classes.section1}>
                        <StatusIcon status={status} />
                        <Typography color='textSecondary' variant='body2'>
                            {status === 'Passing' ? `Clone completed from '${url}' to '${targetPath}'` : null}
                            {status === 'Failing' ? `Existing repository at ${targetPath}` : null}
                        </Typography>
                    </div>
                    : null}
                <div className={classes.section2}>
                    <Button variant='outlined' color='primary' className={classes.button}
                        onClick={getTargetPath} disabled={invalid}>Clone</Button>
                </div>
            </div>
        </Dialog>
    );
}

export default CloneDialog;