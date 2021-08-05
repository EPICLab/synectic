import React from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogTitle, Button, DialogContent, DialogContentText } from '@material-ui/core';

import type { Modal } from '../types';
import { ActionKeys } from '../store/actions';

const ErrorDialog: React.FunctionComponent<Modal> = props => {
  const dispatch = useDispatch();
  const message = props.options && props.options['message'] as string;

  const close = () => {
    dispatch({ type: ActionKeys.REMOVE_MODAL, id: props.id })
  };

  return (
    <Dialog id='error-dialog' open={true} onClose={close} aria-labelledby='error-message-dialog'>
      <DialogTitle id='error-dialog-title'>{props.subtype}</DialogTitle>
      <DialogContent>
        <DialogContentText id='error-dialog-message'>{message}</DialogContentText>
      </DialogContent>
      <Button id='close-error-dialog' variant='contained' color='primary' onClick={close}>Okay...</Button>
    </Dialog>
  );
}

export default ErrorDialog;