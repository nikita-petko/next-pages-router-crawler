import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import type { ReactElement } from 'react';
import React, { useCallback } from 'react';
import SortableItem from './SortableItem';

export interface DragDropSortProps {
  onReorder: (sourceIndexInOriginArray: number, destinationIndexInResultArray: number) => void;
  sortItems: Array<{ key: string; item: ReactElement }>;
  itemComponent?: React.ReactElement<Record<string, unknown>>;
  config?: {
    startDragPixelDistance: number;
  };
  disabled?: boolean;
}

const DragDropSort = ({
  onReorder,
  sortItems,
  itemComponent,
  config,
  disabled = false,
}: DragDropSortProps) => {
  const handleDragEnd = useCallback(
    (result: DragEndEvent) => {
      if (result.over === null) {
        return;
      }
      onReorder(
        sortItems.findIndex((item) => item.key === result.active.id),
        sortItems.findIndex((item) => item.key === result.over?.id),
      );
    },
    [onReorder, sortItems],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: config?.startDragPixelDistance ?? 0, // in pixels
      },
    }),
    useSensor(KeyboardSensor),
  );

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <SortableContext items={sortItems.map((item) => item.key)}>
        {sortItems.map((item) => (
          <SortableItem
            key={item.key}
            id={item.key}
            item={item.item}
            component={itemComponent}
            disabled={disabled}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
};

export default DragDropSort;
