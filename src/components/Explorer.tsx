import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { PathLike, remove } from 'fs-extra';
import TreeView from '@material-ui/lab/TreeView';
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
import { FileState, HookEntry, useDirectory } from '../store/hooks/useDirectory';
import { StyledTreeItem } from './StyledTreeComponent';
import { getMetafile, MetafileWithPath } from '../containers/metafiles';
import { discardChanges } from '../containers/git-plumbing';
import { ThunkDispatch } from 'redux-thunk';
import { BranchRibbon } from './BranchRibbon';
import { BranchList } from './BranchList';
import { Button } from '@material-ui/core';
import { getBranchRoot } from '../containers/git-porcelain';

const FileComponent: React.FunctionComponent<HookEntry & { update: () => Promise<void> }> = props => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

  const colorFilter = (fileStatus: FileState) => {
    switch (fileStatus) {
      case 'added':
        return '#95bf77'; // green
      case 'deleted':
        return '#da6473'; // red
      case 'modified':
        return '#d19a66'; // orange
      case 'unmodified':
        return undefined;
      default:
        return undefined;
    }
  }

  const discardChangesHandler = (filepath: PathLike, fileState: FileState) =>
    async (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      e.preventDefault();
      e.stopPropagation();

      switch (fileState) {
        case 'added': {
          console.log('added file, so removing file to discard changes');
          remove(filepath.toString(), (error) => console.log(error));
          const handler = await dispatch(resolveHandler(filepath));
          if (handler) dispatch(getMetafile({ virtual: { name: extractFilename(filepath), handler: handler.handler } }));
          props.update();
          break;
        }
        case 'modified': {
          console.log('modified file, checking for changed content before doing anything')
          const updatedContent = await discardChanges(filepath);
          if (updatedContent) {
            console.log('  changed content => overwriting with original content')
            await writeFileAsync(filepath, updatedContent);
            dispatch(getMetafile({ filepath: filepath }));
            props.update();
          }
          break;
        }
        case 'deleted': {
          console.log('deleted file, so rewriting file content to discard changes');
          const content = await discardChanges(filepath);
          if (content) {
            await writeFileAsync(filepath, content);
            dispatch(getMetafile({ filepath: filepath }));
            props.update();
          }
          break;
        }
      }
    }

  return (
    <StyledTreeItem key={props.path.toString()} nodeId={props.path.toString()}
      color={colorFilter(props.fileState)}
      labelText={extractFilename(props.path)}
      labelInfo={(props.fileState && props.fileState !== 'unmodified') ? ReplayIcon : undefined}
      labelInfoClickHandler={discardChangesHandler(props.path, props.fileState)}
      labelIcon={InsertDriveFileIcon}
      enableHover={true}
      onClick={() => (props.fileState === 'deleted') ? null : dispatch(loadCard({ filepath: props.path }))}
    />
  );
}

export const DirectoryComponent: React.FunctionComponent<{ root: PathLike }> = props => {
  const { directories, files, update } = useDirectory(props.root);
  const [expanded, setExpanded] = useState(false);


  const clickHandle = async () => {
    if (!expanded) await update();
    setExpanded(!expanded);
  }

  return (
    < StyledTreeItem key={props.root.toString()} nodeId={props.root.toString()}
      labelText={extractFilename(props.root)}
      labelIcon={expanded ? FolderOpenIcon : FolderIcon}
      onClick={clickHandle}
    >
      { directories.map(dir => <DirectoryComponent key={dir.path.toString()} root={dir.path} />)}
      { files.map(file => <FileComponent key={file.path.toString()} {...file} update={update} />)}
    </StyledTreeItem >
  );
};

const Explorer: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useSelector((state: RootState) => state.metafiles[props.rootId]);
  const { directories, files, update } = useDirectory((rootMetafile as MetafileWithPath).path);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { update() }, []); // initial async call to load/filter sub-directories & files via useDirectory hook

  return (
    <div className='file-explorer'>
      <BranchRibbon branch={rootMetafile.branch} />
      <TreeView
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        defaultEndIcon={<div style={{ width: 8 }} />}
      >
        {directories.map(dir => <DirectoryComponent key={dir.path.toString()} root={dir.path} />)}
        {files.map(file => <FileComponent key={file.path.toString()} {...file} update={update} />)}
      </TreeView>
    </div>
  );
};

export const ExplorerReverse: React.FunctionComponent<Card> = props => {
  const metafile = useSelector((state: RootState) => state.metafiles[props.metafile]);
  const repos = useSelector((state: RootState) => state.repos);
  const [repo] = useState(metafile.repo ? repos[metafile.repo] : undefined);
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

  const handleVersionsClick = async () => {
    if (!repo || !metafile.branch) return;
    const sourceControlMetafile = await dispatch(getMetafile({
      virtual: {
        name: 'Source Control',
        handler: 'SourceControl',
        repo: repo.id,
        branch: metafile.branch,
        path: await getBranchRoot(repo, metafile.branch)
      }
    }));
    if (sourceControlMetafile) dispatch(loadCard({ metafile: sourceControlMetafile }));
  }

  /**
   * TODO: Need to update the metafile.status for the directory when an underlying file changes
   */

  return (
    <>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{props.modified.toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo ? repo.name : 'Untracked'}</span>
      <span>Branch:</span><BranchList metafileId={metafile.id} cardId={props.id} update={true} />
      <span>Status:</span><span className='field'>{metafile.status}</span>
      <span>Versions:</span><Button onClick={handleVersionsClick}>Source Control</Button>
    </>
  );
};

export default Explorer;