import React from 'react';
import TreeView from '@material-ui/lab/TreeView'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import TreeItem from '@material-ui/lab/TreeItem';
import { Metadir, Filetype } from '../types';
import { RootState } from '../store/root';
import { useSelector, useDispatch } from 'react-redux';
import { removeUndefined } from '../containers/filetree';
import * as io from '../containers/io';
import { extractMetafile } from '../containers/metafiles';
import { loadCard } from '../containers/handlers';

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

  const renderTree = (currDir: Metadir) => {
    const childFiles: string[] = currDir.containsFile;

    const childDirs: Metadir[] = removeUndefined(currDir.containsDir.map((dirPath) => {
      for (let i = 0; i < metadirs.length; i++) {
        if (metadirs[i].path === dirPath) return metadirs[i];
      }
    }));

    return (
      <TreeItem key={currDir.id} nodeId={currDir.id} label={currDir.name} >
        {
          childDirs.map(dir => renderTree(dir))
        }
        {
          childFiles.map(file => <TreeItem key={file} nodeId={file} onClick={async (e) => { await handleClick(e, file) }} label={io.extractFilename(file)}></TreeItem>)
        }
      </TreeItem >
    );
  }

  return (
    <div className='file-explorer'>
      <TreeView
        defaultParentIcon={<img width="20px" src="../assets/folder.svg" alt="Folder" />}
        defaultEndIcon={<div className="file-icon"><img width="20px" src="../assets/file.svg" alt="File" /></div>}
        defaultCollapseIcon={<><div className="folder-icon"><ExpandMoreIcon /></div> <img width="20px" src="../assets/open_folder.svg" alt="openFolder" /></>}
        defaultExpandIcon={<><div className="folder-icon"><ChevronRightIcon /></div> <img width="20px" src="../assets/alt_folder.svg" alt="Folder" /></>}
      >
        {renderTree(root)}
      </TreeView >
    </div >
  );
}

export default FileExplorerComponent;