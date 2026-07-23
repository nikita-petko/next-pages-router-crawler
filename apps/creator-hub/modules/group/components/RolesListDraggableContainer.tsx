import React, { PropsWithChildren, FC } from 'react';
import {
  DragDropContext,
  Droppable,
  DroppableProvided,
  OnDragEndResponder,
} from '@hello-pangea/dnd';

type TRolesListDraggableContainer = {
  onDragEnd: OnDragEndResponder;
  droppableId: string;
};

const RolesListDraggableContainer: FC<PropsWithChildren<TRolesListDraggableContainer>> = ({
  onDragEnd,
  droppableId,
  children,
}) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided: DroppableProvided) => (
          <div
            style={{ maxWidth: '100%', width: '100%' }}
            ref={provided.innerRef}
            {...provided.droppableProps}>
            {children}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default RolesListDraggableContainer;
