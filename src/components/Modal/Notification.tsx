import { Close } from '@mui/icons-material';
import { IconButton, Snackbar } from '@mui/material';
import React from 'react';
import { useAppDispatch } from '../../store/hooks';
import { Notification, modalRemoved } from '../../store/slices/modals';

const Notification = (props: Notification) => {
  const dispatch = useAppDispatch();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClose = (_event: Event | React.SyntheticEvent<any, Event>, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(modalRemoved(props.id));
  };

  const action = (
    <React.Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
        <Close fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <div>
      <Snackbar
        open={true}
        autoHideDuration={6000}
        onClose={handleClose}
        message={props.message}
        action={action}
      />
    </div>
  );
};

export default Notification;
