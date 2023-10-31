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
import type {DeleteBranchDialog as DeleteBranchDialogModal} from '@syn-types/modal';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import {modalRemoved} from '../../store/slices/modals';
import {removeBranch} from '../../store/thunks/branches';

const DeleteBranchDialog = ({modal}: {modal: DeleteBranchDialogModal}) => {
  const dispatch = useAppDispatch();
  const repo = useAppSelector(state => repoSelectors.selectById(state, modal.repo));
  const branch = useAppSelector(state => branchSelectors.selectById(state, modal.branch));

  const handleClose = () => dispatch(modalRemoved(modal.id));
  const handleClick = async () => {
    if (repo && branch) {
      const result = await dispatch(removeBranch({repoId: repo.id, branchId: branch.id})).unwrap();
      console.log(
        result
          ? `Deleted ${branch.scope}/${branch.ref} branch...`
          : `Unable to delete ${branch.scope}/${branch.ref} branch...`,
      );
    }
  };

  return (
    <StyledDialog
      open
      onClose={handleClose}
      aria-labelledby="delete-branch-dialog-title"
      aria-describedby="delete-branch-description"
    >
      <DialogTitle id="delete-branch-dialog-title">Delete Branch</DialogTitle>
      <DialogContent sx={{px: 2, pb: 1.5}}>
        <DialogContentText id="delete-branch-description">
          Are you sure you want to permanently delete the branch{' '}
          <Box
            component="span"
            fontWeight="fontWeightBold"
          >
            {branch?.scope}/{branch?.ref}
          </Box>{' '}
          ?
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
          id="delete-branch-button"
          variant="contained"
          onClick={handleClick}
        >
          Delete
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

export default DeleteBranchDialog;
