
import React, { PropsWithChildren, useEffect } from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { RootState } from '../../store/store';
import StackPreview from './StackPreview';
import CardComponent from '../Card';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import stackSelectors from '../../store/selectors/stacks';
import { Stack, stackRemoved } from '../../store/slices/stacks';
import { useIconButtonStyle } from '../Button/useStyledIconButton';
import CloseIcon from '@material-ui/icons/Close';
import CommitButton from '../Button/Commit';
import SaveButton from '../Button/Save';
import StageButton from '../Button/Stage';
import UnstageButton from '../Button/Unstage';
import { IconButton, Tooltip } from '@material-ui/core';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { popCards, pushCards } from '../../store/thunks/stacks';
import { DnDItemType } from '../Canvas/Canvas';

type DragObject = {
  id: string,
  type: string
}

const StackComponent = (props: PropsWithChildren<Stack>) => {
  const cards = useAppSelector((state: RootState) => cardSelectors.selectEntities(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectEntities(state));
  const capturedCards = useAppSelector((state: RootState) => cardSelectors.selectByStack(state, props.id));
  const dispatch = useAppDispatch();
  const classes = useIconButtonStyle({ mode: 'light' });

  // Enable StackComponent as a drop source (i.e. allowing this stack to be draggable)
  const [{ isDragging }, drag, preview] = useDrag({
    type: DnDItemType.STACK,
    item: () => ({ id: props.id, type: DnDItemType.STACK }),
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    })
  }, [props.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { preview(getEmptyImage(), { captureDraggingState: true }) }, []);

  // Enable StackComponent as a drop target (i.e. allow other elements to be dropped on this stack)
  const [, drop] = useDrop({
    accept: [DnDItemType.CARD, DnDItemType.STACK],
    canDrop: (item: { id: string, type: string }, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = stacks[props.id];
      const dropSource = item.type === DnDItemType.CARD ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a stack on itself)
      return (dropTarget && dropSource) ? (dropTarget.id !== dropSource.id) : false;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case DnDItemType.CARD: {
          const dropTarget = stacks[props.id];
          const dropSource = cards[monitor.getItem().id];
          if (!dropTarget || !dropSource) return; // something isn't correct with this drop event
          if (dropSource.captured && dropSource.captured !== dropTarget.id) {
            dispatch(popCards({ cards: [dropSource.id], delta: delta }));
            dispatch(pushCards({ stack: dropTarget.id, cards: [dropSource.id] }));
          } else if (!dropSource.captured) {
            dispatch(pushCards({ stack: dropTarget.id, cards: [dropSource.id] }));
          }
          break;
        }
        case DnDItemType.STACK: {
          const dropTarget = stacks[props.id];
          const dropSource = stacks[monitor.getItem().id];
          if (dropTarget && dropSource) {
            dispatch(pushCards({
              stack: dropTarget.id,
              cards: dropSource.cards
            }));
            dispatch(stackRemoved(dropSource.id));
          }
          break;
        }
      }
    }
  });
  const close = async () => await dispatch(popCards({ cards: capturedCards.map(c => c.id) }));

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  return (
    <>
      <div className='stack' ref={dragAndDrop} data-testid='stack-component'
        style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
        <Tooltip title='Close Stack'><IconButton className={classes.root} aria-label='close' onClick={close} ><CloseIcon /></IconButton></Tooltip>
        <StageButton cardIds={capturedCards.map(c => c.id)} />
        <UnstageButton cardIds={capturedCards.map(c => c.id)} />
        <CommitButton cardIds={capturedCards.map(c => c.id)} />
        <SaveButton cardIds={capturedCards.map(c => c.id)} />
        {capturedCards.map(card => <CardComponent key={card.id} {...card} />)}
        {props.children}
      </div>
      <StackPreview stack={props} cards={capturedCards} />
    </>
  )
}

export default StackComponent;