import React from 'react';
// eslint-disable-next-line import/named
import { useDrop, XYCoord } from 'react-dnd';
import { useSelector, useDispatch } from 'react-redux';
import Button from '@material-ui/core/Button';

import { RootState } from '../store/root';
import { Canvas } from '../types';
import { ActionKeys } from '../store/actions';
import { CardComponent } from './CardComponent';
import Editor from './Editor';
import FilePicker from './FilePicker';

export const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cardsMap = useSelector((state: RootState) => state.cards);
  const metafilesMap = useSelector((state: RootState) => state.metafiles);
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
      console.log('isOver:', isOver, 'canDrop:', canDrop);
    }
  });

  return (
    <div className='canvas' ref={drop}>
      <FilePicker />
      <Button variant="contained" color="primary" onClick={() => console.log('generate a new card...')}>New Card...</Button>
      {cards.map(card => {
        const metafile = metafilesMap[card.metafile];
        return (
          <CardComponent key={card.id} {...card}>
            <div>Card: {card.name}</div>
            {metafile && <Editor uuid={card.id + '-editor'} mode={'javascript'} code={metafile.content} />}
          </CardComponent>
        );
      })}
      {props.children}
    </div>
  );
}