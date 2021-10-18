import React, { useState } from 'react';
import TreeView from '@material-ui/lab/TreeView';
// import InsertDriveFileIcon from '@material-ui/icons/InsertDriveFile';
import { InsertDriveFile, Add, Remove } from '@material-ui/icons';
import FolderIcon from '@material-ui/icons/Folder';
import FolderOpenIcon from '@material-ui/icons/FolderOpen';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import type { UUID, Card, GitStatus } from '../types';
import { RootState } from '../store/store';
import { loadCard } from '../containers/handlers';
import { extractFilename } from '../containers/io';
import { StyledTreeItem } from './StyledTreeComponent';
import { MetafileWithPath } from '../containers/metafiles';
import { BranchRibbon } from './BranchRibbon';
import { BranchList } from './BranchList';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { metafileSelectors } from '../store/selectors/metafiles';
import { add, remove } from '../containers/git-plumbing';
import { repoSelectors } from '../store/selectors/repos';
import useDirectory from '../containers/hooks/useDirectory';
import { SourceControlButton } from './SourceControl';
import { removeUndefinedProperties } from '../containers/format';

type SourceFileProps = {
  update: () => Promise<void>
}

const FileComponent: React.FunctionComponent<MetafileWithPath & SourceFileProps> = props => {
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(repos.find(r => r.id === props.repo));
  const dispatch = useAppDispatch();

  const modifiedCheck = (status: GitStatus | undefined): boolean => {
    if (!status) return false;
    return !['absent', 'unmodified', 'ignored'].includes(status);
  }

  const changedCheck = (status: GitStatus | undefined): boolean => {
    if (!status) return false;
    return ['*absent', '*added', '*undeleted', '*modified', '*deleted'].includes(status);
  }

  const stagedCheck = (status: GitStatus | undefined): boolean => {
    if (!status) return false;
    return modifiedCheck(status) && !changedCheck(status);
  }

  const colorFilter = (status: GitStatus | undefined) =>
  (status && stagedCheck(status) ? '#61aeee'
    : (status && changedCheck(status) ? '#d19a66' : undefined));

  const iconFilter = (status: GitStatus | undefined) =>
  (status && stagedCheck(status) ? Remove
    : (status && changedCheck(status) ? Add : undefined));

  // const colorFilter = (status: GitStatus | undefined) => {
  //   switch (status) {
  //     case '*added': // Fallthrough
  //     case 'added':
  //       return '#95bf77'; // green
  //     case '*deleted': // Fallthrough
  //     case 'deleted':
  //       return '#da6473'; // red
  //     case '*modified': // Fallthrough
  //     case 'modified':
  //       return '#d19a66'; // orange
  //     default:
  //       return undefined;
  //   }
  // }
  const optionals = removeUndefinedProperties({ color: colorFilter(props.status), labelInfo: iconFilter(props.status) });
  // const optionals = removeUndefinedProperties({
  //   color: colorFilter(props.status),
  //   labelInfo: (props.status && ['*added', 'added', '*deleted', 'deleted', '*modified', 'modified'].includes(props.status)) ? ReplayIcon : undefined
  // });

  return (
    <StyledTreeItem key={props.id} nodeId={props.id}
      labelText={extractFilename(props.path)}
      {...optionals}
      labelInfoClickHandler={async (e) => {
        e.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
        if (!props.status || !props.repo || !props.branch || !props.path || !repo) {
          console.log('cannot do anything with an unmodified file');
          return;
        }
        if (stagedCheck(props.status)) {
          console.log(`unstaging ${extractFilename(props.path)}...`);
          await remove(props.path, repo, props.branch);
          await props.update();
        } else if (modifiedCheck(props.status)) {
          console.log(`staging ${extractFilename(props.path)}...`);
          await add(props.path, repo, props.branch);
          await props.update();
        }
      }}
      labelIcon={InsertDriveFile}
      enableHover={true}
      onClick={() => (props.status && ['*deleted', 'deleted'].includes(props.status)) ? null : dispatch(loadCard({ filepath: props.path }))}
    />
  );
}

export const DirectoryComponent: React.FunctionComponent<MetafileWithPath> = props => {
  const { directories, files, update } = useDirectory(props.path);
  const [expanded, setExpanded] = useState(false);

  const clickHandle = async () => setExpanded(!expanded);

  return (
    < StyledTreeItem key={props.id} nodeId={props.id}
      labelText={props.name}
      labelIcon={expanded ? FolderOpenIcon : FolderIcon}
      onClick={clickHandle}
    >
      {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
      {files.map(file => <FileComponent key={file.id} update={update} {...file} />)}
    </StyledTreeItem >
  );
};

const Explorer: React.FunctionComponent<{ rootId: UUID }> = props => {
  const rootMetafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.rootId));
  const { directories, files, update } = useDirectory((rootMetafile as MetafileWithPath).path);

  return (
    <>
      {rootMetafile && rootMetafile.branch ? <div className='list-component'>
        <BranchRibbon branch={rootMetafile.branch} />
        <TreeView
          defaultCollapseIcon={<ArrowDropDownIcon />}
          defaultExpandIcon={<ArrowRightIcon />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
          {files.map(file => <FileComponent key={file.id} update={update} {...file} />)}
        </TreeView>
      </div> : null}
    </>
  );
};

export const ExplorerReverse: React.FunctionComponent<Card> = props => {
  const metafile = useAppSelector((state: RootState) => metafileSelectors.selectById(state, props.metafile));
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [repo] = useState(metafile?.repo ? repos.find(r => r.id === metafile.repo) : undefined);

  return (
    <>
      <span>Name:</span><span className='field'>{props.name}</span>
      <span>Update:</span><span className='field'>{props.modified.toLocaleString()}</span>
      <span>Repo:</span><span className='field'>{repo ? repo.name : 'Untracked'}</span>
      {repo ?
        <>
          <span>Branch:</span>{metafile ? <BranchList metafileId={metafile.id} cardId={props.id} /> : undefined}
          <span>Status:</span><span className='field'>{metafile ? metafile.status : ''}</span>
          <span>Versions:</span>{metafile ? <SourceControlButton repoId={repo.id} metafileId={metafile.id} /> : undefined}
        </>
        : undefined}
    </>
  );
};

export default Explorer;