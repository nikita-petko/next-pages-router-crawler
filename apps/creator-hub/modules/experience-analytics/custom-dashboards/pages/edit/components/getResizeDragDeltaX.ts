import type { DragMoveEvent } from '@dnd-kit/react';

type ResizeDragOperation = {
  readonly position: Pick<DragMoveEvent['operation']['position'], 'current' | 'initial'>;
};

/** Returns the stable total horizontal displacement for an in-progress resize drag. */
export default function getResizeDragDeltaX(operation: ResizeDragOperation): number {
  return operation.position.current.x - operation.position.initial.x;
}
