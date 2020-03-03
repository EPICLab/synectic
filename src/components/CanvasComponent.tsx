import React from 'react';
// eslint-disable-next-line import/named
import { useDrop, XYCoord } from 'react-dnd';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../store/root';
import { Canvas } from '../types';
import { ActionKeys } from '../store/actions';
// import CardComponent from './CardComponent';
import NewCardComponent from './NewCardDialog';
import FilePickerDialog from './FilePickerDialog';
import { Button } from '@material-ui/core';
// import StackComponent from './StackComponent';
import { loadStack } from '../containers/handlers';
import DiffPickerDialog from './DiffPickerDialog';

const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const stacks = useSelector((state: RootState) => state.stacks);
  const dispatch = useDispatch();

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ['CARD', 'STACK'],
    collect: monitor => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop()
    }),
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;

      console.log(`drop item.type: ${String(item.type)}\nisOver: ${isOver}, canDrop: ${canDrop}`);

      switch (item.type) {
        case 'CARD': {
          const card = cards[monitor.getItem().id];
          console.log(`card.id: ${card.id}`);
          dispatch({
            type: ActionKeys.UPDATE_CARD,
            id: card.id,
            card: { ...card, left: Math.round(card.left + delta.x), top: Math.round(card.top + delta.y) }
          });
          break;
        }
        case 'STACK': {
          const stack = stacks[monitor.getItem().id];
          console.log(`stack.id : ${stack.id}s`);
          dispatch({
            type: ActionKeys.UPDATE_STACK,
            id: stack.id,
            stack: { ...stack, left: Math.round(stack.left + delta.x), top: Math.round(stack.top + delta.y) }
          });
          break;
        }
        default: {
          console.log(`default option, no item.type`);
          break;
        }
      }
    }
  });

  const createStack = () => {
    const cardsList = Object.values(cards);
    const actions = loadStack('test', [cardsList[0], cardsList[1]], 'go get some testing');
    actions.map(action => dispatch(action));
  }

  const exposeCards = () => {
    Object.values(cards).map((card, index) => console.log(`CARD ${index}: ${JSON.stringify(card)}`));
  }

  return (
    <div className='canvas' ref={drop}>
      <Button id='stack-button' variant='contained' color='primary' onClick={exposeCards}>Expose Cards</Button>
      <NewCardComponent />
      <FilePickerDialog />
      <DiffPickerDialog />
      <Button id='stack-button' variant='contained' color='primary' onClick={createStack}>Create Stack</Button>
      {Object.values(cards).filter(card => !card.captured).map(card => <div key={card.id}>{card.id}</div>)}
      {Object.values(stacks).map(stack => <div key={stack.id}>{stack.id}</div>)}
      {/* {Object.values(stacks).map(stack => <StackComponent key={stack.id} {...stack} />)}
      {Object.values(cards).filter(card => !card.captured).map(card => <CardComponent key={card.id} {...card} />)} */}
      {props.children}
    </div>
  );
}

export default CanvasComponent;