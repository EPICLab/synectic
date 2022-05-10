import React, { useState, useEffect } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';
import { useAppDispatch } from '../../store/hooks';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { extractRepoName, isValidRepositoryURL, resolveURL } from '../../containers/git-plumbing';
import { cloneDirectoryDialog } from '../../containers/dialogs';
import { cloneRepository } from '../../store/thunks/repos';
import { LinearProgressWithLabel, Status } from '../StatusIcon';
import { loadBranchVersions } from '../../containers/branch-tracker';

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
        section3: {
            display: 'inline-flex',
            padding: theme.spacing(0, 2),
            '&:before': {
                flex: 0,
                padding: theme.spacing(0)
            }
        },
        content: {
            padding: theme.spacing(0.5, 1, 0),
        },
    }),
);

const CloneDialog = (props: Modal) => {
    const classes = useStyles();
    const [url, setUrl] = useState('');
    const [invalid, setInvalid] = useState(true);
    const [targetPath, setTargetPath] = useState('');
    const [status, setStatus] = useState<Status>('Unchecked');
    const [progress, setProgress] = useState(0);
    const [log, setLog] = useState('');
    const dispatch = useAppDispatch();

    const getSubtext = () => {
        switch (status) {
            case 'Running':
                return log;
            case 'Passing':
                return `Clone completed from '${url}' to '${targetPath}'`;
            case 'Failing':
                return `Clone failed from '${url}' to '${targetPath}'`;
            default:
                return '';
        }
    }

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setInvalid(!isValidRepositoryURL(event.target.value));
        setUrl(resolveURL(event.target.value));
    }

    const getTargetPath = async () => {
        const path = await dispatch(cloneDirectoryDialog(extractRepoName(url))).unwrap();
        if (path) setTargetPath(path);
    }
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            getTargetPath();
        }
    }

    useEffect(() => {
        const initiateCloning = async () => {
            try {
                setStatus('Running');
                const repo = await dispatch(cloneRepository({
                    url: new URL(url),
                    root: targetPath,
                    onProgress: (progress) => {
                        setProgress(typeof progress.total === 'number' ? Math.round((progress.loaded / progress.total) * 100) : 0);
                        setLog(`${progress.phase}: ${progress.loaded}` + (progress.total ? `/${progress.total}` : ''))
                    }
                })).unwrap();
                if (!repo) throw new Error('Cloning failed');
                setStatus('Passing');
                await dispatch(loadBranchVersions());
                await delay(2000);
                dispatch(modalRemoved(props.id));
            } catch (error) {
                console.log(error);
                setStatus('Failing');
            }
        }
        if (targetPath !== '' && !invalid) initiateCloning();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                            <TextField
                                id='repoUrl'
                                label='Repository URL'
                                variant='outlined'
                                className={classes.textfield}
                                onChange={handleChange}
                                onKeyDown={(e) => handleKeyDown(e)}
                                error={invalid}
                                helperText={invalid ? 'Invalid repository URL.' : ''}
                            />
                        </Grid>
                    </Grid>
                </div>
                {(targetPath !== '' && !invalid) ?
                    <div className={classes.section2}>
                        <LinearProgressWithLabel value={progress} subtext={getSubtext()} />
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