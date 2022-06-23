import React from 'react';
import { v4 } from 'uuid';
import { RootState } from '../../store/store';
import { StyledTreeItem } from '../StyledTreeComponent';
import { GitBranchIcon } from '../GitIcons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import branchSelectors from '../../store/selectors/branches';
import { readDirAsync } from '../../containers/io';
import { currentBranch } from '../../containers/git-porcelain';
import { isFilebasedMetafile } from '../../store/slices/metafiles';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { DnDItemType } from '../Canvas/Canvas';
import { modalAdded } from '../../store/slices/modals';
import { Repository } from '../../store/slices/repos';
import { Branch } from '../../store/slices/branches';
import { fetchMetafile, updatedVersionedMetafile } from '../../store/thunks/metafiles';
import { checkoutBranch } from '../../store/thunks/branches';
import { createCard } from '../../store/thunks/cards';

export type DragObject = {
    id: string,
    type: string
}

const BranchStatus = (props: { repo: Repository; branch: Branch; }) => {
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
        canDrop: (_item, monitor: DropTargetMonitor<DragObject, void>) => {
            const dropTarget = props.branch;
            const dropSource = branches[monitor.getItem().id];
            // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
            const nonSelf = dropSource ? (dropTarget.id !== dropSource.id) : false;
            const sameRepo = dropSource ? props.repo.local.includes(dropSource.id) || props.repo.remote.includes(dropSource.id) : false;
            return nonSelf && sameRepo;
        },
        drop: (_item, monitor: DropTargetMonitor<DragObject, void>) => {
            const dropTarget = props.branch;
            const dropSource = branches[monitor.getItem().id];
            const delta = monitor.getDifferenceFromInitialOffset();
            if (!delta)
                return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
            if (dropSource)
                dispatch(modalAdded({ id: v4(), type: 'MergeSelector', options: { repo: props.repo.id, base: dropTarget.id, compare: dropSource.id } }));
        },
        collect: monitor => ({
            isOver: !!monitor.isOver() // return isOver prop to highlight drop sources that accept hovered item
        })
    }, [branches]);

    const dragAndDrop = (elementOrNode: ConnectableElement) => {
        drag(elementOrNode);
        drop(elementOrNode);
    };

    // load a new Explorer card containing the root of the repository at the specified branch
    const handleClick = async () => {
        // undefined root indicates the main worktree, and any linked worktrees, are not associated with that branch
        const directoryContent = (await readDirAsync(props.branch.root));
        const empty = directoryContent.length == 0 || (directoryContent.length == 1 && directoryContent.includes('.git')); // a .git sub-directory still counts as empty
        const current = await currentBranch({ dir: props.branch.root });
        let metafile = await dispatch(fetchMetafile(props.branch.root)).unwrap();
        metafile = isFilebasedMetafile(metafile) ? await dispatch(updatedVersionedMetafile(metafile)).unwrap() : metafile;
        const updated = (empty || props.branch.ref !== current)
            ? await dispatch(checkoutBranch({ metafileId: metafile.id, branchRef: props.branch.ref })).unwrap()
            : metafile;
        if (updated) {
            dispatch(createCard({ metafile: updated }));
        }
    };

    return (
        <div ref={dragAndDrop}>
            <StyledTreeItem
                className={`${isOver ? 'drop-source' : ''}`}
                style={{ opacity: isDragging ? 0 : 1 }}
                key={`${props.repo}-${props.branch.id}`}
                nodeId={`${props.repo}-${props.branch.id}`}
                labelText={`${props.branch.scope}/${props.branch.ref} [${cards.length}]`}
                labelIcon={GitBranchIcon}
                onClick={handleClick} />
        </div>
    );
};

export default BranchStatus;
