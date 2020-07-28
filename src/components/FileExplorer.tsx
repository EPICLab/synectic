import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PathLike } from 'fs-extra';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import { RootState } from '../store/root';
import { UUID } from '../types';
import { loadCard } from '../containers/handlers';
import { extractFilename } from '../containers/io';
import useDirectory from '../store/hooks/useDirectory';

const DirectoryComponent: React.FunctionComponent<{ root: PathLike }> = props => {
  const [{ directories, files }, { fetch }] = useDirectory(props.root);
  const dispatch = useDispatch();

  return (
    <TreeItem key={props.root.toString()} nodeId={props.root.toString()} label={extractFilename(props.root)} onClick={fetch}>
      {directories.map(dir => <DirectoryComponent key={dir} root={dir} />)}
      {files?.map(file => <TreeItem key={file} nodeId={file} label={extractFilename(file)} onClick={() => dispatch(loadCard({ filepath: file }))} />)}
    </TreeItem>
  );
};

const FileExplorerComponent: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const [{ directories, files }, { fetch }] = useDirectory(rootMetafile);
  const dispatch = useDispatch();

  useEffect(() => {
    fetch();
  });

  return (
    <div className='file-explorer'>
      <div className='branch-ribbon-container'><p className='branch-ribbon-text'>{`Branch: ${rootMetafile.branch}`}</p></div>
      <TreeView
        defaultParentIcon={<img width="20px" src="../assets/folder.svg" alt="Folder" />}
        defaultEndIcon={<div className="file-icon"><img width="20px" src="../assets/file.svg" alt="File" /></div>}
        defaultCollapseIcon={<><div className="folder-icon"><ExpandMoreIcon /></div> <img width="20px" src="../assets/open_folder.svg" alt="openFolder" /></>}
        defaultExpandIcon={<><div className="folder-icon"><ChevronRightIcon /></div> <img width="20px" src="../assets/alt_folder.svg" alt="Folder" /></>}
      >
        {directories.map(dir => <DirectoryComponent key={dir} root={dir} />)}
        {files.map(file => <TreeItem key={file} nodeId={file} label={extractFilename(file)} onClick={() => dispatch(loadCard({ filepath: file }))} />)}
      </TreeView>
    </div>
  );
};

export default FileExplorerComponent;