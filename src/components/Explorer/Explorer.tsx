import React, { useState } from 'react';
import TreeView from '@material-ui/lab/TreeView';
import InfoIcon from '@material-ui/icons/Info';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import type { Card, Metafile } from '../../types';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { BranchRibbon } from '../BranchRibbon';
import { BranchList } from '../BranchList';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import useDirectory from '../../containers/hooks/useDirectory';
import { SourceControlButton } from '../SourceControl';
import { DirectoryComponent } from './DirectoryComponent';
import { FileComponent } from './FileComponent';

const Explorer: React.FunctionComponent<{ root: Metafile }> = props => {
  const { directories, files, update } = useDirectory(props.root.path);

  return (
    <>
      <div className='list-component'>
        {props.root.branch ? <BranchRibbon branch={props.root.branch} /> : null}
        <TreeView
          defaultCollapseIcon={<ArrowDropDownIcon />}
          defaultExpandIcon={<ArrowRightIcon />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {directories.length === 0 && files.length === 0 ?
            <StyledTreeItem key={'loading'} nodeId={'loading'} labelText={'loading...'} labelIcon={InfoIcon} /> : null}
          {directories.map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
          {files.map(file => <FileComponent key={file.id} update={update} {...file} />)}
        </TreeView>
      </div>
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