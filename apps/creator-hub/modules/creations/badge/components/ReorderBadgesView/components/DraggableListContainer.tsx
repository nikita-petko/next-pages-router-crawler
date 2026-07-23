import React, { Fragment, FunctionComponent } from 'react';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/common';

import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';

import InfiniteScroll from 'react-infinite-scroll-component';
import useDraggableListStyles from './DraggableListContainer.style';

import DraggableBadgeListEntry from './DraggableBadgeListEntry';

export interface DraggableListElementData {
  name: string;
  id: number;
  isActive: boolean;
}

export interface DraggableListContainerProps {
  loadedData: DraggableListElementData[] | undefined;
  fetchMoreData: () => void;
  hasMore: boolean;
  onDragEnded: (result: DropResult) => void;
  isUpdatingList: boolean;
}

const DraggableListContainer: FunctionComponent<
  React.PropsWithChildren<DraggableListContainerProps>
> = (props) => {
  const { loadedData, fetchMoreData, hasMore, onDragEnded, isUpdatingList } = props;
  const { classes: styles } = useDraggableListStyles();

  return (
    <DragDropContext onDragEnd={onDragEnded}>
      <Droppable droppableId='badges-list'>
        {(provided) => (
          <Fragment>
            <InfiniteScroll
              dataLength={loadedData ? loadedData?.length : 0}
              next={fetchMoreData}
              hasMore={hasMore}
              loader={
                <EmptyGrid>
                  <CircularProgress />
                </EmptyGrid>
              }
              className={styles.infiniteScroll}
              height={600}>
              <div
                className={styles.infiniteScrollContainer}
                ref={provided.innerRef}
                {...provided.droppableProps}>
                {loadedData
                  ? loadedData.map((element, index) => (
                      <DraggableBadgeListEntry
                        key={element.id.toString()}
                        isReordering={isUpdatingList}
                        index={index}
                        badge={{
                          id: element.id,
                          name: element.name,
                          isActive: element.isActive,
                        }}
                      />
                    ))
                  : null}
              </div>
            </InfiniteScroll>
            {provided.placeholder}
          </Fragment>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableListContainer;
