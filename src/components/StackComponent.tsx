import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ConnectableElement, useDrag, useDrop } from 'react-dnd';

import type { Stack } from '../types';
import { RootState } from '../store/root';
import CardComponent from './CardComponent';
import { pushCards, popCard } from '../containers/stacks';
import { Action, ActionKeys } from '../store/actions';

const StackComponent: React.FunctionComponent<Stack> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const stacks = useSelector((state: RootState) => state.stacks);
  const dispatch = useDispatch();

  // Enable StackComponent as a drop source (i.e. allowing this stack to be draggable)
  const [{ isDragging }, drag] = useDrag({
    item: { type: 'STACK', id: props.id },
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    })
  });

  // Enable StackComponent as a drop target (i.e. allow other elements to be dropped on this stack)
  const [, drop] = useDrop({
    accept: ['CARD', 'STACK'],
    canDrop: (item, monitor) => {
      const dropTarget = stacks[props.id];
      const dropSource = item.type === 'CARD' ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      return dropTarget && dropTarget.id !== dropSource.id; // restrict dropped items from accepting a self-referencing drop (i.e. dropping a stack on itself)
    },
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case 'CARD': {
          const dropTarget = stacks[props.id];
          const dropSource = cards[monitor.getItem().id];
          if (dropSource.captured) {
            dispatch(popCard(dropTarget, dropSource, delta));
          }
          break;
        }
        case 'STACK': {
          const dropTarget = stacks[props.id];
          const dropSource = stacks[monitor.getItem().id];
          const actions: Action[] = pushCards(dropTarget, dropSource.cards.map(id => cards[id]));
          actions.push({ type: ActionKeys.REMOVE_STACK, id: dropSource.id });
          actions.map(action => dispatch(action));
          break;
        }
      }
    }
  });

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  return <div className='stack' ref={dragAndDrop} style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
    {props.cards.map(cardId => {
      const card = cards[cardId];
      return <CardComponent key={card.id} {...card} />;
    })}
    {props.children}
  </div>
}

export default StackComponent;