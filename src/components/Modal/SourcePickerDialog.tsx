import React, { useState } from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import { Button, Dialog, Divider, Grid, Typography } from '@material-ui/core';
import { RootState } from '../../store/store';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import { Modal, modalRemoved } from '../../store/slices/modals';
import { createMetafile } from '../../store/thunks/metafiles';
import { DateTime } from 'luxon';
import { getBranchRoot } from '../../containers/git';
import branchSelectors from '../../store/selectors/branches';
import { isDefined, removeUndefinedProperties } from '../../containers/utils';
import { UUID } from '../../store/types';
import RepoSelect from '../RepoSelect';
import BranchSelect from '../Branches/BranchSelect';
import { buildCard } from '../../store/thunks/cards';

export const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    sourcePickerDialog: {
      width: '100%',
      maxWidth: 410,
      backgroundColor: theme.palette.background.paper,
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

const SourcePickerDialog = (props: Modal) => {
  const styles = useStyles();
  const repos = useAppSelector((state: RootState) => repoSelectors.selectEntities(state));
  const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
  const dispatch = useAppDispatch();
  const [selectedRepo, setSelectedRepo] = useState<UUID>('');
  const [selectedBranch, setSelectedBranch] = useState<UUID>('');
  const repo = repos[selectedRepo];
  const branch = branches[selectedBranch];

  const handleClose = () => dispatch(modalRemoved(props.id));

  const handleClick = async () => {
    const optionals = repo && branch && removeUndefinedProperties({ path: await getBranchRoot(repo.root, branch.ref) });
    const metafile = await dispatch(createMetafile({
      metafile: {
        name: 'Source Control',
        modified: DateTime.local().valueOf(),
        handler: 'SourceControl',
        filetype: 'Text',
        loading: [],
        repo: selectedRepo,
        branch: selectedBranch,
        ...optionals
      }
    })).unwrap();
    if (metafile) dispatch(buildCard({ metafile: metafile }));
    handleClose();
  }

  return (
    <Dialog id='source-dialog' data-testid='source-picker-dialog' role='dialog' open={true} onClose={() => handleClose()}>
      <div className={styles.sourcePickerDialog}>
        <div className={styles.section1}>
          <Grid container alignItems='center'>
            <Grid item xs>
              <Typography gutterBottom variant='h4'>
                Source Control
              </Typography>
            </Grid>
            <Grid item>
            </Grid>
          </Grid>
          <Typography color='textSecondary' variant='body2'>
            Select the repository and branch to view tracked changes.
          </Typography>
        </div>
        <Divider variant='middle' />
        <div className={styles.section2}>
          <RepoSelect repos={Object.values(repos).filter(isDefined)} selectedRepo={selectedRepo} setSelectedRepo={setSelectedRepo} />
          <BranchSelect label='Branch' repo={repo} selectedBranch={selectedBranch} setSelectedBranch={setSelectedBranch} />
        </div>
        <div className={styles.section2}>
          <Button id='create-source-control-button'
            data-testid='create-source-control-button'
            variant='outlined'
            color='primary'
            className={styles.button}
            disabled={selectedRepo === '' || selectedBranch === ''}
            onClick={() => handleClick()}
          >
            Open Source Control
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default SourcePickerDialog;