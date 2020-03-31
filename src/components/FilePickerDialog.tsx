import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';
import { RootState } from '../store/root';
import { loadCard } from '../containers/handlers';
import { extractMetafile } from '../containers/metafiles';

const FilePickerButton: React.FunctionComponent = () => {
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));
  const repos = useSelector((state: RootState) => Object.values(state.repos));
  const dispatch = useDispatch();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    const paths = await remote.dialog.showOpenDialog({ properties: ['openFile', 'openDirectory', 'multiSelections'] });

    /**
     * The Redux useSelector hook is synchronous with the React component lifecycle, therefore the value of the 
     * filetypes useSelector hook has already been set before the handleClick function executes (since this function 
     * is linked to the asynchronous onClick event). This poses a problem since the Redux useDispatch hook updates
     * the Redux store, but the useSelector hook does not pick up on that state change until the next re-render cycle.
     * 
     * The metafile information needs to be present for loading a new Card component into the UI, therefore, we must
     * update the metafile information in the React store on the same render cycle as the card state update.
     * To handle updating metafile information and loading a card in one render, we cheat and take the metafile from 
     * the Redux metafile update action directly.
     */
    if (!paths.canceled && paths.filePaths) paths.filePaths.map(async filePath => {
      const metafilePayload = await extractMetafile(filePath, filetypes, repos);
      metafilePayload.actions.map(action => dispatch(action));
      if (metafilePayload.metafile.handler) dispatch(loadCard(metafilePayload.metafile));
    });
  };

  return (
    <Button id='filepicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Open File...</Button>
  );
};

export default FilePickerButton;