import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ErrorIcon from '@material-ui/icons/Error';
import { v4 } from 'uuid';
import type { UUID } from '../types';
import { RootState } from '../store/store';
import { removeDuplicates } from '../containers/format';
import { StyledTreeItem } from './StyledTreeComponent';
import { GitRepoIcon, GitBranchIcon } from './GitIcons';
import { useAppSelector } from '../store/hooks';
import { getCardsByRepo, repoSelectors } from '../store/selectors/repos';
import { metafileSelectors } from '../store/selectors/metafiles';

const modifiedStatuses = ['modified', '*modified', 'deleted', '*deleted', 'added', '*added', '*absent', '*undeleted', '*undeletedmodified'];

const BranchStatus: React.FunctionComponent<{ repo: UUID, branch: string }> = props => {
  const cards = useAppSelector((state: RootState) => getCardsByRepo(state, props.repo, props.branch));
  const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectAll(state));
  const modified = cards.map(c => metafiles.find(m => m.id === c.metafile)).filter(m => modifiedStatuses.includes(m.status));

  return (
    <StyledTreeItem key={`${props.repo}-${props.branch}`} nodeId={`${props.repo}-${props.branch}`}
      labelText={`${props.branch} [${modified.length}/${cards.length}]`}
      labelIcon={GitBranchIcon}
      onClick={() => console.log(`Branch ${props.branch}:\nmodified: ${JSON.stringify(modified, undefined, 2)}\ncards: ${JSON.stringify(cards, undefined, 2)}`)}
    />);
};

const RepoStatusComponent: React.FunctionComponent<{ repoId: UUID }> = props => {
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
  const branches = repo ? removeDuplicates([...repo.local, ...repo.remote], (a: string, b: string) => a === b) : [];

  return repo ? (
    <StyledTreeItem key={repo.id} nodeId={repo.id} labelText={repo.name} labelIcon={GitRepoIcon}>
      {branches.map(branch => <BranchStatus key={v4()} repo={repo.id} branch={branch} />)}
    </StyledTreeItem >
  ) : null;
}

export const VersionStatusComponent: React.FunctionComponent = () => {
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));

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