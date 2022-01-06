import React, { useEffect, useState } from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { Info, ArrowDropDown, ArrowRight } from '@material-ui/icons';
import type { Card, Metafile } from '../../types';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { BranchRibbon } from '../SourceControl/BranchRibbon';
import { BranchList } from '../SourceControl/BranchList';
import { useAppSelector } from '../../store/hooks';
import metafileSelectors from '../../store/selectors/metafiles';
import repoSelectors from '../../store/selectors/repos';
import useDirectory from '../../containers/hooks/useDirectory';
import DataField from '../Card/DataField';
import { SourceControlButton } from "../SourceControl/SourceControlButton";
import { DirectoryComponent } from './DirectoryComponent';
import { FileComponent } from './FileComponent';
import { DateTime } from 'luxon';
import { useGitHistory } from '../../containers/hooks/useGitHistory';

const Explorer: React.FunctionComponent<{ root: Metafile }> = props => {
  const { directories, files, update } = useDirectory(props.root.path);

  return (
    <>
      <div className='list-component'>
        {props.root.branch ? <BranchRibbon branch={props.root.branch} /> : null}
        <TreeView
          defaultCollapseIcon={<ArrowDropDown />}
          defaultExpandIcon={<ArrowRight />}
          defaultEndIcon={<div style={{ width: 8 }} />}
        >
          {directories.length === 0 && files.length === 0 ?
            <StyledTreeItem key={'loading'} nodeId={'loading'} labelText={'loading...'} labelIcon={Info} /> : null}
          {directories.filter(dir => !dir.name.startsWith('.') && dir.name !== 'node_modules').map(dir => <DirectoryComponent key={dir.id} {...dir} />)}
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
  const { commits, heads, update } = useGitHistory(repo);

  useEffect(() => { update() }, [metafile?.repo]);

  const formatHeadCommit = (branch: string | undefined) => {
    if (branch) {
      const sha1 = heads.get(`local/${branch}`);
      const commitInfo = sha1 ? commits.get(sha1) : undefined;
      if (commitInfo) return `${commitInfo.oid.slice(0, 6)}  ${commitInfo.commit.message.slice(0, 15)}`;
    }
    return '[detached]';
  }

  return (
    <>
      <div className='buttons'>
        {repo && metafile && <SourceControlButton repoId={repo.id} metafileId={metafile.id} mode='dark' />}
      </div>
      <DataField title='UUID' textField field={props.id} />
      <DataField title='Path' textField field={metafile?.path?.toString()} />
      <DataField title='Update' textField field={DateTime.fromMillis(props.modified).toLocaleString(DateTime.DATETIME_SHORT)} />
      <DataField title='Repo' textField field={repo ? repo.name : 'Untracked'} />

      {repo && metafile ?
        <>
          <DataField title='Status' textField field={metafile?.status} />
          <DataField title='Branch' field={<BranchList metafileId={metafile.id} cardId={props.id} />} />
          <DataField title='Head' textField field={formatHeadCommit(metafile.branch)} />
        </>
        : undefined}
    </>
  );
};

export default Explorer;