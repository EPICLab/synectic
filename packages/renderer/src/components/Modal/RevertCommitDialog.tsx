import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  styled,
} from '@mui/material';
import type {RevertCommitDialog as RevertCommitDialogModal} from '@syn-types/modal';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import {modalRemoved} from '../../store/slices/modals';
import {revertCommit} from '../../store/thunks/commits';

const RevertCommitDialog = ({modal}: {modal: RevertCommitDialogModal}) => {
  const dispatch = useAppDispatch();
  const repo = useAppSelector(state => repoSelectors.selectById(state, modal.repo));
  const branch = useAppSelector(state => branchSelectors.selectById(state, modal.branch));

  const handleClose = () => dispatch(modalRemoved(modal.id));

  const handleClick = async () => {
    if (repo) {
      const result = await dispatch(
        revertCommit({root: branch?.root ?? repo.root, oid: modal.commit.toString()}),
      ).unwrap();
      console.log(
        result
          ? `Deleted ${modal.commit.toString()} commit...`
          : `Unable to delete ${modal.commit.toString()} commit...`,
      );
    }
  };

  return (
    <StyledDialog
      open
      onClose={handleClose}
      aria-labelledby="revert-commit-dialog-title"
      aria-describedby="revert-commit-description"
    >
      <DialogTitle id="revert-commit-dialog-title">Revert Commit</DialogTitle>
      <DialogContent sx={{px: 2, pb: 1.5}}>
        <DialogContentText id="revert-commit-description">
          Are you sure you want to revert{' '}
          <Box
            component="span"
            fontWeight="fontWeightBold"
          >
            {branch?.scope}/{branch?.ref}
          </Box>{' '}
          branch to{' '}
          <Box
            component="span"
            fontWeight="fontWeightBold"
          >
            {modal.commit.toString().substring(0, 8) + '...'}
          </Box>{' '}
          commit?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          id="cancel-button"
          variant="contained"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          id="revert-commit-button"
          variant="contained"
          onClick={handleClick}
        >
          Revert
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    width: 400,
  },
}));

export default RevertCommitDialog;
