import { DragOverlay, useDndContext } from '@dnd-kit/core';
import React from 'react';
import { BaseCard } from '../Card';
import { BaseStack } from '../Stack';

const DraggableOverlay = () => {
  const { active } = useDndContext();

  return (
    <DragOverlay>
      {active?.data.current?.type === 'card' ? <BaseCard id={active.id} dragOverlay /> : null}
      {active?.data.current?.type === 'stack' ? <BaseStack id={active.id} dragOverlay /> : null}
    </DragOverlay>
  );
};

export default DraggableOverlay;
