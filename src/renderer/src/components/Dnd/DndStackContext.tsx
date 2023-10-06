import { ClientRect, DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import { arrayMove } from '@dnd-kit/sortable';
import { ForwardedRef, PropsWithChildren, forwardRef } from 'react';
import type { UUID } from 'types/app';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import stackSelectors from '../../store/selectors/stacks';
import { stackUpdated } from '../../store/slices/stacks';
import { popCard } from '../../store/thunks/stacks';
import DraggableOverlay from './DraggableOverlay';

const DndStackContext = forwardRef<HTMLDivElement, PropsWithChildren<{ id: UUID }>>(
  ({ id, children }, ref) => {
    const stack = useAppSelector(state => stackSelectors.selectById(state, id));
    const dispatch = useAppDispatch();

    const handleDragEnd = (event: DragEndEvent) => {
      if (!stack) return;
      const { active, over } = event;
      const withinStack = pointerWithin(active.rect.current.translated, ref);

      // Pop Card from Stack
      if (!withinStack) {
        dispatch(
          popCard({
            stack: stack.id,
            card: active.id,
            x: active.rect.current.translated?.left ?? 0,
            y: active.rect.current.translated?.top ?? 0
          })
        );
      } else if (active.id !== over?.id) {
        const oldIndex = stack.cards.indexOf(active.id);
        const newIndex = over ? stack.cards.indexOf(over.id) : undefined;

        // Reorder Cards within Stack
        if (newIndex !== undefined) {
          const newCardsArray = arrayMove(stack.cards, oldIndex, newIndex);
          dispatch(
            stackUpdated({
              ...stack,
              cards: newCardsArray
            })
          );
        }
      }
      console.groupEnd();
    };

    return (
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToWindowEdges]}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DraggableOverlay />
      </DndContext>
    );
  }
);

const pointerWithin = (rect: ClientRect | null, ref: ForwardedRef<HTMLDivElement>): boolean => {
  if (typeof ref === 'function') {
    throw new Error('Only React Refs that are created with `createRef` or `useRef` are supported');
  }
  if (!rect || ref === null || !ref.current) return true;
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const left = ref.current.offsetLeft;
  const right = left + ref.current.offsetWidth;
  const top = ref.current.offsetTop;
  const bottom = top + ref.current.offsetHeight;
  return left < x && x < right && top < y && y < bottom;
};

export default DndStackContext;
