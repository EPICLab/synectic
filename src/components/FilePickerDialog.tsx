import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';
import { loadCard } from '../containers/handlers';

const FilePickerButton: React.FunctionComponent = () => {
  const dispatch = useDispatch();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const paths = await remote.dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] });
    if (!paths.canceled && paths.filePaths) paths.filePaths.map(async filePath => dispatch(loadCard({ filepath: filePath })));
  };

  return (
    <Button id='filepicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Open File...</Button>
  );
};

export default FilePickerButton;