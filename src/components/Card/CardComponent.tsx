import React, { useState } from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import { sep } from 'path';
import { Typography } from '@material-ui/core';
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
import ResetButton from '../Button/ResetButton';
import StageButton from '../Button/StageButton';
import UnstageButton from '../Button/UnstageButton';
import CommitButton from '../Button/CommitButton';
import ResolveButton from '../Button/ResolveButton';
import AbortButton from '../Button/AbortButton';

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

const CardComponent: React.FunctionComponent<Card> = card => {
  const [flipped, setFlipped] = useState(false);
  const cards = useAppSelector((state: RootState) => cardSelectors.selectEntities(state));
  const stacks = useAppSelector((state: RootState) => stackSelectors.selectEntities(state));
  const dispatch = useAppDispatch();

  // Enable CardComponent as a drop source (i.e. allowing this card to be draggable)
  const [{ isDragging }, drag] = useDrag({
    type: DnDItemType.CARD,
    item: () => ({ id: card.id, type: DnDItemType.CARD }),
    collect: monitor => ({
      isDragging: !!monitor.isDragging()
    })
  }, [card.id]);

  // Enable CardComponent as a drop target (i.e. allow other elements to be dropped on this card)
  const [{ isOver }, drop] = useDrop({
    accept: [DnDItemType.CARD, DnDItemType.STACK],
    canDrop: (item: { id: string, type: string }, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards[card.id];
      const dropSource = item.type === DnDItemType.CARD ? cards[monitor.getItem().id] : stacks[monitor.getItem().id];
      // restrict dropped items from accepting a self-referencing drop (i.e. dropping a card on itself)
      return (dropTarget && dropSource) ? (dropTarget.id !== dropSource.id) : false;
    },
    drop: (item, monitor: DropTargetMonitor<DragObject, void>) => {
      const dropTarget = cards[card.id];
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
          if (!card.captured) {
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
  }, [cards, stacks, card.id]);

  const dragAndDrop = (elementOrNode: ConnectableElement) => {
    drag(elementOrNode);
    drop(elementOrNode);
  }

  return (
    <div ref={dragAndDrop} data-testid='card-component' id={card.id}
      className={`card ${(isOver && !card.captured) ? 'drop-source' : ''} ${card.classes.join(' ')}`}
      style={{ zIndex: card.zIndex, left: card.left, top: card.top, opacity: isDragging ? 0 : 1 }}
    >
      <Header title={card.type === 'Explorer' ? `${sep}${card.name}` : card.name}>
        <ResetButton cardIds={[card.id]} />
        <StageButton cardIds={[card.id]} />
        <UnstageButton cardIds={[card.id]} />
        <CommitButton cardIds={[card.id]} />
        <UndoButton cardIds={[card.id]} />
        <SaveButton cardIds={[card.id]} />
        <AbortButton cardId={card.id} />
        <ResolveButton cardId={card.id} />
        <FlipButton cardId={card.id} onClickHandler={() => setFlipped(!flipped)} />
        <CloseButton cardId={card.id} />
      </Header>
      <CSSTransition in={flipped} timeout={600} classNames='flip'>
        <>
          {flipped ?
            <ContentBack {...card} /> :
            <ContentFront {...card} />
          }
        </>
      </CSSTransition>
    </div>
  );
};

export default CardComponent;