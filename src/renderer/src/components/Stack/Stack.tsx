import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useCombinedRefs } from '@dnd-kit/utilities';
import type { UUID } from 'types/app';
import BaseStack from './BaseStack';

const Stack = ({ id }: { id: UUID }) => {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeNef,
    transform,
    isDragging
  } = useDraggable({
    id: id,
    data: { type: 'stack' }
  });
  const accepts = ['card', 'stack'];
  const {
    setNodeRef: setDroppableNodeRef,
    isOver,
    active
  } = useDroppable({
    id: id,
    data: { type: 'stack', accepts }
  });
  const setNodeRef = useCombinedRefs(setDroppableNodeRef, setDraggableNodeNef);

  return (
    <BaseStack
      id={id}
      ref={setNodeRef}
      listeners={listeners}
      attributes={attributes}
      transform={transform}
      dragging={isDragging}
      highlight={!isDragging && isOver && accepts.includes(active?.data.current?.type)}
    />
  );
};

export default Stack;
