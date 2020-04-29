import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dialog, TextField, Button, Select, MenuItem, InputLabel } from '@material-ui/core';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { RootState } from '../store/root';
import { Metafile } from '../types';
import { Actions, ActionKeys } from '../store/actions';
import { loadCard } from '../containers/handlers';

type NewCardDialogProps = {
  open: boolean;
  onClose: () => void;
}

const NewCardDialog: React.FunctionComponent<NewCardDialogProps> = (props) => {
  const dispatch = useDispatch();
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));
  const [fileName, setFileName] = React.useState('');
  const [filetype, setFiletype] = React.useState('');
  const [isFileNameValid, setIsFileNameValid] = React.useState(false);

  const handleClose = () => {
    setFileName('');
    setFiletype('');
    setIsFileNameValid(false);
    props.onClose();
  };

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
    if (event.target.value === '') {
      setIsFileNameValid(false);
    } else {
      setIsFileNameValid(true);
    }
  };

  const handleFiletypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFiletype(event.target.value as string);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isFileNameValid && filetype !== '') {
      const metafile: Metafile = {
        id: v4(),
        name: fileName,
        filetype: filetype,
        path: fileName,
        modified: DateTime.local(),
        handler: 'Editor'
      };
      const addMetafileAction: Actions = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
      dispatch(addMetafileAction);
      dispatch(loadCard(metafile));

      handleClose();
    }
  };

  return (
    <>
      <Dialog open={props.open} onClose={handleClose} aria-labelledby="new-card-dialog">
        <InputLabel id="select-filetype-label">Select Filetype:</InputLabel>
        <Select error={filetype === '' ? true : false} value={filetype} onChange={handleFiletypeChange} labelId="demo-simple-select-label" id="demo-simple-select">
          {filetypes.map(filetype => <MenuItem key={filetype.id} value={filetype.filetype}>{filetype.filetype}</MenuItem>)}
        </Select>
        <TextField error={isFileNameValid ? false : true} id="standard-basic" label="Enter File Name" helperText={isFileNameValid ? "" : "Invalid File Name"} value={fileName} onChange={handleFileNameChange} />
        <Button id='create-card-button' variant='contained' color={isFileNameValid && filetype !== '' ? 'primary' : 'default'} onClick={(e) => { handleClick(e) }}>Create New Card</Button>
      </Dialog>
    </>
  );
};

const NewCardComponent: React.FunctionComponent = () => {
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  }

  return (
    <>
      <Button id='newcard-button' variant='contained' color='primary' onClick={(e) => { handleClick(e) }}>New Card...</Button>
      <NewCardDialog open={open} onClose={handleClose} />
    </>
  );
};

export default NewCardComponent;