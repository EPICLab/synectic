import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { Button } from '@material-ui/core';
import TreeView from '@material-ui/lab/TreeView';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ErrorIcon from '@material-ui/icons/Error';
import { v4 } from 'uuid';

import type { UUID } from '../types';
import { RootState } from '../store/root';
import { loadCard } from '../containers/handlers';
import { removeDuplicates } from '../containers/format';
import BranchStatus from './BranchStatus';
import { getMetafile } from '../containers/metafiles';
import { Action } from '../store/actions';
import { StyledTreeItem } from './StyledTreeComponent';
import { GitRepoIcon } from './GitIcons';

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

const VersionStatusButton: React.FunctionComponent = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

  const handleClick = async () => {
    const metafile = await dispatch(getMetafile({ virtual: { name: 'Version Tracker', handler: 'Tracker' } }));
    if (metafile) dispatch(loadCard({ metafile: metafile }));
  }

  return (
    <Button id='versiontracker-button' variant='contained' color='primary' onClick={() => handleClick()}>Versions...</Button>
  );
}

export default VersionStatusButton;