import React from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import type { Card, Stack } from '../../types';
import { RootState } from '../../store/store';
import CardComponent from '../Card/CardComponent';
import { pushCards, popCard } from '../../store/thunks/stacks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import stackSelectors from '../../store/selectors/stacks';
import { stackRemoved } from '../../store/slices/stacks';

const DnDItemType = {
  CARD: 'CARD',
  STACK: 'STACK'
}
type DragObject = {
  id: string,
  type: string
}

const StackComponent: React.FunctionComponent<Stack> = props => {
  const cards = useAppSelector((state: RootState) => cardSelectors.selectEntities(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectEntities(state));
  const capturedCards = useAppSelector((state: RootState) => cardSelectors.selectByStack(state, props.id));
  const dispatch = useAppDispatch();

  // Enable StackComponent as a drop source (i.e. allowing this stack to be draggable)
  const [{ isDragging }, drag] = useDrag({
    type: DnDItemType.STACK,
    item: () => ({ id: props.id, type: DnDItemType.STACK }),
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    })
  }, [props.id]);

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
            dispatch(popCard({ stack: dropTarget, card: dropSource, delta: delta }));
            dispatch(pushCards({ stack: dropTarget, cards: [dropSource] }));
          } else if (!dropSource.captured) {
            dispatch(pushCards({ stack: dropTarget, cards: [dropSource] }));
          }
          break;
        }
        case DnDItemType.STACK: {
          const dropTarget = stacks[props.id];
          const dropSource = stacks[monitor.getItem().id];
          if (dropTarget && dropSource) {
            dispatch(pushCards({
              stack: dropTarget,
              cards: dropSource.cards
                .map(id => cards[id])
                .filter((card): card is Card => card !== undefined)
            }));
            dispatch(stackRemoved(dropSource.id));
          }
          break;
        }
      }
    }
  });

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  return <div className='stack' ref={dragAndDrop} data-testid='stack-component'
    style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
    {capturedCards.map(card => <CardComponent key={card.id} {...card} />)}
    {props.children}
  </div>
}

export default StackComponent;