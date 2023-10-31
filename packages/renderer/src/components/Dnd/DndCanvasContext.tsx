import {DndContext, MouseSensor, useSensor, useSensors, type DragEndEvent} from '@dnd-kit/core';
import {restrictToParentElement} from '@dnd-kit/modifiers';
import type {PropsWithChildren} from 'react';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import cardSelectors from '../../store/selectors/cards';
import stackSelectors from '../../store/selectors/stacks';
import {cardUpdated} from '../../store/slices/cards';
import {stackUpdated} from '../../store/slices/stacks';
import {createStack, pushCards, removeStack} from '../../store/thunks/stacks';
import DraggableOverlay from './DraggableOverlay';

const DndCanvasContext = ({children}: PropsWithChildren) => {
  const cards = useAppSelector(state => cardSelectors.selectEntities(state));
  const stacks = useAppSelector(state => stackSelectors.selectEntities(state));
  const dispatch = useAppDispatch();
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 10,
    },
  });

  const sensors = useSensors(mouseSensor);

  const handleDragEnd = ({active, delta, over}: DragEndEvent) => {
    if (active.data.current?.type === 'stack') {
      const draggedStack = stacks[active.id];

      // Move Stack to updated coordinates
      if (draggedStack) {
        dispatch(
          stackUpdated({
            ...draggedStack,
            x: draggedStack.x + delta.x,
            y: draggedStack.y + delta.y,
          }),
        );
      }

      const dropStack = over ? stacks[over.id] : undefined;

      // Merge Stack into Stack
      if (
        draggedStack &&
        dropStack &&
        draggedStack.id !== dropStack.id &&
        over?.data.current?.accepts?.includes(active.data.current?.type)
      ) {
        const cards = draggedStack.cards;
        dispatch(
          removeStack({
            stack: draggedStack.id,
          }),
        );
        dispatch(
          pushCards({
            stack: dropStack.id,
            cards: [...cards],
          }),
        );
      }
    }

    if (active.data.current?.type === 'card') {
      const draggedCard = cards[active.id];

      // Move Card to updated coordinates
      if (draggedCard) {
        dispatch(
          cardUpdated({
            ...draggedCard,
            x: draggedCard.x + delta.x,
            y: draggedCard.y + delta.y,
          }),
        );
      }

      const dropCard = over ? cards[over.id] : undefined;
      const dropStack = over ? stacks[over.id] : undefined;

      // Push Card into Stack
      if (
        draggedCard &&
        dropStack &&
        over?.data.current?.accepts?.includes(active.data.current?.type)
      ) {
        dispatch(pushCards({stack: dropStack.id, cards: [draggedCard.id]}));
      }

      // Create new Stack with Cards dropped together
      if (
        draggedCard &&
        dropCard &&
        draggedCard.id !== dropCard.id &&
        over?.data.current?.accepts?.includes(active.data.current?.type)
      ) {
        dispatch(
          createStack({
            name: 'Stack',
            cards: [draggedCard.id, dropCard.id],
            x: over.rect.left - 10,
            y: over.rect.top - 10,
          }),
        );
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      modifiers={[restrictToParentElement]}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DraggableOverlay />
    </DndContext>
  );
};

export default DndCanvasContext;
