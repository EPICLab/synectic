import React, { useEffect, useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';
import { ArrowDropDown, ArrowRight } from '@material-ui/icons';
import { TreeView } from '@material-ui/lab';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Modal, modalRemoved } from '../../store/slices/modals';

import metafileSelectors from '../../store/selectors/metafiles';
import { RootState } from '../../store/store';
import repoSelectors from '../../store/selectors/repos';
import { isFilebasedMetafile, isFileMetafile } from '../../store/slices/metafiles';
import { fetchBranches } from '../../store/thunks/branches';
import { repoUpdated } from '../../store/slices/repos';
import FileComponent from '../Explorer/FileComponent';
import { commit, getRoot } from '../../containers/git';
import { updateFilebasedMetafile, updateVersionedMetafile } from '../../store/thunks/metafiles';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        commitDialog: {
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

const CommitDialog = (props: Modal) => {
    const dispatch = useAppDispatch();
    const styles = useStyles();
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [staged]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(event.target.value);
    }

    const initiateCommit = async () => {
        const metafile = staged[0];
        const repo = (metafile && metafile.repo) ? repos.find(r => r.id === metafile.repo) : undefined;
        const dir = (metafile && metafile.path) ? await getRoot(metafile.path) : undefined;
        if (dir) {
            const result = await commit({ dir: dir, message: message });
            console.log(`commit result: ${result}`);
            if (metafile && isFilebasedMetafile(metafile)) {
                await dispatch(updateFilebasedMetafile(metafile));
                await dispatch(updateVersionedMetafile(metafile));
            }
            if (repo) {
                const branches = await dispatch(fetchBranches(repo.root)).unwrap();
                dispatch(repoUpdated({ ...repo, ...{ local: branches.local.map(b => b.id), remote: branches.remote.map(b => b.id) } }));
            }
        }
        dispatch(modalRemoved(props.id));
    }

    return (
        <Dialog id='dialog' open={true} onClose={() => dispatch(modalRemoved(props.id))}>
            <div className={styles.commitDialog}>
                <div className={styles.section1}>
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
                        {staged.filter(isFileMetafile).sort((a, b) => a.name.localeCompare(b.name))
                            .map(m => <FileComponent key={m.id} metafile={m.id} />)}
                    </TreeView>
                    <Typography color='textSecondary' variant='body2'>
                        Enter a commit message.
                    </Typography>
                </div>
                <Divider variant='middle' />
                <div className={styles.section2}>
                    <Grid container alignItems='center' justifyContent='center' >
                        <Grid item xs={12} className={styles.input} >
                            <TextField id='commitMsg' label='Commit Message' onChange={handleChange}
                                variant='outlined' multiline minRows={4} className={styles.textfield} />
                        </Grid>
                    </Grid>
                </div>
                <div className={styles.section2}>
                    <Button variant='outlined' color='primary' className={styles.button}
                        onClick={initiateCommit}>Commit</Button>
                </div>
            </div>
        </Dialog>
    );
}

export default CommitDialog;