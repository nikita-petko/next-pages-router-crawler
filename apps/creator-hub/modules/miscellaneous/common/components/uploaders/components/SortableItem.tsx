import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from '@rbx/ui';

export interface SortableItemProps {
  id: string;
  item: React.ReactNode;
  component?: React.ReactElement<Record<string, unknown>>;
  disabled?: boolean;
}

const SortableItem = ({ id, item, component = <div />, disabled = false }: SortableItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const theme = useTheme();

  const style: React.CSSProperties = {
    zIndex: isDragging ? theme.zIndex.tooltip + 1 : undefined,
    position: 'relative',
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return React.cloneElement(component, {
    ref: setNodeRef,
    style,
    ...attributes,
    ...listeners,
    children: item,
  });
};

export default SortableItem;
