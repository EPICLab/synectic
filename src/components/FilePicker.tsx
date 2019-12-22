import React from 'react';
import { useSelector } from 'react-redux';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';

import { RootState } from '../store/root';
import { extractMetafile, loadCard } from '../containers/handlers';

const FilePicker: React.FunctionComponent = () => {
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const path = await remote.dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });
    if (!path.canceled && path.filePaths) path.filePaths.map(async filePath => loadCard(await extractMetafile(filePath, filetypes)));
  };

  return (
    <Button id='filepicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Open File...</Button>
  );
};

export default FilePicker;