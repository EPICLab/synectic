import React from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import type { Card, Stack } from '../types';
import { RootState } from '../store/store';
import CardComponent from './CardComponent';
import { pushCards, popCard } from '../containers/stacks';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { cardSelectors } from '../store/selectors/cards';
import { stackSelectors } from '../store/selectors/stacks';
import { stackRemoved } from '../store/slices/stacks';

const DnDItemType = {
  CARD: 'CARD',
  STACK: 'STACK'
}
type DragObject = {
  id: string,
  type: string
}

const StackComponent: React.FunctionComponent<Stack> = props => {
  const cards = useAppSelector((state: RootState) => cardSelectors.selectAll(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectAll(state));
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
      const dropTarget = stacks.find(s => s.id === props.id);
      const dropSource = item.type === DnDItemType.CARD ?
        cards.find(c => c.id === monitor.getItem().id) :
        stacks.find(s => s.id === monitor.getItem().id);
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a stack on itself)
      return (dropTarget && dropSource) ? (dropTarget.id !== dropSource.id) : false;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case DnDItemType.CARD: {
          const dropTarget = stacks.find(s => s.id === props.id);
          const dropSource = cards.find(c => c.id === monitor.getItem().id);
          if (dropTarget && dropSource && dropSource.captured) {
            dispatch(popCard({ stack: dropTarget, card: dropSource, delta: delta }));
          }
          break;
        }
        case DnDItemType.STACK: {
          const dropTarget = stacks.find(s => s.id === props.id);
          const dropSource = stacks.find(s => s.id === monitor.getItem().id);
          if (dropTarget && dropSource) {
            dispatch(pushCards({
              stack: dropTarget,
              cards: dropSource.cards
                .map(id => cards.find(c => c.id === id))
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
    {props.cards.map(cardId => {
      const card = cards.find(c => c.id === cardId);
      return card ? <CardComponent key={card.id} {...card} /> : undefined;
    })}
    {props.children}
  </div>
}

export default StackComponent;