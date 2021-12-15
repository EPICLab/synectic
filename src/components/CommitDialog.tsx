import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';
import { ArrowDropDown, ArrowRight } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';
import type { Metafile, Modal } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { modalRemoved } from '../store/slices/modals';
import { commit, getConfig, getRepoRoot } from '../containers/git-porcelain';
import metafileSelectors from '../store/selectors/metafiles';
import { RootState } from '../store/store';
import repoSelectors from '../store/selectors/repos';
import { metafileUpdated } from '../store/slices/metafiles';
import { fetchContains, fetchContent, fetchVersionControl, isDirectoryMetafile, isFilebasedMetafile, isFileMetafile } from '../store/thunks/metafiles';
import { fetchRepoBranches } from '../store/thunks/repos';
import { repoUpdated } from '../store/slices/repos';
import { FileComponent } from './Explorer/FileComponent';

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

const CommitDialog: React.FunctionComponent<Modal> = props => {
    const dispatch = useAppDispatch();
    const classes = useStyles();
    const [message, setMessage] = useState('');
    const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectAll(state));
    const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
    const staged = metafiles.filter(m => {
        return props.options &&
            m.status &&
            m.repo === props.options['repo'] &&
            m.branch === props.options['branch'] &&
            ['added', 'modified', 'deleted'].includes(m.status);
    });

    useEffect(() => {
        if (staged.length < 1) dispatch(modalRemoved(props.id));
    }, [staged]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    }

    const update = async (metafile: Metafile) => {
        if (isFileMetafile(metafile)) {
            const contentAndState = await dispatch(fetchContent({ filepath: metafile.path })).unwrap();
            const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
            dispatch(metafileUpdated({ ...metafile, ...contentAndState, ...vcs }));
        }
    }

    const initiateCommit = async () => {
        const metafile = staged[0];
        const repo = (metafile && metafile.repo) ? repos.find(r => r.id === metafile.repo) : undefined;
        const dir = (metafile && metafile.path) ? await getRepoRoot(metafile.path) : undefined;
        if (dir) {
            const username = (await getConfig('user.name'));
            const email = await getConfig('user.email');

            const result = await commit({
                dir: dir, message: message, author: {
                    name: username.scope !== 'none' ? username.value : '',
                    email: email.scope !== 'none' ? email.value : ''
                }
            });
            console.log(`commit result: ${result}`);
            if (metafile && isFilebasedMetafile(metafile)) {
                const vcs = await dispatch(fetchVersionControl(metafile)).unwrap();
                const contentOrContains = await (isDirectoryMetafile(metafile) ?
                    dispatch(fetchContains(metafile.path)) :
                    dispatch(fetchContent({ filepath: metafile.path }))).unwrap();
                dispatch(metafileUpdated({
                    ...metafile,
                    ...contentOrContains,
                    ...vcs
                }))
            }
            if (repo) {
                const branches = await dispatch(fetchRepoBranches(repo.root)).unwrap();
                dispatch(repoUpdated({ ...repo, ...branches }));
            }
        }
        dispatch(modalRemoved(props.id));
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
                    <TreeView
                        defaultCollapseIcon={<ArrowDropDown />}
                        defaultExpandIcon={<ArrowRight />}
                        defaultEndIcon={<div style={{ width: 8 }} />}
                    >
                        {staged.filter(isFileMetafile).map(m => <FileComponent key={m.id} update={async () => await update(m)} {...m} />)}
                    </TreeView>
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