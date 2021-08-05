import React from 'react';
import { useSelector } from 'react-redux';
import TreeView from '@material-ui/lab/TreeView';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ErrorIcon from '@material-ui/icons/Error';
import { v4 } from 'uuid';

import type { UUID } from '../types';
import { RootState } from '../store/root';
import { removeDuplicates } from '../containers/format';
import { StyledTreeItem } from './StyledTreeComponent';
import { GitRepoIcon, GitBranchIcon } from './GitIcons';
import { useBranchStatus } from '../store/hooks/useBranchStatus';

const BranchStatus: React.FunctionComponent<{ repo: UUID, branch: string }> = props => {
  const { cards, modified, status } = useBranchStatus(props.repo, props.branch);

  return (
    <StyledTreeItem key={`${props.repo}-${props.branch}`} nodeId={`${props.repo}-${props.branch}`}
      labelText={`${props.branch} [${modified.length}/${cards.length}]`}
      labelIcon={GitBranchIcon}
      onClick={() => cards.map(async c => await status(c))}
    />);
};

const RepoStatusComponent: React.FunctionComponent<{ repoId: UUID }> = props => {
  const repo = useSelector((state: RootState) => state.repos[props.repoId]);
  const branches = removeDuplicates([...repo.local, ...repo.remote], (a: string, b: string) => a === b);

  return (
    <StyledTreeItem key={repo.id} nodeId={repo.id}
      labelText={repo.name}
      labelIcon={GitRepoIcon}
    >
      {branches.map(branch => <BranchStatus key={v4()} repo={repo.id} branch={branch} />)}
    </StyledTreeItem>
  );
}

export const VersionStatusComponent: React.FunctionComponent = () => {
  const repos = useSelector((state: RootState) => Object.values(state.repos));

  return (
    <div className='version-tracker'>
      <TreeView
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        defaultEndIcon={<div style={{ width: 8 }} />}
      >
        {repos.length == 0 &&
          <StyledTreeItem key={'no-repo'} nodeId={'no-repo'}
            labelText={'[no repos tracked]'}
            labelIcon={ErrorIcon}
          />
        }
        {repos.length > 0 && repos.map(repo => <RepoStatusComponent key={repo.id} repoId={repo.id} />)}
      </TreeView>
    </div>
  );
};

export default VersionStatusComponent;