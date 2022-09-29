import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import React, { useEffect, useState } from 'react';
import { cloneDirectoryDialog } from '../../containers/dialogs';
import { cloneRepo, extractRepoName, isValidRepositoryURL, resolveURL } from '../../containers/git';
import { useAppDispatch } from '../../store/hooks';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { addBranchCard } from '../../store/thunks/cards';
import { buildRepo } from '../../store/thunks/repos';
import { LinearProgressWithLabel, Status } from '../Status';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        cloneDialog: {
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
    const styles = useStyles();
    const [url, setUrl] = useState('');
    const [invalid, setInvalid] = useState(true);
    const [targetPath, setTargetPath] = useState('');
    const [status, setStatus] = useState<Status>('Unchecked');
    const [progress, setProgress] = useState(0);
    const dispatch = useAppDispatch();

    const getSubtext = () => {
        switch (status) {
            case 'Running':
                return `Cloning '${url}' to '${targetPath}'`;
            case 'Passing':
                return `Clone completed from '${url}' to '${targetPath}'`;
            case 'Failing':
                return `Clone failed from '${url}' to '${targetPath}'`;
            default:
                return '';
        }
    }

    const handleClose = (): void => {
        if (status !== 'Running') dispatch(modalRemoved(props.id));
        else console.log(`Cannot close dialog while cloning is running...`);
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
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
                setProgress(0);
                const cloned = await cloneRepo({ dir: targetPath, repo: new URL(url) });
                if (!cloned) throw new Error('Cloning failed');
                await dispatch(buildRepo(targetPath)).unwrap();
                setStatus('Passing');
                setProgress(100);
                await dispatch(addBranchCard());
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
        <Dialog id='dialog' open={true}
            onClose={handleClose}>
            <div className={styles.cloneDialog}>
                <div className={styles.section1}>
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
                <div className={styles.section2}>
                    <Grid container alignItems='center' justifyContent='center' >
                        <Grid item xs={12} className={styles.input} >
                            <TextField
                                id='repoUrl'
                                label='Repository URL'
                                variant='outlined'
                                className={styles.textfield}
                                onChange={handleChange}
                                onKeyDown={(e) => handleKeyDown(e)}
                                error={invalid}
                                helperText={invalid ? 'Invalid repository URL.' : ''}
                            />
                        </Grid>
                    </Grid>
                </div>
                {(targetPath !== '' && !invalid) ?
                    <div className={styles.section2}>
                        <LinearProgressWithLabel value={progress} subtext={getSubtext()} />
                    </div>
                    : null}
                <div className={styles.section2}>
                    <Button variant='outlined' color='primary' className={styles.button}
                        onClick={getTargetPath} disabled={invalid}>Clone</Button>
                </div>
            </div>
        </Dialog>
    );
}

export default CloneDialog;