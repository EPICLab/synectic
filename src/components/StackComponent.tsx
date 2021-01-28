import React from 'react';
import { useSelector } from 'react-redux';
import { useDrag } from 'react-dnd';

import type { Stack } from '../types';
import { RootState } from '../store/root';
import CardComponent from './CardComponent';

const StackComponent: React.FunctionComponent<Stack> = props => {
  const cards = useSelector((state: RootState) => state.cards);

  const [{ isDragging }, drag] = useDrag({
    item: { type: 'STACK', id: props.id },
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    })
  });

  return <div className='stack' ref={drag} style={{ left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}>
    {props.cards.map(cardId => {
      const card = cards[cardId];
      return <CardComponent key={card.id} {...card} />;
    })}
    {props.children}
  </div>
}

export default StackComponent;