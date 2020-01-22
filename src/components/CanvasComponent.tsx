import React from 'react';
// eslint-disable-next-line import/named
import { useDrop, XYCoord } from 'react-dnd';
import { useSelector, useDispatch } from 'react-redux';

import { RootState } from '../store/root';
import { Canvas, Stack } from '../types';
import { ActionKeys, Actions } from '../store/actions';
import CardComponent from './CardComponent';
import Editor from './Editor';
import NewCardComponent from './NewCardDialog';
import FilePickerDialog from './FilePickerDialog';
import DiffPicker from './DiffPickerDialog';
import { Button } from '@material-ui/core';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';
import StackComponent from './StackComponent';

const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const cardsList = Object.values(cards);
  const stacks = useSelector((state: RootState) => state.stacks);
  const stacksList = Object.values(stacks);
  const metafiles = useSelector((state: RootState) => state.metafiles);
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
    const stack: Stack = {
      id: v4(),
      name: 'test',
      created: DateTime.local(),
      modified: DateTime.local(),
      note: 'go get some tests!',
      cards: [cardsList[0].id, cardsList[1].id],
      left: 250,
      top: 250
    };

    const actions: Actions[] = [
      { type: ActionKeys.ADD_STACK, id: stack.id, stack: stack },
      { type: ActionKeys.UPDATE_CARD, id: cardsList[0].id, card: { ...cardsList[0], isCaptured: true, top: 50, left: 10 } },
      { type: ActionKeys.UPDATE_CARD, id: cardsList[1].id, card: { ...cardsList[1], isCaptured: true, top: 60, left: 20 } }
    ];
    actions.map(action => dispatch(action));
  }

  return (
    <div className='canvas' ref={drop}>
      <NewCardComponent />
      <FilePickerDialog />
      <DiffPicker />
      <Button id='stack-button' variant='contained' color='primary' onClick={createStack}>Create Stack</Button>
      <Button id='stack-button' variant='contained' color='primary' onClick={testJsonRead}>Test JSON</Button>
      {stacksList.map(stack => {
        return (
          <StackComponent key={stack.id} {...stack} />
        );
      })}
      {cardsList.map(card => {
        if (card.isCaptured) return null;
        const metafile = metafiles[card.metafile];
        return (
          <CardComponent key={card.id} {...card}>
            {metafile && <Editor uuid={card.id + '-editor'} mode={'javascript'} code={metafile.content ? metafile.content : ''} />}
          </CardComponent>
        );
      })}
      {props.children}
    </div>
  );
}

export default CanvasComponent;