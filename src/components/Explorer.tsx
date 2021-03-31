import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PathLike } from 'fs-extra';
import TreeView from '@material-ui/lab/TreeView';
import { makeStyles } from '@material-ui/core';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ReplayIcon from '@material-ui/icons/Replay';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';

import type { UUID, Card } from '../types';
import { RootState } from '../store/root';
import { loadCard } from '../containers/handlers';
import { extractFilename, writeFileAsync } from '../containers/io';
import { useDirectory } from '../store/hooks/useDirectory';
import { StyledTreeItem } from './StyledTreeComponent';
import { getMetafile, MetafileWithPath } from '../containers/metafiles';
import { discardChanges } from '../containers/git-plumbing';

const useStyles = makeStyles({
  root: {
    transform: 'translateY(-12px)',
  },

});

export const DirectoryComponent: React.FunctionComponent<{ root: PathLike }> = props => {
  const { directories, files, update } = useDirectory(props.root);
  const [expanded, setExpanded] = useState(false);
  const dispatch = useDispatch();

  const clickHandle = async () => {
    if (!expanded) await update();
    setExpanded(!expanded);
  }

  const discardHandlerConstructor = (filepath: PathLike) => async (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    await discardChanges(filepath);
  }

  return (
    <StyledTreeItem key={props.root.toString()} nodeId={props.root.toString()}
      labelText={extractFilename(props.root)}
      labelIcon={expanded ? FolderOpenIcon : FolderIcon}
      onClick={clickHandle}
    >
      { directories.map(dir => <DirectoryComponent key={dir.path.toString()} root={dir.path} />)}
      { files.map(file =>
        <StyledTreeItem key={file.toString()} nodeId={file.toString()}
          labelText={extractFilename(file.path)}
          labelIcon={InsertDriveFileIcon}
          labelInfo={ReplayIcon}
          labelInfoClickHandler={discardHandlerConstructor(file.path)}
          onClick={() => dispatch(loadCard({ filepath: file.path }))}
        />
      )}
    </StyledTreeItem>
  );
};

const Explorer: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const { directories, files, update } = useDirectory((rootMetafile as MetafileWithPath).path);
  const dispatch = useDispatch();
  const cssClasses = useStyles();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { update() }, []); // initial async call to load/filter sub-directories & files via useDirectory hook

  const colorFilter = (status: [number, number, number] | undefined): string | undefined => {
    if (!status) return undefined;
    if (status[0] === 0) return '#95bf77'; // absent in HEAD; new or added
    if (status[0] === 1 && status[1] === 2) return '#d19a66'; // present in HEAD, different in WORKDIR; modified
    if (status[0] === 1 && status[1] === 0) return '#da6473'; // present in HEAD, absent in WORKDIR; deleted
    return undefined;
  }

  const discardHandlerConstructor = (filepath: PathLike) => async (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`clicked on revert for ${filepath.toString()}`);
    const updatedContent = await discardChanges(filepath);
    if (updatedContent) {
      console.log(`writing content to file and updating metafile for ${filepath.toString()}`);
      await writeFileAsync(filepath, updatedContent);
      dispatch(getMetafile({ filepath: filepath }));
    }
  }

  return (
    <div className='file-explorer'>
      <div className='branch-ribbon-container'><p className='branch-ribbon-text'>{`Branch: ${rootMetafile.branch}`}</p></div>
      <TreeView
        classes={cssClasses}
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        defaultEndIcon={<div style={{ width: 8 }} />}
      >
        {directories.map(dir => <DirectoryComponent key={dir.path.toString()} root={dir.path} />)}
        {files.map(file =>
          <StyledTreeItem key={file.path.toString()} nodeId={file.path.toString()}
            color={colorFilter(file.status)}
            labelText={extractFilename(file.path)}
            labelInfo={colorFilter(file.status) ? ReplayIcon : undefined}
            labelInfoClickHandler={discardHandlerConstructor(file.path)}
            labelIcon={InsertDriveFileIcon}
            onClick={
              () => (file.status && file.status[0] === 1 && file.status[1] === 0)
                ? null
                : dispatch(loadCard({ filepath: file.path }))
            }
          />
        )}
      </TreeView>
    </div>
  );
};

export const ExplorerReverse: React.FunctionComponent<Card> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafile]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : { name: 'Untracked' });

  /**
   * TODO: Need to update the metafile.status for the directory when an underlying file changes
   */

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