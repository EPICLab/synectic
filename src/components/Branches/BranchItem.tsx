import { DeleteForever as Delete } from '@material-ui/icons';
import React from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { v4 } from 'uuid';
import { getBranchMotif } from '../../containers/motif';
import { removeUndefinedProperties } from '../../containers/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import branchSelectors from '../../store/selectors/branches';
import repoSelectors from '../../store/selectors/repos';
import { modalAdded } from '../../store/slices/modals';
import { RootState } from '../../store/store';
import { addBranch, removeBranch, updateBranches } from '../../store/thunks/branches';
import { createCard } from '../../store/thunks/cards';
import { fetchMetafile } from '../../store/thunks/metafiles';
import { UUID } from '../../store/types';
import { DnDItemType } from '../Canvas/Canvas';
import { GitBranchIcon } from '../GitIcons';
import { StyledTreeItem } from '../StyledTreeComponent';

export type DragObject = {
    id: string,
    type: string
}

const BranchItem = (props: { repoId: UUID, branchId: UUID }) => {
    const branches = useAppSelector((state: RootState) => branchSelectors.selectEntities(state));
    const branch = useAppSelector((state: RootState) => branchSelectors.selectById(state, props.branchId));
    const repo = useAppSelector((state: RootState) => repoSelectors.selectById(state, props.repoId));
    const motif = branch ? getBranchMotif(branch) : undefined;
    const optionals = removeUndefinedProperties({ color: motif?.color });
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
        if (branch && repo) {
            const success = await dispatch(removeBranch({ repoId: repo.id, branch: branch })).unwrap();
            dispatch(modalAdded({
                id: v4(), type: 'Notification',
                options: { 'message': `Branch '${branch.ref}' ${success ? 'successfully' : 'cannot be'} deleted` }
            }));
        }
    }

    const handleClick = async () => {
        if (branch && repo) {
            const updatedBranch = await dispatch(addBranch({ ref: branch.ref, root: repo.root })).unwrap();
            if (updatedBranch) dispatch(updateBranches(repo));
            const metafile = updatedBranch ? await dispatch(fetchMetafile(updatedBranch.root)).unwrap() : undefined;
            if (metafile) dispatch(createCard({ metafile: metafile }));
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
                {...optionals}
                labelIcon={GitBranchIcon}
                labelInfo={Delete}
                labelInfoClickHandler={handleLabelInfoClick}
                enableHover={true}
                onClick={handleClick}
            />
        </div>
    )
}

export default BranchItem;