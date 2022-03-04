import React from 'react';
import TreeView from '@material-ui/lab/TreeView';
import { ArrowDropDown, ArrowRight, Error } from '@material-ui/icons';
import { v4 } from 'uuid';
import type { Repository, Branch } from '../../types';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitRepoIcon, GitBranchIcon } from '../GitIcons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import repoSelectors from '../../store/selectors/repos';
import cardSelectors from '../../store/selectors/cards';
import { loadCard } from '../../store/thunks/handlers';
import { checkoutBranch } from '../../store/thunks/repos';
import { fetchMetafile, fetchVersionControl, isFilebasedMetafile } from '../../store/thunks/metafiles';
import branchSelectors from '../../store/selectors/branches';
import { readDirAsync } from '../../containers/io';
import { currentBranch } from '../../containers/git-porcelain';
import { metafileUpdated } from '../../store/slices/metafiles';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { DnDItemType } from '../CanvasComponent';
import { modalAdded } from '../../store/slices/modals';

type DragObject = {
  id: string,
  type: string
}

const BranchStatus: React.FunctionComponent<{ repo: Repository, branch: Branch }> = props => {
  const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
  const cards = useAppSelector((state: RootState) => cardSelectors.selectByRepo(state, props.repo.id, props.branch.id));
  const dispatch = useAppDispatch();

  // Enable BranchStatus as a drop source (i.e. allowing this component to be draggable)
  const [{ isDragging }, drag] = useDrag({
    type: DnDItemType.BRANCH,
    item: () => ({ id: props.branch.id, type: DnDItemType.CARD }),
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }, [props.branch.id]);

  // Enable BranchStatus as a drop target (i.e. allow other elements to be dropped on this component)
  const [{ isOver }, drop] = useDrop({
    accept: [DnDItemType.BRANCH],
    canDrop: (item: { id: string, type: string }, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = props.branch;
      const dropSource = branches[monitor.getItem().id];
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
      const nonSelf = dropSource ? (dropTarget.id !== dropSource.id) : false;
      const sameRepo = dropSource ? props.repo.local.includes(dropSource.id) || props.repo.remote.includes(dropSource.id) : false;
      return nonSelf && sameRepo;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = props.branch;
      const dropSource = branches[monitor.getItem().id];
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      if (dropSource) dispatch(modalAdded({ id: v4(), type: 'MergeSelector', options: { repo: props.repo.id, base: dropTarget.id, compare: dropSource.id } }));
    },
    collect: monitor => ({
      isOver: !!monitor.isOver() // return isOver prop to highlight drop sources that accept hovered item
    })
  }, [branches]);

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  // load a new Explorer card containing the root of the repository at the specified branch
  const clickHandle = async () => {
    // undefined root indicates the main worktree, and any linked worktrees, are not associated with that branch
    const directoryContent = (await readDirAsync(props.branch.root));
    const empty = directoryContent.length == 0 || (directoryContent.length == 1 && directoryContent.includes('.git')); // a .git sub-directory still counts as empty
    const current = await currentBranch({ dir: props.branch.root });
    let metafile = await dispatch(fetchMetafile({ filepath: props.branch.root })).unwrap();
    const vcs = isFilebasedMetafile(metafile) ? await dispatch(fetchVersionControl(metafile)).unwrap() : undefined;
    metafile = vcs ? dispatch(metafileUpdated({ ...metafile, ...vcs })).payload : metafile;
    const updated = (empty || props.branch.ref !== current)
      ? await dispatch(checkoutBranch({ metafileId: metafile.id, branchRef: props.branch.ref })).unwrap()
      : metafile;
    if (updated) {
      dispatch(loadCard({ metafile: updated }));
    }
  }

  return (
    <div ref={dragAndDrop}>
      <StyledTreeItem
        className={`${isOver ? 'drop-source' : ''}`}
        style={{ opacity: isDragging ? 0 : 1 }}
        key={`${props.repo}-${props.branch.id}`}
        nodeId={`${props.repo}-${props.branch.id}`}
        labelText={`${props.branch.ref} [${cards.length}]`}
        labelIcon={GitBranchIcon}
        onClick={clickHandle}
      />
    </div>
  );
};

const RepoStatus: React.FunctionComponent<{ repo: Repository }> = props => {
  const branches = useAppSelector((state: RootState) => branchSelectors.selectByRepo(state, props.repo, true));

  return (
    <StyledTreeItem key={props.repo.id} nodeId={props.repo.id} labelText={props.repo.name} labelIcon={GitRepoIcon}>
      {branches.filter(branch => branch.ref !== 'HEAD').map(branch => <BranchStatus key={v4()} repo={props.repo} branch={branch} />)}
    </StyledTreeItem >
  );
}

const BranchTracker: React.FunctionComponent = () => {
  const repos = useAppSelector((state: RootState) => repoSelectors.selectAll(state));
  const [expanded, setExpanded] = React.useState(repos.length > 0 ? [repos[0].id] : []); // initial state; expand first listed repo

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