import React from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogTitle, Button, DialogContent, DialogContentText } from '@material-ui/core';

import type { Error } from '../types';
import { ActionKeys } from '../store/actions';

const ErrorDialog: React.FunctionComponent<Error> = props => {
  const dispatch = useDispatch();

  const close = () => {
    dispatch({ type: ActionKeys.REMOVE_ERROR, id: props.id })
  };

  return (
    <Dialog id='error-dialog' open={true} onClose={close} aria-labelledby='error-message-dialog'>
      <DialogTitle id='error-dialog-title'>{props.type}</DialogTitle>
      <DialogContent>
        <DialogContentText id='error-dialog-message'>{props.message}</DialogContentText>
      </DialogContent>
      <Button id='close-error-dialog' variant='contained' color='primary' onClick={close}>Okay...</Button>
    </Dialog>
  );
}

export default ErrorDialog;