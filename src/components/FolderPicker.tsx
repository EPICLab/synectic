import React from 'react';
import { useDispatch } from 'react-redux';
import Button from '@material-ui/core/Button';
import { remote } from 'electron';
import { generateFileTreeActions } from '../containers/explorer';
import { ActionKeys } from '../store/actions';
import { loadFE } from '../containers/handlers';

const FolderPicker: React.FunctionComponent = () => {
    const dispatch = useDispatch();

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        const paths = await remote.dialog.showOpenDialog({ properties: ['openDirectory'] });

        if (!paths.canceled && paths.filePaths) {
            const rootPath: string = paths.filePaths[0];
            const actions = await generateFileTreeActions(rootPath);
            actions.map((action) => {
                dispatch(action);
            });
            if (actions[0].type === ActionKeys.ADD_FE) dispatch(loadFE(actions[0].metadir));
        }
    };

    return (
        <Button id='folderpicker-button' variant='contained' color='primary' onClick={async (e) => { await handleClick(e) }}>Open Folder...</Button>
    );
};

export default FolderPicker;