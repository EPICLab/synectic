import React from 'react';
import { Dialog, DialogTitle, TextField, Button } from '@material-ui/core';
import { useDispatch } from 'react-redux';
import { Error } from '../types';
import { ActionKeys } from '../store/actions';

const ErrorDialog: React.FunctionComponent<Error> = props => {
  const dispatch = useDispatch();

  const close = () => {
    dispatch({ type: ActionKeys.REMOVE_ERROR, id: props.id })
  };

  return (
    <Dialog id='error-dialog' open={true} onClose={close} aria-labelledby='error-message-dialog'>
      <DialogTitle id='error-dialog-title'>Error: {props.target}</DialogTitle>
      <TextField id='error-dialog-message'>{props.message}</TextField>
      <Button id='close-error-dialog' variant='contained' color='primary' onClick={close}>Okay...</Button>
    </Dialog>
  );
}

export default ErrorDialog;