import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import { RootState } from '../store/root';
import { UUID } from '../types';
import { loadCard } from '../containers/handlers';

type ClickEventHandler = (e: React.MouseEvent<Element, MouseEvent>, path: string) => Promise<void>;

const DirectoryComponent: React.FunctionComponent<{ metafileId: UUID; onClick: ClickEventHandler }> = props => {
  const metafiles = useSelector((state: RootState) => state.metafiles);
  const [root] = useState(metafiles[props.metafileId]);
  const [dirs] = useState(root.contains?.map(uuid => metafiles[uuid]).filter(m => m.filetype === 'Directory'));
  const [files] = useState(root.contains?.map(uuid => metafiles[uuid]).filter(m => m.filetype !== 'Directory'));

  return (
    <TreeItem key={root.id} nodeId={root.id} label={root.name}>
      {dirs ? dirs.map(dir => <DirectoryComponent key={dir.id} metafileId={dir.id} onClick={props.onClick} />) : null}
      {files ? files.map(file => <TreeItem key={file.id} nodeId={file.id} label={file.name}
        onClick={async (e) => { await props.onClick(e, file.path ? file.path.toString() : '') }} />) : null}
    </TreeItem>
  );
};

const FileExplorerComponent: React.FunctionComponent<{ rootId: UUID }> = props => {
  const root = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const dispatch = useDispatch();

  const handleClick = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    dispatch(loadCard({ filepath: path }));
  }

  return (
    <div className='file-explorer'>
      <div className='branch-ribbon-container'><p className='branch-ribbon-text'>{`Branch: ${root.ref}`}</p></div>
      <TreeView
        defaultParentIcon={<img width="20px" src="../assets/folder.svg" alt="Folder" />}
        defaultEndIcon={<div className="file-icon"><img width="20px" src="../assets/file.svg" alt="File" /></div>}
        defaultCollapseIcon={<><div className="folder-icon"><ExpandMoreIcon /></div> <img width="20px" src="../assets/open_folder.svg" alt="openFolder" /></>}
        defaultExpandIcon={<><div className="folder-icon"><ChevronRightIcon /></div> <img width="20px" src="../assets/alt_folder.svg" alt="Folder" /></>}
      >
        <DirectoryComponent metafileId={props.rootId} onClick={handleClick} />
      </TreeView>
    </div>
  );
}

export default FileExplorerComponent;