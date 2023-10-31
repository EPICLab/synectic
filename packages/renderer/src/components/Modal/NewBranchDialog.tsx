import {ErrorOutline} from '@mui/icons-material';
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
  Tooltip,
} from '@mui/material';
import type {ChangeEvent, KeyboardEvent} from 'react';
import {useState} from 'react';
import type {NewBranchDialog as NewBranchDialogModal} from '@syn-types/modal';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import {modalRemoved} from '../../store/slices/modals';
import {addBranch, updateBranches} from '../../store/thunks/branches';
import {createCard} from '../../store/thunks/cards';

const NewBranchDialog = ({modal}: {modal: NewBranchDialogModal}) => {
  const dispatch = useAppDispatch();
  const repo = useAppSelector(state => repoSelectors.selectById(state, modal.repo));
  const branches = useAppSelector(state =>
    branchSelectors.selectByRepo(state, repo?.id ?? '', true),
  );
  const [branchName, setBranchName] = useState('');
  const isNoneDuplicate = !branches?.find(b => b.ref === branchName);

  const isCreateReady = () => (branchName.length > 0 && isNoneDuplicate ? true : false);
  const handleBranchNameChange = (event: ChangeEvent<HTMLInputElement>) =>
    setBranchName(event.target.value);
  const handleClose = () => dispatch(modalRemoved(modal.id));
  const handleClick = async () => {
    if (repo) {
      const branch = await dispatch(
        addBranch({root: repo.root, ref: branchName, head: modal.head.toString()}),
      ).unwrap();
      await dispatch(updateBranches(repo));
      if (branch) await dispatch(createCard({path: branch.root}));
    }
    handleClose();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
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
      <DialogContent sx={{px: 2, pb: 1.5}}>
        <DialogContentText id="new-branch-description">
          Provide a name for the new branch.
        </DialogContentText>
        <Box sx={{width: '100%'}}>
          <FormControl
            data-testid="new-card-filename-form"
            variant="outlined"
            sx={{m: 1}}
          >
            <OutlinedInput
              id="new-branch-filename"
              size="small"
              sx={{width: 203}}
              value={branchName}
              autoFocus
              onChange={handleBranchNameChange}
              onKeyDown={e => handleKeyDown(e)}
              error={branchName.length > 0 && !isNoneDuplicate}
              endAdornment={
                branchName.length > 0 && !isNoneDuplicate ? (
                  <InputAdornment position="end">
                    <Tooltip title="Branch name already exists">
                      <ErrorOutline sx={{color: 'rgb(211, 47, 47)'}} />
                    </Tooltip>
                  </InputAdornment>
                ) : null
              }
            />
          </FormControl>
        </Box>
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
