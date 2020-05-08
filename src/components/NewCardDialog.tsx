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

export const NewCardDialog: React.FunctionComponent<NewCardDialogProps> = props => {
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
    // eslint-disable-next-line no-control-regex
    if (event.target.value === '' || (/[<>:"\\/\\|?*\x00-\x1F]/g).test(event.target.value) || event.target.value.slice(-1) === ' ' || event.target.value.slice(-1) === '.') {
      setIsFileNameValid(false);
    } else {
      setIsFileNameValid(true);
    }

    const ext = event.target.value.indexOf('.') !== -1 ? event.target.value.substring(event.target.value.lastIndexOf('.') + 1) : "";
    let found = false;
    filetypes.map(filetype => {
      filetype.extensions.map(extension => {
        if (ext === extension) {
          setFiletype(filetype.filetype);
          found = true;
        }
      });
    });

    found ? setIsFileNameValid(true) : setIsFileNameValid(false);
  };

  const handleFiletypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFiletype(event.target.value as string);

    filetypes.map(filetype => {
      if (filetype.filetype === event.target.value as string) {
        const ext = fileName.indexOf('.') !== -1 ? fileName.substring(fileName.lastIndexOf('.') + 1) : "";
        if (ext === "" && fileName.slice(-1) !== ".") {
          setFileName(fileName + '.' + filetype.extensions[0]);
        } else if (ext === "" && fileName.slice(-1) === ".") {
          setFileName(fileName + filetype.extensions[0]);
        } else {
          setFileName(fileName.slice(0, -ext.length) + filetype.extensions[0]);
        }
        setIsFileNameValid(true);
      }
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (isFileNameValid && filetype !== '' && fileName.indexOf('.') !== -1) {
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
        <InputLabel id="select-filetype-label">Enter File Name:</InputLabel>
        <TextField error={isFileNameValid ? false : true} id="standard-basic" helperText={isFileNameValid ? "" : "Invalid File Name"} value={fileName} onChange={handleFileNameChange} />
        <InputLabel id="select-filetype-label">Select Filetype:</InputLabel>
        <Select error={filetype === '' ? true : false} value={filetype} onChange={handleFiletypeChange} labelId="demo-simple-select-label" id="demo-simple-select">
          {filetypes.map(filetype => <MenuItem key={filetype.id} value={filetype.filetype}>{filetype.filetype}</MenuItem>)}
        </Select>
        <Button id='create-card-button' variant='contained' color={isFileNameValid && filetype !== '' && fileName.indexOf('.') !== -1 ? 'primary' : 'default'} onClick={(e) => { handleClick(e) }}>Create New Card</Button>
      </Dialog>
    </>
  );
};

const NewCardButton: React.FunctionComponent = () => {
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

export default NewCardButton;