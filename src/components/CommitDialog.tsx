import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';

import type { Modal, UUID } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { modalRemoved } from '../store/slices/modals';
import { commit, getConfig, getRepoRoot } from '../containers/git-porcelain';
import { metafileSelectors } from '../store/selectors/metafiles';
import { RootState } from '../store/store';


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
            width: 450,
            marginRight: 10
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

const CommitDialog: React.FunctionComponent<Modal & { parent: UUID }> = props => {
    const classes = useStyles();
    const [message, setMessage] = useState('');
    const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.parent));
    const dispatch = useAppDispatch();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    }

    const initiateCommit = async () => {
        const dir = (metafile && metafile.path) ? await getRepoRoot(metafile.path) : undefined;
        if (dir) {
            const username = (await getConfig('user.name'));
            const email = await getConfig('user.email');

            const result = await commit({
                dir: dir, message: message, author: {
                    name: username.scope !== 'none' ? username.value : '',
                    email: email.scope !== 'none' ? email.value : ''
                }, dryRun: true
            });
            console.log(`commit result: ${result}`);
        }
    }

    return (
        <Dialog id='dialog' open={true} onClose={() => dispatch(modalRemoved(props.id))}>
            <div className={classes.root}>
                <div className={classes.section1}>
                    <Grid container alignItems='center'>
                        <Grid item xs>
                            <Typography gutterBottom variant='h4'>
                                Commit
                            </Typography>
                        </Grid>
                        <Grid item>
                        </Grid>
                    </Grid>
                    <Typography color='textSecondary' variant='body2'>
                        Enter a commit message.
                    </Typography>
                </div>
                <Divider variant='middle' />
                <div className={classes.section2}>
                    <Grid container alignItems='center' justifyContent='center' >
                        <Grid item xs={12} className={classes.input} >
                            <TextField id='commitMsg' label='Commit Message' onChange={handleChange}
                                variant='outlined' multiline rows={4} className={classes.textfield} />
                        </Grid>
                    </Grid>
                </div>
                <div className={classes.section2}>
                    <Button variant='outlined' color='primary' className={classes.button}
                        onClick={initiateCommit}>Commit</Button>
                </div>
            </div>
        </Dialog>
    );
}

export default CommitDialog;