import React from 'react';
// eslint-disable-next-line import/named
import { useDrop, XYCoord } from 'react-dnd';
import { Canvas } from '../store/types';
import { RootState } from '../store/root';
import { useSelector, useDispatch } from 'react-redux';
import { CardComponent } from './CardComponent';
import { ActionKeys } from '../store/actions';
import Button from '@material-ui/core/Button';
import openFileDialog from '../containers/openFiles';

export const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cardsMap = useSelector((state: RootState) => state.cards);
  const cards = useSelector((state: RootState) => Object.values(state.cards));
  const dispatch = useDispatch();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'CARD',
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    }),
    drop: (item, monitor) => {
      const card = cardsMap[monitor.getItem().id];
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;

      dispatch({
        type: ActionKeys.UPDATE_CARD,
        id: card.id,
        card: {
          ...card,
          left: Math.round(card.left + delta.x),
          top: Math.round(card.top + delta.y)
        }
      });

      console.log('moving itemObj:', item);
      console.log('moving item:', monitor.getItem());
      console.log('isOver:', isOver, 'canDrop:', canDrop);
    }
  });



  return (
    <div className='canvas' ref={drop}>
      <Button variant="contained" color="primary" onClick={() => console.log('generate a new card...')}>New Card...</Button>
      <Button variant="contained" color="primary" onClick={() => openFileDialog({ properties: ['openFile', 'multiSelections'] })}>Open File...</Button>
      {cards.map(card => {
        return <CardComponent key={card.id} {...card} />;
      })}
      {props.children}
    </div>
  );
}