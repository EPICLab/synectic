import React, { PropsWithChildren, useState } from 'react';
import { ConnectableElement, DropTargetMonitor, useDrag, useDrop } from 'react-dnd';
import { CSSTransition } from 'react-transition-group';
import { sep } from 'path';
import { Typography } from '@material-ui/core';
import { RootState } from '../../store/store';
import { createStack, pushCards, popCards } from '../../store/thunks/stacks';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import stackSelectors from '../../store/selectors/stacks';
import ContentBack from './ContentBack';
import ContentFront from './ContentFront';
import CloseButton from '../Button/Close';
import FlipButton from '../Button/Flip';
import SaveButton from '../Button/Save';
import UndoButton from '../Button/Undo';
import { DnDItemType } from '../Canvas/Canvas';
import ResetButton from '../Button/Reset';
import StageButton from '../Button/Stage';
import UnstageButton from '../Button/Unstage';
import CommitButton from '../Button/Commit';
import ResolveButton from '../Button/Resolve';
import AbortButton from '../Button/Abort';
import { Card } from '../../store/slices/cards';

type DragObject = {
  id: string,
  type: string
}

const Header = (props: PropsWithChildren<{ title: string }>) => {
  return <div className='card-header'>
    <div className='title'><Typography>{props.title}</Typography></div>
    <div className='buttons'>{props.children}</div>
  </div>;
};

const CardComponent = (card: Card) => {
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
            if (captureStack) dispatch(popCards({ cards: [dropSource.id], delta: delta }));
          }
          if (dropTarget && dropTarget.captured) {
            const capturingStack = stacks[dropTarget.captured];
            if (capturingStack && dropSource) dispatch(pushCards({ stack: capturingStack.id, cards: [dropSource.id] }))
          } else {
            if (dropTarget && dropSource)
              dispatch(createStack({ name: 'New Stack', cards: [dropTarget.id, dropSource.id], note: 'Contains a new stack of items.' }));
          }
          break;
        }
        case DnDItemType.STACK: {
          if (!card.captured) {
            const dropSource = stacks[monitor.getItem().id];
            if (dropTarget && dropSource) dispatch(pushCards({ stack: dropSource.id, cards: [dropTarget.id] }));
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