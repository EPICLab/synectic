import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Dialog, TextField, Button, Select, MenuItem, InputLabel, DialogTitle } from '@material-ui/core';
import { v4 } from 'uuid';
import { DateTime } from 'luxon';

import { RootState } from '../store/root';
import { Metafile } from '../types';
import { Action, ActionKeys } from '../store/actions';
import { loadCard } from '../containers/handlers';
import * as io from '../containers/io';

export const checkFileName = (fileName: string): boolean => {
  return fileName.slice(0, fileName.lastIndexOf('.')).slice(-1) !== '.' &&
    fileName.slice(0, fileName.lastIndexOf('.')).slice(-1) !== ' ' &&
    /*Regex below matches all occurences of invalid file name characters in the set: <, >, \, /, |, ?, *, 
      and characters NULL to US (ASCII values 0 to 31)*/
    // eslint-disable-next-line no-control-regex
    !(/[<>:"\\/|?*\x00-\x1F]/g).test(fileName) && fileName !== '' &&
    fileName.slice(0, fileName.lastIndexOf('.')) !== '' ?
    true : false;
}

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

    const ext = event.target.value.indexOf('.') !== -1 ? io.extractExtension(event.target.value) : "";
    let found = false;
    filetypes.map(filetype => {
      filetype.extensions.map(extension => {
        if (ext === extension) {
          setFiletype(filetype.filetype);
          found = true;
        }
      });
    });

    found && checkFileName(event.target.value) ? setIsFileNameValid(true) : setIsFileNameValid(false);
  };

  const handleFiletypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFiletype(event.target.value as string);

    filetypes.map(filetype => {
      if (filetype.filetype === event.target.value as string) {
        const ext = fileName.indexOf('.') !== -1 ? io.extractExtension(fileName) : "";
        if (ext === "" && fileName.slice(-1) !== ".") {
          setFileName(fileName + '.' + filetype.extensions[0]);
        } else if (ext === "" && fileName.slice(-1) === ".") {
          setFileName(fileName + filetype.extensions[0]);
        } else {
          setFileName(fileName.slice(0, -ext.length) + filetype.extensions[0]);
        }
        checkFileName(fileName) ? setIsFileNameValid(true) : setIsFileNameValid(false);
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
      const addMetafileAction: Action = { type: ActionKeys.ADD_METAFILE, id: metafile.id, metafile: metafile };
      dispatch(addMetafileAction);
      dispatch(loadCard({ metafile: metafile }));

      handleClose();
    }
  };

  return (
    <>
      <Dialog id="new-card-dialog" open={props.open} onClose={handleClose} aria-labelledby="new-card-dialog">
        <div className="new-card-dialog-container">
          <DialogTitle id='new-card-dialog-title' style={{ gridArea: 'header' }}>{"Create New Card"}</DialogTitle>
          <InputLabel id="select-file-name-label" style={{ gridArea: 'upper-left' }}>Enter File Name:</InputLabel>
          <TextField error={isFileNameValid ? false : true} id="new-card-dialog-file-name" helperText={isFileNameValid ? "" : "Invalid File Name"} value={fileName} onChange={handleFileNameChange} style={{ gridArea: 'middle' }} />
          <InputLabel id="select-filetype-label" style={{ gridArea: 'lower-left' }}>Select Filetype:</InputLabel>
          <Select error={filetype === '' ? true : false} value={filetype} onChange={handleFiletypeChange} labelId="new-card-dialog-filetype-label" id="new-card-dialog-filetype" style={{ gridArea: 'footer' }}>
            {filetypes.map(filetype => <MenuItem key={filetype.id} value={filetype.filetype}>{filetype.filetype}</MenuItem>)}
          </Select>
          <Button id='create-card-button' variant='contained' color={isFileNameValid && filetype !== '' && fileName.indexOf('.') !== -1 ? 'primary' : 'default'} onClick={(e) => { handleClick(e) }} style={{ gridArea: 'subfooter' }}>Create New Card</Button>
        </div>
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
