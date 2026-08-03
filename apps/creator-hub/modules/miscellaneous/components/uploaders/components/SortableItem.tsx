import React from 'react';
import { useSortable } from '@dnd-kit/react/sortable';
import { useTheme } from '@rbx/ui';

export interface SortableItemProps {
  id: string;
  index: number;
  item: React.ReactNode;
  component?: React.ReactElement<Record<string, unknown>>;
  disabled?: boolean;
}

const DEFAULT_COMPONENT = <div />;

const SortableItem = ({
  id,
  index,
  item,
  component = DEFAULT_COMPONENT,
  disabled = false,
}: SortableItemProps) => {
  const { ref, isDragging } = useSortable({
    id,
    index,
    disabled,
  });

  const theme = useTheme();

  const style: React.CSSProperties = {
    zIndex: isDragging ? theme.zIndex.tooltip + 1 : undefined,
    position: 'relative',
  };

  // eslint-disable-next-line react/no-clone-element -- Preserves the existing caller-supplied wrapper contract while attaching dnd-kit.
  return React.cloneElement(component, {
    ref,
    style,
    children: item,
  });
};

export default SortableItem;
