import React, { useState } from 'react';
import TreeView from '@material-ui/lab/TreeView';
import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import ReplayIcon from '@material-ui/icons/Replay';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import { Button } from '@material-ui/core';
import type { UUID, Card, Metafile, GitStatus } from '../types';
import { RootState } from '../store/store';
import { loadCard } from '../containers/handlers';
import { extractFilename } from '../containers/io';
import { StyledTreeItem } from './StyledTreeComponent';
import { discardMetafileChanges, getMetafile, MetafileWithPath } from '../containers/metafiles';
import { BranchRibbon } from './BranchRibbon';
import { BranchList } from './BranchList';
import { getBranchRoot } from '../containers/git-porcelain';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { metafileSelectors } from '../store/selectors/metafiles';
import { repoSelectors } from '../store/selectors/repos';
import useDirectory from '../containers/hooks/useDirectory';

const FileComponent: React.FunctionComponent<Metafile> = props => {
  const dispatch = useAppDispatch();

  const colorFilter = (status: GitStatus) => {
    switch (status) {
      case '*added': // Fallthrough
      case 'added':
        return '#95bf77'; // green
      case '*deleted': // Fallthrough
      case 'deleted':
        return '#da6473'; // red
      case '*modified': // Fallthrough
      case 'modified':
        return '#d19a66'; // orange
      default:
        return undefined;
    }
  }

  return (props.path ?
    <StyledTreeItem key={props.id} nodeId={props.id}
      color={colorFilter(props.status)}
      labelText={extractFilename(props.path)}
      labelInfo={['*added', 'added', '*deleted', 'deleted', '*modified', 'modified'].includes(props.status) ? ReplayIcon : undefined}
      labelInfoClickHandler={async (e) => {
        e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
        await dispatch(discardMetafileChanges(props));
      }}
      labelIcon={InsertDriveFileIcon}
      enableHover={true}
      onClick={() => ['*deleted', 'deleted'].includes(props.status) ? null : dispatch(loadCard({ filepath: props.path }))}
    /> : null
  );
}

export const DirectoryComponent: React.FunctionComponent<Metafile> = props => {
  const { directories, files } = useDirectory(props.path);
  const [expanded, setExpanded] = useState(false);

  const clickHandle = async () => setExpanded(!expanded);

  return (
    < StyledTreeItem key={props.id} nodeId={props.id}
      labelText={props.name}
      labelIcon={expanded ? FolderOpenIcon : FolderIcon}
      onClick={clickHandle}
    >
      {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
      {files.map(file => <FileComponent key={file.id} {...file} />)}
    </StyledTreeItem >
  );
};

const Explorer: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.rootId));
  const { directories, files } = useDirectory((rootMetafile as MetafileWithPath).path);

  return (
    <div className='file-explorer'>
      <BranchRibbon branch={rootMetafile?.branch} />
      <TreeView
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        defaultEndIcon={<div style={{ width: 8 }} />}
      >
        {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
        {files.map(file => <FileComponent key={file.id} {...file} />)}
      </TreeView>
    </div>
  );
};

export const ExplorerReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);
  const dispatch = useAppDispatch();

  const handleVersionsClick = async () => {
    if (!repo || !metafile?.branch) return;
    const sourceControlMetafile = await dispatch(getMetafile({
      virtual: {
        name: 'Source Control',
        handler: 'SourceControl',
        repo: repo.id,
        branch: metafile.branch,
        path: await getBranchRoot(repo, metafile.branch)
      }
    })).unwrap();
    if (sourceControlMetafile) dispatch(loadCard({ metafile: sourceControlMetafile }));
  }

  return (
    <>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{props.modified.toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo ? repo.name : 'Untracked'}</span>
      <span>Branch:</span>{metafile ? <BranchList metafileId={metafile.id} cardId={props.id} update={true} /> : undefined}
      <span>Status:</span><span className='field'>{metafile ? metafile.status : ''}</span>
      <span>Versions:</span><Button onClick={handleVersionsClick}>Source Control</Button>
    </>
  );
};

export default Explorer;