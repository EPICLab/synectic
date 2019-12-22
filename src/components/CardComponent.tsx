import React from 'react';
import { useDispatch } from 'react-redux';
import { useDrag } from 'react-dnd';

import { Card } from '../types';
import { ActionKeys } from '../store/actions';
import Header from './Header';

export const CardComponent: React.FunctionComponent<Card> = props => {
  const dispatch = useDispatch();
  const [{ isDragging }, drag] = useDrag({
    item: { type: 'CARD', id: props.id },
    collect: monitor => ({
      item: monitor.getItem(),
      isDragging: !!monitor.isDragging()
    })
  });

  return <div className='card' ref={drag} style={{
    left: props.left,
    top: props.top,
    opacity: isDragging ? 0 : 1
  }}>
    <Header title={props.name}>
      <button className='close' onClick={() => dispatch({ type: ActionKeys.REMOVE_CARD, id: props.id })} />
    </Header>
    {props.children}
  </div>;
};