import { useSortable } from '@dnd-kit/sortable';
import type { PropsWithChildren } from 'react';
import type { UUID } from 'types/app';
import BaseCard from './BaseCard';

const Card = ({
  id,
  sortableIndex,
  children
}: PropsWithChildren<{
  id: UUID;
  sortableIndex?: number;
}>) => {
  const accepts = ['card'];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver, active } =
    useSortable({
      id: id,
      data: { type: 'card', accepts }
    });

  return (
    <BaseCard
      id={id}
      sortableIndex={sortableIndex}
      ref={setNodeRef}
      listeners={listeners}
      attributes={attributes}
      transform={transform}
      transition={transition}
      dragging={isDragging}
      highlight={!isDragging && isOver && accepts.includes(active?.data.current?.type)}
    >
      {children}
    </BaseCard>
  );
};

export default Card;
