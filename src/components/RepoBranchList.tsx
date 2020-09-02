import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { ThunkDispatch } from 'redux-thunk';
import { Button } from '@material-ui/core';
import TreeView from '@material-ui/lab/TreeView';
import TreeItem from '@material-ui/lab/TreeItem';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { v4 } from 'uuid';

import { RootState } from '../store/root';
import { UUID } from '../types';
import { loadCard } from '../containers/handlers';
import { removeDuplicates } from '../containers/format';
import BranchComponent from './BranchStatusComponent';
import { getMetafile } from '../containers/metafiles';
import { Action } from '../store/actions';


const RepoStatusComponent: React.FunctionComponent<{ repoId: UUID }> = props => {
  const repo = useSelector((state: RootState) => state.repos[props.repoId]);
  const branches = removeDuplicates([...repo.local, ...repo.remote], (a: string, b: string) => a === b);

  return (
    <TreeItem key={repo.id} nodeId={repo.id} label={repo.name}>
      {branches.map(branch => <BranchComponent key={v4()} repo={repo.id} branch={branch} />)}
    </TreeItem>
  );
}

export const VersionStatusComponent: React.FunctionComponent = () => {
  const repos = useSelector((state: RootState) => Object.values(state.repos));

  return (
    <div className='version-tracker'>
      <TreeView
        defaultParentIcon={<img width="20px" src="../assets/git_light.png" alt="Repo" />}
        defaultEndIcon={<div className="file-icon"><img width="20px" src="../assets/git_branch_light.png" alt="Branch" /></div>}
        defaultCollapseIcon={<><div className="folder-icon"><ExpandMoreIcon /></div> <img width="20px" src="../assets/git_light.png" alt="Repo" /></>}
        defaultExpandIcon={<><div className="folder-icon"><ChevronRightIcon /></div> <img width="20px" src="../assets/git_light.png" alt="Repo" /></>}
      >
        {repos.length == 0 && <TreeItem key={'no-repo'} nodeId={'no-repo'} label={'[no repos tracked]'} />}
        {repos.length > 0 && repos.map(repo => <RepoStatusComponent key={repo.id} repoId={repo.id} />)}
      </TreeView>
    </div>
  );
};

const VersionStatusButton: React.FunctionComponent = () => {
  const dispatch = useDispatch<ThunkDispatch<RootState, undefined, Action>>();

  const handleClick = async () => {
    const metafile = await dispatch(getMetafile({ virtual: { name: 'Version Tracker', handler: 'Tracker' } }));
    if (metafile) dispatch(loadCard({ metafiles: [metafile] }));
  }

  return (
    <Button id='versiontracker-button' variant='contained' color='primary' onClick={() => handleClick()}>Versions...</Button>
  );
}

export default VersionStatusButton;