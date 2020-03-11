import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { Metadir, Filetype } from '../types';
import { RootState } from '../store/root';
import { useSelector, useDispatch } from 'react-redux';
import { extractMetafile } from '../containers/metafiles';
import { loadCard } from '../containers/handlers';
import RenderTree from './RenderTree';

const FileExplorerComponent: React.FunctionComponent<{ metaDirId: string }> = props => {
  const root = useSelector((state: RootState) => state.metadirs[props.metaDirId]);
  const metadirs: Metadir[] = Object.values(useSelector((state: RootState) => state.metadirs));
  const filetypes: Filetype[] = useSelector((state: RootState) => Object.values(state.filetypes));
  const dispatch = useDispatch();

  const handleClick = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    const addMetafileAction = dispatch(await extractMetafile(path, filetypes));
    if (addMetafileAction.metafile.handler) dispatch(loadCard(addMetafileAction.metafile));
  }

  return (
    <div className='file-explorer'>
      <TreeView
        defaultParentIcon={<img width="20px" src="../assets/folder.svg" alt="Folder" />}
        defaultEndIcon={<div className="file-icon"><img width="20px" src="../assets/file.svg" alt="File" /></div>}
        defaultCollapseIcon={<><div className="folder-icon"><ExpandMoreIcon /></div> <img width="20px" src="../assets/open_folder.svg" alt="openFolder" /></>}
        defaultExpandIcon={<><div className="folder-icon"><ChevronRightIcon /></div> <img width="20px" src="../assets/alt_folder.svg" alt="Folder" /></>}
      >
        {RenderTree(root, metadirs, handleClick)}

      </TreeView >
    </div >
  );
}

export default FileExplorerComponent;