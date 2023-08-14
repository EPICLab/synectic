import React, { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { CommitDialog, modalRemoved } from '../../store/slices/modals';
import metafileSelectors from '../../store/selectors/metafiles';
import { isFileMetafile, VersionedMetafile } from '../../store/slices/metafiles';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField
} from '@mui/material';
import File from '../Explorer/File';
import { createCard } from '../../store/thunks/cards';
import { addCommit } from '../../store/thunks/commits';

const CommitDialog = ({ props }: { props: CommitDialog }) => {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('');
  const staged = useAppSelector(state =>
    metafileSelectors.selectStagedByRepo(state, props.repo, props.branch)
  );

  const handleClose = useCallback(() => dispatch(modalRemoved(props.id)), [dispatch, props.id]);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setMessage(event.target.value);
  const handleClick = async (metafile: VersionedMetafile) =>
    await dispatch(createCard({ path: metafile.path }));

  useEffect(() => {
    if (staged.length < 1) handleClose();
  }, [handleClose, props.id, staged]);

  const initiateCommit = async () => {
    const result = await dispatch(
      addCommit({ repoId: props.repo, branchId: props.branch, message: message })
    ).unwrap();
    console.log({ result });
    dispatch(modalRemoved(props.id));
  };

  return (
    <StyledDialog
      id="dialog"
      open={true}
      onClose={() => dispatch(modalRemoved(props.id))}
      aria-labelledby="commit-dialog-title"
      aria-describedby="commit-dialog-description"
    >
      <DialogTitle id="commit-dialog-title">Commit</DialogTitle>
      <DialogContent sx={{ px: 2, pb: 1.5 }}>
        <DialogContentText id="commit-dialog-description">
          Verify staged directories and files. Enter a commit message.
        </DialogContentText>
        <TableContainer component={Paper} sx={{ my: 2 }}>
          <Table size="small" aria-label="commit-dialog-staged">
            <TableBody>
              {staged
                .filter(isFileMetafile)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(metafile => (
                  <StyledTableRow key={`${metafile.id}`} onClick={() => handleClick(metafile)}>
                    <TableCell sx={{ p: 0 }}>
                      <File key={metafile.id} id={metafile.id} />
                    </TableCell>
                  </StyledTableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TextField
          id="commitMsg"
          label="Commit Message"
          onChange={handleChange}
          variant="filled"
          multiline
          minRows={4}
          sx={{ my: 1, width: '100%' }}
        />
      </DialogContent>
      <DialogActions>
        <Button id="cancel-button" variant="contained" onClick={handleClose}>
          Cancel
        </Button>
        <Button id="commit-button" variant="contained" onClick={initiateCommit}>
          Commit
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  color: theme.palette.text.secondary,
  '&:last-child td, &:last-child th': {
    border: 0
  }
}));

const StyledDialog = styled(Dialog)(() => ({
  '& .MuiDialog-paper': {
    width: 400
  }
}));

export default CommitDialog;
