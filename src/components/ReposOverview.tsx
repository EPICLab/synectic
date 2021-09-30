import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ArrowRightIcon from '@material-ui/icons/ArrowRight';
import ErrorIcon from '@material-ui/icons/Error';
import { v4 } from 'uuid';
import type { UUID, Repository } from '../types';
import { RootState } from '../store/store';
import { removeDuplicates } from '../containers/format';
import { StyledTreeItem } from './StyledTreeComponent';
import { GitRepoIcon, GitBranchIcon } from './GitIcons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { getCardsByRepo, repoSelectors } from '../store/selectors/repos';
import { metafileSelectors } from '../store/selectors/metafiles';
import { loadCard } from '../containers/handlers';
import { getBranchRoot } from '../containers/git-porcelain';
import { getMetafile } from '../containers/metafiles';
import { checkoutBranch } from '../containers/repos';

const modifiedStatuses = ['modified', '*modified', 'deleted', '*deleted', 'added', '*added', '*absent', '*undeleted', '*undeletedmodified'];

const BranchStatus: React.FunctionComponent<{ repo: Repository, branch: string }> = props => {
  const cards = useAppSelector((state: RootState) => getCardsByRepo(state, props.repo.id, props.branch));
  const metafiles = useAppSelector((state: RootState) => metafileSelectors.selectAll(state));
  const modified = cards.map(c => metafiles.find(m => m.id === c.metafile)).filter(m => modifiedStatuses.includes(m.status));
  const dispatch = useAppDispatch();

  // load a new Explorer card containing the root of of the repository at the specified branch
  const clickHandle = async () => {
    const branchRoot = await getBranchRoot(props.repo, props.branch);

    // undefined branchRoot indicates the main worktree, and any linked worktrees, are not associated with that branch
    if (branchRoot) {
      dispatch(loadCard({ filepath: branchRoot }));
    } else {
      const metafile = await dispatch(getMetafile({ filepath: props.repo.root })).unwrap();
      const updated = await dispatch(checkoutBranch({ metafileId: metafile.id, branch: props.branch })).unwrap();
      dispatch(loadCard({ metafile: updated }));
    }
  }

  return (
    <StyledTreeItem key={`${props.repo}-${props.branch}`} nodeId={`${props.repo}-${props.branch}`}
      labelText={`${props.branch} [${modified.length}/${cards.length}]`}
      labelIcon={GitBranchIcon}
      onClick={clickHandle}
    />);
};

const RepoStatusComponent: React.FunctionComponent<{ repoId: UUID }> = props => {
  const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
  const branches = repo ? removeDuplicates([...repo.local, ...repo.remote], (a: string, b: string) => a === b) : [];

  return repo ? (
    <StyledTreeItem key={repo.id} nodeId={repo.id} labelText={repo.name} labelIcon={GitRepoIcon}>
      {branches.map(branch => <BranchStatus key={v4()} repo={repo} branch={branch} />)}
    </StyledTreeItem >
  ) : null;
}

export const ReposOverview: React.FunctionComponent = () => {
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [expanded, setExpanded] = React.useState(repos.length > 0 ? [repos[0].id] : []); // initial state; expand first listed repo

  const handleToggle = (_event: React.ChangeEvent<Record<string, unknown>>, nodeIds: string[]) => setExpanded(nodeIds);

  return (
    <div className='version-tracker'>
      <TreeView
        defaultCollapseIcon={<ArrowDropDownIcon />}
        defaultExpandIcon={<ArrowRightIcon />}
        defaultEndIcon={<div style={{ width: 8 }} />}
        expanded={expanded}
        onNodeToggle={handleToggle}
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

export default ReposOverview;