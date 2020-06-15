import React, { useState } from 'react';
import { Dialog, DialogTitle, TextField, Button } from '@material-ui/core';

const ErrorDialog: React.FunctionComponent<{ target: string; message: string }> = props => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog id='error-dialog' open={open} onClose={() => setOpen(false)} aria-labelledby='error-message-dialog'>
      <DialogTitle id='error-dialog-title'>Error: {props.target}</DialogTitle>
      <TextField id='error-dialog-message'>{props.message}</TextField>
      <Button id='close-error-dialog' variant='contained' color='primary' onClick={() => setOpen(false)}>Okay...</Button>
    </Dialog>
  );
}

export default ErrorDialog;