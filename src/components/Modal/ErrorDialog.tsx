import React from 'react';
import { useDispatch } from 'react-redux';
import { Dialog, DialogTitle, Button, DialogContent, DialogContentText } from '@material-ui/core';
import { metafileRemoved } from '../../store/slices/metafiles';
import { Modal } from '../../store/slices/modals';

const ErrorDialog = (props: Modal) => {
  const dispatch = useDispatch();
  const message = props.options && props.options['message'] as string;

  const close = () => {
    dispatch(metafileRemoved(props.id))
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