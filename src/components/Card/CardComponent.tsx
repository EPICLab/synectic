import React, { useState } from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import { sep } from 'path';
import { IconButton, Tooltip, Typography } from '@material-ui/core';
import { Flip } from '@material-ui/icons';
import type { Card } from '../../types';
import { RootState } from '../../store/store';
import { createStack, pushCards, popCard } from '../../store/thunks/stacks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import stackSelectors from '../../store/selectors/stacks';
import ContentBack from './ContentBack';
import ContentFront from './ContentFront';
import CloseButton from '../Button/CloseButton';
import FlipButton from '../Button/FlipButton';
import SaveButton from '../Button/SaveButton';
import UndoButton from '../Button/UndoButton';
import { DnDItemType } from '../CanvasComponent';
import { useIconButtonStyle } from '../Button/useStyledIconButton';

type DragObject = {
  id: string,
  type: string
}

const Header: React.FunctionComponent<{ title: string }> = props => {
  return <div className='card-header'>
    <div className='title'><Typography>{props.title}</Typography></div>
    <div className='buttons'>{props.children}</div>
  </div>;
};

const CardComponent: React.FunctionComponent<Card> = props => {
  const [flipped, setFlipped] = useState(false);
  const cards = useAppSelector((state: RootState) => cardSelectors.selectEntities(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectEntities(state));
  const classes = useIconButtonStyle({ mode: 'light' });
  const dispatch = useAppDispatch();

  // Enable CardComponent as a drop source (i.e. allowing this card to be draggable)
  const [{ isDragging }, drag] = useDrag({
    type: DnDItemType.CARD,
    item: () => ({ id: props.id, type: DnDItemType.CARD }),
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }, [props.id]);

  // Enable CardComponent as a drop target (i.e. allow other elements to be dropped on this card)
  const [{ isOver }, drop] = useDrop({
    accept: [DnDItemType.CARD, DnDItemType.STACK],
    canDrop: (item: { id: string, type: string }, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards[props.id];
      const dropSource = item.type === DnDItemType.CARD ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
      return (dropTarget && dropSource) ? (dropTarget.id !== dropSource.id) : false;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards[props.id];
      const delta = monitor.getDifferenceFromInitialOffset();
      if (!delta) return; // no dragging is occurring, perhaps a draggable element was picked up and dropped without dragging
      switch (item.type) {
        case DnDItemType.CARD: {
          const dropSource = cards[monitor.getItem().id];
          if (dropSource && dropSource.captured) {
            const captureStack = stacks[dropSource.captured];
            if (captureStack) dispatch(popCard({ card: dropSource, delta: delta }));
          }
          if (dropTarget && dropTarget.captured) {
            const capturingStack = stacks[dropTarget.captured];
            if (capturingStack && dropSource) dispatch(pushCards({ stack: capturingStack, cards: [dropSource] }))
          } else {
            if (dropTarget && dropSource)
              dispatch(createStack({ name: 'New Stack', cards: [dropTarget, dropSource], note: 'Contains a new stack of items.' }));
          }
          break;
        }
        case DnDItemType.STACK: {
          if (!props.captured) {
            const dropSource = stacks[monitor.getItem().id];
            if (dropTarget && dropSource) dispatch(pushCards({ stack: dropSource, cards: [dropTarget] }));
          }
          break;
        }
      }
    },
    collect: monitor => ({
      isOver: !!monitor.isOver() // return isOver prop to highlight drop sources that accept hovered item
    })
  }, [cards, stacks, props.id]);

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  const flip = () => setFlipped(!flipped);

  return (
    <div ref={dragAndDrop} data-testid='card-component' id={props.id}
      className={`card ${(isOver && !props.captured) ? 'drop-source' : ''} ${props.classes.join(' ')}`}
      style={{ zIndex: props.zIndex, left: props.left, top: props.top, opacity: isDragging ? 0 : 1 }}
    >
      <Header title={props.type === 'Explorer' ? `${sep}${props.name}` : props.name}>
        <UndoButton cardIds={[props.id]} />
        <SaveButton cardIds={[props.id]} />
        <FlipButton cardId={props.id} onClickHandler={flip} />
        {(!props.captured) && <Tooltip title='Flip'><IconButton className={classes.root} aria-label='flip' onClick={flip} ><Flip /></IconButton></Tooltip>}
        <CloseButton cardId={props.id} />
      </Header>
      <CSSTransition in={flipped} timeout={600} classNames='flip'>
        <>
          {flipped ?
            <ContentBack {...props} /> :
            <ContentFront {...props} />}
        </>
      </CSSTransition>
    </div>
  );
};

export default CardComponent;