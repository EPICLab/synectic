import {Close} from '@mui/icons-material';
import {IconButton, Snackbar} from '@mui/material';
import type {Notification as NotificationProps} from '@syn-types/modal';
import {Fragment} from 'react';
import {useAppDispatch} from '../../store/hooks';
import {modalRemoved} from '../../store/slices/modals';

const Notification = (props: NotificationProps) => {
  const dispatch = useAppDispatch();

  const handleClose = (_event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason !== 'clickaway') dispatch(modalRemoved(props.id));
  };

  const action = (
    <Fragment>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <Close fontSize="small" />
      </IconButton>
    </Fragment>
  );

  return (
    <Snackbar
      open={true}
      autoHideDuration={6000}
      sx={{whiteSpace: 'pre-line'}}
      onClose={handleClose}
      message={props.message}
      action={action}
    />
  );
};

export default Notification;
