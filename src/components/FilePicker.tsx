import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';

import { RootState } from '../store/root';
import { extractMetafile, loadCard } from '../containers/handlers';

const FilePicker: React.FunctionComponent = () => {
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));
  const dispatch = useDispatch();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const paths = await remote.dialog.showOpenDialog({ properties: ['openFile', 'multiSelections'] });

    if (!paths.canceled && paths.filePaths) paths.filePaths.map(async filePath => {
      // Redux useDispatch hook is synchronous, however, Redux useSelector hooks have already set their values.
      const addMetafileAction = dispatch(await extractMetafile(filePath, filetypes));
      // Because of the timing of these hooks, we cannot get the updated metafile from the Redux store until next re-render.
      // Therefore, to handle loading a card in one render, we cheat and take the metafile from the Redux action directly.
      dispatch(loadCard(addMetafileAction.metafile));
    });
  };

  return (
    <Button id='filepicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Open File...</Button>
  );
};

export default FilePicker;