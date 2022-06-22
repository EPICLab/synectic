import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { ArrowDropDown, ArrowRight, Error } from '@material-ui/icons';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import RepoStatus from './RepoStatus';

const BranchTracker = () => {
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [expanded, setExpanded] = React.useState(repos[0] ? [repos[0].id] : []); // initial state; expand first listed repo

  const handleToggle = (_event: React.ChangeEvent<Record<string, unknown>>, nodeIds: string[]) => setExpanded(nodeIds);

  return (
    <div className='version-tracker'>
      <TreeView
        defaultCollapseIcon={<ArrowDropDown />}
        defaultExpandIcon={<ArrowRight />}
        defaultEndIcon={<div style={{ width: 8 }} />}
        expanded={expanded}
        onNodeToggle={handleToggle}
      >
        {repos.length == 0 &&
          <StyledTreeItem key={'no-repo'} nodeId={'no-repo'}
            labelText={'[no repos tracked]'}
            labelIcon={Error}
          />
        }
        {repos.length > 0 && repos.map(repo => <RepoStatus key={repo.id} repo={repo} />)}
      </TreeView>
    </div>
  );
};

export default BranchTracker;