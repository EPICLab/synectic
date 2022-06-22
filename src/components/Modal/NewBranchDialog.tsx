import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, TextField, Typography } from '@material-ui/core';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { RootState } from '../../store/store';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
// import { createBranch } from '../../store/thunks/branches';
import { branch } from '../../containers/git-porcelain';
import { createBranch } from '../../store/thunks/branches';
import { repoUpdated } from '../../store/slices/repos';

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        newBranchDialog: {
            width: '100%',
            maxWidth: 530,
            backgroundColor: theme.palette.background.paper,
        },
        formControl1: {
            margin: theme.spacing(1),
            minWidth: 496
        },
        formControl2: {
            margin: theme.spacing(1),
            minWidth: 240,
        },
        button: {
            margin: theme.spacing(1),
        },
        timeline: {
            margin: theme.spacing(1),
            '& > :last-child .MuiTimelineItem-content': {
                height: 28
            }
        },
        tl_item: {
            padding: theme.spacing(0, 2),
            '&:before': {
                flex: 0,
                padding: theme.spacing(0)
            }
        },
        tl_content: {
            padding: theme.spacing(0.5, 1, 0),
        },
        section1: {
            margin: theme.spacing(3, 2, 1),
        },
        section2: {
            margin: theme.spacing(1, 1),
        },
        section3: {
            margin: theme.spacing(1, 1),
        },
    }),
);

const NewBranchDialog = (props: Modal) => {
    const styles = useStyles();
    const dispatch = useAppDispatch();
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.target ? props.target : ''));
    const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, repo, true));
    const [branchName, setBranchName] = React.useState('');
    const isNoneDuplicate = !branches?.find(b => b.ref === branchName);

    const isCreateReady = () => (branchName.length > 0 && isNoneDuplicate) ? true : false;
    const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) => setBranchName(event.target.value);
    const handleClose = () => dispatch(modalRemoved(props.id));
    const handleClick = async () => {
        if (repo) {
            const root = await branch({ dir: repo.root, url: repo.url, ref: branchName });
            const newBranch = await dispatch(createBranch({ root, branch: branchName, scope: 'local' })).unwrap();
            dispatch(repoUpdated({ ...repo, local: [...repo.local, newBranch.id] }));
        }
        handleClose();
    };
    const handleKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleClick();
        }
    }

    return (
        <Dialog id='new-branch-dialog' data-testid='new-branch-dialog' open={true} onClose={handleClose} aria-labelledby='new-branch-dialog'>
            <div className={styles.newBranchDialog}>
                <div className={styles.section1}>
                    <Grid container alignItems='center'>
                        <Grid item xs>
                            <Typography gutterBottom variant='h4'>
                                New Branch
                            </Typography>
                        </Grid>
                        <Grid item>
                        </Grid>
                    </Grid>
                    <Typography color='textSecondary' variant='body2'>
                        Provide a name for the new branch.
                    </Typography>
                </div>
                <Divider variant='middle' />
                <div className={styles.section2}>
                    <TextField
                        id='new-branch-name'
                        variant='outlined'
                        className={styles.formControl2}
                        label='Branch Name'
                        value={branchName}
                        onChange={handleBranchNameChange}
                        onKeyDown={(e) => handleKeyDown(e)}
                        error={branchName.length > 0 && !isNoneDuplicate}
                        helperText={(branchName.length > 0 && !isNoneDuplicate) ? 'Branch name already exists' : ''}
                    />
                </div>
                <div className={styles.section3}>
                    <Button id='create-branch-button'
                        className={styles.button}
                        data-testid='create-branch-button'
                        variant='outlined'
                        color='primary'
                        disabled={!isCreateReady()}
                        onClick={handleClick}
                    >Create Branch</Button>
                </div>
            </div>
        </Dialog>
    );
};

export default NewBranchDialog;