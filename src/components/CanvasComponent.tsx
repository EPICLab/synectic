import React from 'react';
// eslint-disable-next-line import/named
import { useDrop, XYCoord } from 'react-dnd';
import { Canvas, Card } from '../store/types';
import { RootState } from '../store/root';
import { useSelector, useDispatch } from 'react-redux';
import { CardComponent } from './CardComponent';
import { ActionKeys } from '../store/actions';
import Button from '@material-ui/core/Button';
import openFileDialog from '../containers/openFiles';
import { v4 } from 'uuid';
import { extractFilename } from '../containers/io';
import { DateTime } from 'luxon';

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
      console.log('isOver:', isOver, 'canDrop:', canDrop);
    }
  });

  const handleOpenFiles = async () => {
    const files = await openFileDialog({ properties: ['openFile', 'multiSelections'] });
    console.log('files length:', files.length);
    console.log('files:', files);
    files.map(file => {
      const card: Card = {
        id: v4(),
        name: extractFilename(file.path),
        created: DateTime.local(),
        modified: DateTime.local(),
        repo: null,
        ref: null,
        left: 10,
        top: 25
      };
      console.log('new card:', card);
      dispatch({ type: ActionKeys.ADD_CARD, id: card.id, card: card })
    });
  };

  return (
    <div className='canvas' ref={drop}>
      <Button variant="contained" color="primary" onClick={() => console.log('generate a new card...')}>New Card...</Button>
      <Button variant="contained" color="primary" onClick={() => handleOpenFiles()}>Open File...</Button>
      {cards.map(card => {
        return <CardComponent key={card.id} {...card} />;
      })}
      {props.children}
    </div>
  );
}