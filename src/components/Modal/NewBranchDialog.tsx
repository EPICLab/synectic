import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { NewBranchDialog, modalRemoved } from '../../store/slices/modals';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import { addBranch, updateBranches } from '../../store/thunks/branches';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  InputAdornment,
  OutlinedInput,
  Tooltip
} from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';
import { createCard } from '../../store/thunks/cards';

const NewBranchDialog = (props: NewBranchDialog) => {
  const dispatch = useAppDispatch();
  const repo = useAppSelector(state => repoSelectors.selectById(state, props.repo));
  const branches = useAppSelector(state =>
    branchSelectors.selectByRepo(state, repo?.id ?? '', true)
  );
  const [branchName, setBranchName] = React.useState('');
  const isNoneDuplicate = !branches?.find(b => b.ref === branchName);

  const isCreateReady = () => (branchName.length > 0 && isNoneDuplicate ? true : false);
  const handleBranchNameChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setBranchName(event.target.value);
  const handleClose = () => dispatch(modalRemoved(props.id));
  const handleClick = async () => {
    if (repo) {
      const branch = await dispatch(
        addBranch({ root: repo.root, ref: branchName, head: props.head.toString() })
      ).unwrap();
      await dispatch(updateBranches(repo));
      if (branch) await dispatch(createCard({ path: branch.root }));
    }
    handleClose();
  };
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <Dialog
      open
      onClose={handleClose}
      aria-labelledby="new-branch-dialog-title"
      aria-describedby="new-branch-dialog-description"
    >
      <DialogTitle id="new-branch-dialog-title">New Branch</DialogTitle>
      <DialogContent sx={{ px: 2, pb: 1.5 }}>
        <DialogContentText id="new-branch-description">
          Provide a name for the new branch.
        </DialogContentText>
        <Box sx={{ width: '100%' }}>
          <FormControl data-testid="new-card-filename-form" variant="outlined" sx={{ m: 1 }}>
            <OutlinedInput
              id="new-branch-filename"
              size="small"
              sx={{ width: 203 }}
              value={branchName}
              autoFocus
              onChange={handleBranchNameChange}
              onKeyDown={e => handleKeyDown(e)}
              error={branchName.length > 0 && !isNoneDuplicate}
              endAdornment={
                branchName.length > 0 && !isNoneDuplicate ? (
                  <InputAdornment position="end">
                    <Tooltip title="Branch name already exists">
                      <ErrorOutline sx={{ color: 'rgb(211, 47, 47)' }} />
                    </Tooltip>
                  </InputAdornment>
                ) : null
              }
            />
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button id="cancel-button" variant="contained" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          id="create-branch-button"
          variant="contained"
          disabled={!isCreateReady()}
          onClick={handleClick}
        >
          Create Branch
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewBranchDialog;
