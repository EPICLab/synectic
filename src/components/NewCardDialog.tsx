import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { Dialog, TextField, Button, Select, MenuItem, InputLabel, DialogTitle } from '@material-ui/core';

import { RootState } from '../store/root';
import { Action } from '../store/actions';
import { loadCard } from '../containers/handlers';
import * as io from '../containers/io';
import { flatten } from '../containers/flatten';
import { getMetafile } from '../containers/metafiles';

type NewCardDialogProps = {
  open: boolean;
  onClose: () => void;
}

export const NewCardDialog: React.FunctionComponent<NewCardDialogProps> = props => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));
  const exts: string[] = flatten(filetypes.map(filetype => filetype.extensions)); // List of all valid extensions found w/in filetypes
  // configExts is a list of all .config extensions found within exts:
  const configExts: string[] = flatten((filetypes.map(filetype => filetype.extensions.filter(ext => ext.charAt(0) === '.'))).filter(arr => arr.length > 0));

  const [fileName, setFileName] = React.useState('');
  const [filetype, setFiletype] = React.useState('');
  const [isFileNameValid, setIsFileNameValid] = React.useState(false);

  const [isExtensionValid, setIsExtensionValid] = React.useState(false);

  const handleClose = () => {
    setFileName('');
    setFiletype('');
    setIsExtensionValid(false);
    setIsFileNameValid(false);
    props.onClose();
  };

  const handleFileNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFileName(event.target.value);
    // currExt takes the current extension found within the filename, or is an empty string if no extension is found
    const currExt = event.target.value.indexOf('.') !== -1 ? io.extractExtension(event.target.value) : "";
    // newExt matches currExt to an existing extension within filetypes. If none is found, it returns undefined
    const newExt = filetypes.find(filetype => filetype.extensions.find(extension => currExt === extension || '.' + currExt === extension));

    if (newExt) { // If a valid filetype extension was matched, then set the file type
      setFiletype(newExt.filetype);
      setIsExtensionValid(true);
    } else { // Otherwise, the extension is not valid
      setIsExtensionValid(false);
    }

    io.validateFileName(event.target.value, configExts, exts) ? setIsFileNameValid(true) : setIsFileNameValid(false);
  };

  const handleFiletypeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setFiletype(event.target.value as string);

    // Match with a valid filetype
    const newFiletype = filetypes.find(filetype => filetype.filetype === event.target.value as string);
    // If no matches were found, return (forces typeof newFiletype to be Filetype and not undefined) 
    if (!newFiletype) return;

    // Update the current file name with the new selected filetype's extension
    const currFileName = io.replaceExt(fileName, newFiletype);
    setFileName(currFileName);

    if (io.validateFileName(currFileName, configExts, exts)) {
      setIsFileNameValid(true);
      setIsExtensionValid(true);
    } else {
      setIsFileNameValid(false);
    }
  };

  const handleClick = async () => {
    if (isFileNameValid && filetype !== '' && fileName.indexOf('.') !== -1 && isExtensionValid) {
      const metafile = await dispatch(getMetafile({ virtual: { name: fileName, handler: 'Editor', path: fileName, filetype: filetype } }));
      if (metafile) dispatch(loadCard({ metafile: metafile }));
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
          <Button id='create-card-button' variant='contained' color={isFileNameValid && isExtensionValid && filetype !== '' && fileName.indexOf('.') !== -1 ? 'primary' : 'default'} onClick={() => handleClick()} style={{ gridArea: 'subfooter' }}>Create New Card</Button>
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

  const handleClose = () => setOpen(false);

  return (
    <>
      <Button id='newcard-button' variant='contained' color='primary' onClick={(e) => { handleClick(e) }}>New...</Button>
      <NewCardDialog open={open} onClose={handleClose} />
    </>
  );
};

export default NewCardButton;