import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';

import { RootState } from '../store/root';

type NewCardDialogProps = {
  open: boolean;
  selectedValue: string;
  onClose: (value: string) => void;
}

const NewCardDialog: React.FunctionComponent<NewCardDialogProps> = (props) => {

  const handleClose = () => {
    props.onClose(props.selectedValue);
  };

  return (
    <Dialog onClose={handleClose} aria-labelledby="new-card-dialog" open={props.open}>
      Select your filetype: {props.selectedValue}
    </Dialog>
  );
};

const NewCardComponent: React.FunctionComponent = () => {
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState('Default');

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(`there are ${filetypes.length} options...`);
    setOpen(true);
  };

  const handleClose = (value: string) => {
    setOpen(false);
    setSelectedValue(value);
  }

  return (
    <>
      <Button id='newcard-button' variant='contained' color='primary' onClick={(e) => { handleClick(e) }}>New Card...</Button>
      <NewCardDialog selectedValue={selectedValue} open={open} onClose={handleClose} />
    </>
  );
};

export default NewCardComponent;