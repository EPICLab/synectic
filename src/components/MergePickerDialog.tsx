import React, { useState } from 'react';
import { Button, Dialog } from '@material-ui/core';

import { UUID } from '../types';

type DialogProps = {
  open: boolean;
  options: string[];
  onClose: (canceled: boolean, selected: [UUID, UUID]) => void;
}

export const MergePickerDialog: React.FunctionComponent<DialogProps> = props => {
  const [selectedLeft] = useState('');
  const [selectedRight] = useState('');

  return (
    <Dialog id='picker-dialog' open={props.open} onClose={() => props.onClose(false, ['', ''])}>
      <div>selectLeft: {selectedLeft}</div>
      <div>selectRight: {selectedRight}</div>
    </Dialog >
  );
}

const MergePickerButton: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(!open);
  };

  return (
    <>
      <Button id='diffpicker-button' variant='contained' color='primary' onClick={() => setOpen(!open)}>Merge Branches...</Button>
      <MergePickerDialog open={open} options={['stuff']} onClose={handleClose} />
    </>
  );
}

export default MergePickerButton;