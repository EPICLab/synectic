import React from 'react';
import { useDrop } from 'react-dnd';
import { useSelector, useDispatch } from 'react-redux';
import { Button } from '@material-ui/core';

import type { Canvas } from '../types';
import { RootState } from '../store/root';
import NewCardButton from './NewCardDialog';
import FilePickerButton from './FilePickerDialog';
import DiffPickerButton from './DiffPickerDialog';
import CardComponent from './CardComponent';
import StackComponent from './StackComponent';
import ErrorDialog from './ErrorDialog';
import VersionStatusButton from './RepoBranchList';
import MergeButton from './MergeDialog';
import { GitGraphButton } from './GitGraphButton';
import { popCard, updateStack } from '../containers/stacks';
import { updateCard } from '../containers/cards';

const CanvasComponent: React.FunctionComponent<Canvas> = props => {
  const cards = useSelector((state: RootState) => state.cards);
  const stacks = useSelector((state: RootState) => state.stacks);
  const metafiles = useSelector((state: RootState) => Object.values(state.metafiles));
  const filetypes = useSelector((state: RootState) => Object.values(state.filetypes));
  const repos = useSelector((state: RootState) => Object.values(state.repos));
  const errors = useSelector((state: RootState) => Object.values(state.errors));
  const dispatch = useDispatch();

  // Enable CanvasComponent as a drop target (i.e. allow cards and stacks to be dropped on the canvas)
  const [, drop] = useDrop({
    accept: ['CARD', 'STACK'],
    canDrop: (_item, monitor) => {
      return !monitor.getItem().captured;
    },
    drop: (item, monitor) => {
      switch (item.type) {
        case 'CARD': {
          const card = cards[monitor.getItem().id];
          const delta = monitor.getDifferenceFromInitialOffset();
          if (!delta) return; // no dragging is occurring, perhaps a card was picked up and dropped without dragging
          if (card.captured) {
            dispatch(popCard(stacks[card.captured], card, delta));
          } else {
            dispatch(updateCard({ ...card, left: Math.round(card.left + delta.x), top: Math.round(card.top + delta.y) }));
          }
          break;
        }
        case 'STACK': {
          const stack = stacks[monitor.getItem().id];
          const delta = monitor.getDifferenceFromInitialOffset();
          if (!delta) return; // no dragging is occurring, perhaps a stack was picked up and dropped without dragging
          dispatch(updateStack({ ...stack, left: Math.round(stack.left + delta.x), top: Math.round(stack.top + delta.y) }));
          break;
        }
        default: {
          console.log('useDrop Error: default option, no item.type found');
          break;
        }
      }
    }
  });

  const showState = () => {
    const allCards = Object.values(cards);
    const allStacks = Object.values(stacks);
    console.log(`CARDS: ${allCards.length}`)
    allCards.map(c => console.log(`id: ${c.id}, name: ${c.name}, type: ${c.type}, metafile: ${c.metafile}, captured: ${c.captured}`));
    console.log(`STACKS: ${allStacks.length}`)
    allStacks.map(s => console.log(`id: ${s.id}, name: ${s.name}, cards: ${JSON.stringify(s.cards)}`));
    console.log(`METAFILES: ${metafiles.length} `);
    metafiles.map(m => console.log(`id: ${m.id}, name: ${m.name}, path: ${m.path}, branch: ${m.branch}, contains: ${m.contains
      ? JSON.stringify(m.contains) : ''
      }, content: ${m.content ? m.content : ''}, targets: ${m.targets ? JSON.stringify(m.targets) : ''} `));
    console.log(`REPOS: ${repos.length} `);
    repos.map(r =>
      console.log(`name: ${r.name}, path: ${r.url.href}, local: ${JSON.stringify(r.local)}, remote: ${JSON.stringify(r.remote)} `));
    console.log(`FILETYPES: ${filetypes.length} `);
    console.log(`ERRORS: ${errors.length} `);
    console.log(JSON.stringify(errors));
  }

  return (
    <div className='canvas' ref={drop}>
      <NewCardButton />
      <FilePickerButton />
      <VersionStatusButton />
      <MergeButton />
      <DiffPickerButton />
      <Button id='state-button' variant='contained' color='primary' onClick={showState}>Show...</Button>
      <GitGraphButton />
      {Object.values(stacks).map(stack => <StackComponent key={stack.id} {...stack} />)}
      {Object.values(cards).filter(card => !card.captured).map(card => <CardComponent key={card.id} {...card} />)}
      {errors.map(error => <ErrorDialog key={error.id} {...error} />)}
      {props.children}
    </div >
  );
}

export default CanvasComponent;