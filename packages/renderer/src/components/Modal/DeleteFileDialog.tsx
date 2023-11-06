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
import type {DeleteFileDialog as DeleteFileDialogModal} from '@syn-types/modal';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {modalRemoved} from '../../store/slices/modals';
import {deleteFile} from '/@/store/thunks/metafiles';
import metafileSelectors from '/@/store/selectors/metafiles';

const DeleteFileDialog = ({modal}: {modal: DeleteFileDialogModal}) => {
  const dispatch = useAppDispatch();
  const metafile = useAppSelector(state => metafileSelectors.selectById(state, modal.metafile));

  const handleClose = () => dispatch(modalRemoved(modal.id));
  const handleClick = async () => {
    if (metafile) {
      const result = await dispatch(deleteFile(metafile.id));
      console.log(
        result ? `Deleted ${metafile.name} file...` : `Unable to delete ${metafile.name} file...`,
      );
      if (result) handleClose();
    }
  };

  return (
    <StyledDialog
      open
      onClose={handleClose}
      aria-labelledby="delete-file-dialog-title"
      aria-describedby="delete-file-description"
    >
      <DialogTitle id="delete-file-dialog-title">Delete File</DialogTitle>
      <DialogContent sx={{px: 2, pb: 1.5}}>
        <DialogContentText id="delete-file-description">
          Are you sure you want to permanently delete the file{' '}
          <Box
            component="span"
            fontWeight="fontWeightBold"
          >
            {metafile?.name}
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
          id="delete-file-button"
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

export default DeleteFileDialog;
