import type { ReactElement } from 'react';
import React, { useCallback, useMemo } from 'react';
import { PointerActivationConstraints } from '@dnd-kit/dom';
import type { DragEndEvent } from '@dnd-kit/react';
import { DragDropProvider, KeyboardSensor, PointerSensor } from '@dnd-kit/react';
import { isSortableOperation } from '@dnd-kit/react/sortable';
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
      if (result.canceled || !result.operation.source || !isSortableOperation(result.operation)) {
        return;
      }
      const { initialIndex, index } = result.operation.source;
      if (initialIndex !== index) {
        onReorder(initialIndex, index);
      }
    },
    [onReorder],
  );

  const sensors = useMemo(
    () => [
      PointerSensor.configure({
        activationConstraints: [
          new PointerActivationConstraints.Distance({
            value: config?.startDragPixelDistance ?? 0,
          }),
        ],
      }),
      KeyboardSensor,
    ],
    [config?.startDragPixelDistance],
  );

  return (
    <DragDropProvider onDragEnd={handleDragEnd} sensors={sensors}>
      {sortItems.map((item, index) => (
        <SortableItem
          key={item.key}
          id={item.key}
          index={index}
          item={item.item}
          component={itemComponent}
          disabled={disabled}
        />
      ))}
    </DragDropProvider>
  );
};

export default DragDropSort;
