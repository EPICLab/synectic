import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { AnyAction } from 'redux';
import { PathLike } from 'fs-extra';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import { RootState } from '../store/root';
import { UUID, Metafile } from '../types';
import { asyncFilter } from '../containers/format';
import { getMetafile } from '../containers/metafiles';
import { loadCard } from '../containers/handlers';
import { isDirectory, extractFilename } from '../containers/io';

const DirectoryComponent: React.FunctionComponent<{ root: PathLike }> = props => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, AnyAction>>();
  const memoizedRootFetch = useMemo(() => dispatch(getMetafile(props.root)), [dispatch, props.root]);
  const [root, setRoot] = useState<Metafile | undefined>();
  const [directories, setDirectories] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);

  const onClickHandler = async () => !root ? setRoot(await memoizedRootFetch) : null;

  useEffect(() => {
    let isMounted = true;
    if (root && root.path && root.contains) {
      asyncFilter(root.contains, async (e: string) => isDirectory(e)).then(dirs => {
        if (isMounted && root.contains) {
          setDirectories(dirs);
          setFiles(root.contains.filter(cPath => !directories.includes(cPath)));
        }
      });
    }
    return () => { isMounted = false };
  }, [root, directories]);

  return (
    <TreeItem key={props.root.toString()} nodeId={props.root.toString()} label={extractFilename(props.root)} onClick={onClickHandler}>
      {directories.map(dir => <DirectoryComponent key={dir} root={dir} />)}
      {files.map(file => <TreeItem key={file} nodeId={file} label={extractFilename(file)} onClick={() => dispatch(loadCard({ filepath: file }))} />)}
    </TreeItem>
  );
};

const FileExplorerComponent: React.FunctionComponent<{ rootId: UUID }> = props => {
  const root = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const [directories, setDirectories] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);
  const dispatch = useDispatch();

  useEffect(() => {
    let isMounted = true;
    if (root.path && root.contains) {
      asyncFilter(root.contains, async (e: string) => isDirectory(e)).then(dirs => {
        if (isMounted && root.contains) {
          setDirectories(dirs);
          setFiles(root.contains.filter(cPath => !directories.includes(cPath)));
        }
      });
    }
    return () => { isMounted = false };
  }, [root, directories]);

  return (
    <div className='file-explorer'>
      <div className='branch-ribbon-container'><p className='branch-ribbon-text'>{`Branch: ${root.branch}`}</p></div>
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