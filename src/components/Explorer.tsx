import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PathLike, remove } from 'fs-extra';
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
import { Action } from '../store/actions';
import { loadCard, resolveHandler } from '../containers/handlers';
import { extractFilename, writeFileAsync } from '../containers/io';
import { FileState, useDirectory } from '../store/hooks/useDirectory';
import { StyledTreeItem } from './StyledTreeComponent';
import { getMetafile, MetafileWithPath } from '../containers/metafiles';
import { discardChanges } from '../containers/git-plumbing';
import { ThunkDispatch } from 'redux-thunk';

const useStyles = makeStyles({
  root: {
    transform: 'translateY(-12px)', // used by Branch Ribbon to remove extra whitespace before the first file/dir element
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
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();
  const cssClasses = useStyles();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { update() }, []); // initial async call to load/filter sub-directories & files via useDirectory hook

  const colorFilter = (fileStatus: FileState) => {
    switch (fileStatus) {
      case 'added':
        return '#95bf77';
      case 'deleted':
        return '#da6473';
      case 'modified':
        return '#d19a66';
      case 'unmodified':
        return undefined;
      default:
        return undefined;
    }
  }

  const discardHandlerConstructor = (filepath: PathLike, fileState: FileState) =>
    async (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();

      switch (fileState) {
        case 'added': {
          console.log('added file, so removing file to discard changes');
          remove(filepath.toString(), (error) => console.log(error));
          const handler = await dispatch(resolveHandler(filepath));
          if (handler) dispatch(getMetafile({ virtual: { name: extractFilename(filepath), handler: handler.handler } }));
          update();
          break;
        }
        case 'modified': {
          console.log('modified file, checking for changed content before doing anything')
          const updatedContent = await discardChanges(filepath);
          if (updatedContent) {
            console.log('  changed content => overwriting with original content')
            await writeFileAsync(filepath, updatedContent);
            dispatch(getMetafile({ filepath: filepath }));
            update();
          }
          break;
        }
        case 'deleted': {
          console.log('deleted file, so rewriting file content to discard changes');
          const content = await discardChanges(filepath);
          if (content) {
            await writeFileAsync(filepath, content);
            dispatch(getMetafile({ filepath: filepath }));
            update();
          }
          break;
        }

        case 'unmodified': {
          console.log('unmodified...');
          break;
        }
        default: {
          console.log('undefined...');
          break;
        }
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
            color={colorFilter(file.fileState)}
            labelText={extractFilename(file.path)}
            labelInfo={(file.fileState && file.fileState !== 'unmodified') ? ReplayIcon : undefined}
            labelInfoClickHandler={discardHandlerConstructor(file.path, file.fileState)}
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