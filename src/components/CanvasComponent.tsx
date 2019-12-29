import React from 'react';
// eslint-disable-next-line import/named
import { useDrop, XYCoord } from 'react-dnd';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../store/root';
import { Canvas } from '../types';
import { ActionKeys } from '../store/actions';
import { CardComponent } from './CardComponent';
import Editor from './Editor';
import NewCardComponent from './NewCardDialog';
// import FilePicker from './FilePicker';

export const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const cardsList = Object.values(cards);
  const metafiles = useSelector((state: RootState) => state.metafiles);
  const dispatch = useDispatch();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'CARD',
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    }),
    drop: (item, monitor) => {
      const card = cards[monitor.getItem().id];
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
      <NewCardComponent />
      {/* <FilePicker /> */}
      {cardsList.map(card => {
        const metafile = metafiles[card.metafile];
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