import { DeleteForever as Delete } from '@material-ui/icons';
import React from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { v4 } from 'uuid';
import { deleteBranch } from '../../containers/git';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import cardSelectors from '../../store/selectors/cards';
import repoSelectors from '../../store/selectors/repos';
import { modalAdded } from '../../store/slices/modals';
import { RootState } from '../../store/store';
import { updateRepositoryBranches } from '../../store/thunks/branches';
import { UUID } from '../../store/types';
import { DnDItemType } from '../Canvas/Canvas';
import { GitBranchIcon } from '../GitIcons';
import { StyledTreeItem } from '../StyledTreeComponent';

export type DragObject = {
    id: string,
    type: string
}

// TODO: Branches component is the translation of the BranchTracker/BranchStatus component
const BranchItem = (props: { repoId: UUID, branchId: UUID }) => {
    const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
    const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, props.branchId));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
    const cards = useAppSelector((state: RootState) => cardSelectors.selectByRepo(state, props.repoId, props.branchId));
    const dispatch = useAppDispatch();

    // Enable BranchItem as a drop source (i.e. allowing this component to be draggable)
    const [{ isDragging }, drag] = useDrag({
        type: DnDItemType.BRANCH,
        item: () => ({ id: props.branchId, type: DnDItemType.CARD }),
        collect: monitor => ({
            isDragging: !!monitor.isDragging()
        })
    }, [props.branchId]);

    // Enable BranchItem as a drop target (i.e. allow other elements to be dropped on this component)
    const [{ isOver }, drop] = useDrop({
        accept: [DnDItemType.BRANCH],
        canDrop: (_item, monitor: DropTargetMonitor<DragObject, void>) => {
            const dropTarget = branch;
            const dropSource = branches[monitor.getItem().id];
            // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
            const nonSelf = dropSource ? (dropTarget?.id !== dropSource.id) : false;
            const sameRepo = (dropSource && repo) ? repo.local.includes(dropSource.id) || repo.remote.includes(dropSource.id) : false;
            return nonSelf && sameRepo;
        },
        drop: (_item, monitor: DropTargetMonitor<DragObject, void>) => {
            const dropTarget = branch;
            const dropSource = branches[monitor.getItem().id];
            const delta = monitor.getDifferenceFromInitialOffset();
            if (!delta)
                return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
            if (dropSource && dropTarget)
                dispatch(modalAdded({ id: v4(), type: 'MergeSelector', options: { repo: props.repoId, base: dropTarget.id, compare: dropSource.id } }));
        },
        collect: monitor => ({
            isOver: !!monitor.isOver() // return isOver prop to highlight drop sources that accept hovered item
        })
    }, [branches]);

    const dragAndDrop = (elementOrNode: ConnectableElement) => {
        drag(elementOrNode);
        drop(elementOrNode);
    };

    const handleLabelInfoClick = async (event: React.MouseEvent) => {
        event.stopPropagation(); // prevent propogating the click event to the StyleTreeItem onClick method
        if (branch) {
            const success = await deleteBranch({ dir: branch.root, branchName: branch.ref });
            if (success && repo) dispatch(updateRepositoryBranches(repo));
            dispatch(modalAdded({
                id: v4(), type: 'Notification',
                options: { 'message': `Branch '${branch.ref}' ${success ? 'successfully' : 'cannot be'} deleted` }
            }));
        }
    }

    return (
        <div ref={dragAndDrop}>
            <StyledTreeItem
                className={`${isOver ? 'drop-source' : ''}`}
                style={{ opacity: isDragging ? 0 : 1 }}
                key={`${props.repoId}-${props.branchId}`}
                nodeId={`${props.repoId}-${props.branchId}`}
                labelText={`${branch?.scope}/${branch?.ref}`}
                labelIcon={GitBranchIcon}
                labelInfo={Delete}
                labelInfoClickHandler={handleLabelInfoClick}
                enableHover={true}
            >
                <StyledTreeItem
                    nodeId={`${props.repoId}-${props.branchId}-card-count`}
                    labelText={`Cards: ${cards.length}`}
                />
            </StyledTreeItem>
        </div>
    )
}

export default BranchItem;