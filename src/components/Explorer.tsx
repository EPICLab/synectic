import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PathLike } from 'fs-extra';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import { makeStyles } from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import { RootState } from '../store/root';
import { UUID, Card } from '../types';
import { loadCard } from '../containers/handlers';
import { extractFilename } from '../containers/io';
import { useDirectory } from '../store/hooks/useDirectory';

const useStyles = makeStyles({
  root: {
    transform: 'translateY(-12px)',
  }
});

export const DirectoryComponent: React.FunctionComponent<{ root: PathLike }> = props => {
  const { directories, files, fetch } = useDirectory(props.root);
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();

  const clickHandle = () => {
    if (!expanded) fetch();
    setExpanded(!expanded);
  }

  return (
    <TreeItem key={props.root.toString()} nodeId={props.root.toString()} label={extractFilename(props.root)} onClick={clickHandle}>
      {directories.map(dir => <DirectoryComponent key={dir} root={dir} />)}
      {files?.map(file => <TreeItem key={file} nodeId={file} label={extractFilename(file)} onClick={() => dispatch(loadCard({ filepath: file }))} />)}
    </TreeItem>
  );
};

const Explorer: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const { directories, files, fetch } = useDirectory(rootMetafile);
  const dispatch = useDispatch();
  const cssClasses = useStyles();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch() }, []); // initial async call to load/filter sub-directories & files via useDirectory hook

  return (
    <div className='file-explorer'>
      <div className='branch-ribbon-container'><p className='branch-ribbon-text'>{`Branch: ${rootMetafile.branch}`}</p></div>
      <TreeView
        classes={cssClasses}
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

export const ExplorerReverse: React.FunctionComponent<Card> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafile[0]]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : { name: 'Untracked' });

  return (
    <>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{props.modified.toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo.name}</span>
      <span>Branch:</span><span className='field'>{metafile.branch ? metafile.branch : 'untracked'}</span>
      <span>Status:</span><span className='field'>{metafile.status}</span>
    </>
  );
};

export default Explorer;