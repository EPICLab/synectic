import { Close } from '@mui/icons-material';
import { IconButton, Snackbar } from '@mui/material';
import { Fragment, SyntheticEvent } from 'react';
import type { Notification } from 'types/modal';
import { useAppDispatch } from '../../store/hooks';
import { modalRemoved } from '../../store/slices/modals';

const Notification = (props: Notification) => {
  const dispatch = useAppDispatch();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleClose = (_event: Event | SyntheticEvent<any, Event>, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(modalRemoved(props.id));
  };

  const action = (
    <Fragment>
      <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
        <Close fontSize="small" />
      </IconButton>
    </Fragment>
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
