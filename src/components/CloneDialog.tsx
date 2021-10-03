import React, { useState, useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';

import type { Modal } from '../types';
import { useAppDispatch } from '../store/hooks';
import { modalRemoved } from '../store/slices/modals';
import { extractRepoName, isValidRepositoryURL, resolveURL } from '../containers/git-plumbing';
import { cloneDirectoryDialog } from '../containers/dialogs';

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
            // flexGrow: 1,
            margin: theme.spacing(1, 1),
        },
    }),
);

const CloneDialog: React.FunctionComponent<Modal> = props => {
    const classes = useStyles();
    const [url, setUrl] = useState('');
    const [invalid, setInvalid] = useState(false);
    const [targetPath, setTargetPath] = useState('');
    const dispatch = useAppDispatch();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInvalid(!isValidRepositoryURL(event.target.value));
        setUrl(resolveURL(event.target.value));
    }

    const clone = async () => {
        const path: string | null = await dispatch(cloneDirectoryDialog(extractRepoName(url))).unwrap();
        if (path) setTargetPath(path);
    }

    useEffect(() => {
        if (targetPath !== '' && !invalid) {
            console.log(`cloning: ${url}\ninto: ${targetPath}`);
        }
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
                <div className={classes.section2}>
                    <Button variant='outlined' color='primary' className={classes.button}
                        onClick={clone} disabled={invalid}>Clone</Button>
                </div>
            </div>
        </Dialog>
    );
}

export default CloneDialog;