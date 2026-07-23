import type { FunctionComponent } from 'react';
import React from 'react';
import type { DropResult } from '@hello-pangea/dnd';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import InfiniteScroll from 'react-infinite-scroll-component';
import { CircularProgress } from '@rbx/ui';
import { EmptyGrid } from '@modules/miscellaneous/components';
import DraggableBadgeListEntry from './DraggableBadgeListEntry';
import useDraggableListStyles from './DraggableListContainer.style';

// Fixed viewport height (px) for the InfiniteScroll container. A bounded height is required so
// react-infinite-scroll-component scrolls its own content (and absorbs the drag placeholder)
// rather than growing the page; 600px shows a comfortable page of rows while keeping the
// Cancel/Save actions above the fold.
const SCROLL_CONTAINER_HEIGHT_PX = 600;

export interface DraggableListElementData {
  name: string;
  id: number;
  isActive: boolean;
}

export interface DraggableListContainerProps {
  loadedData: DraggableListElementData[] | undefined;
  fetchMoreData: () => void;
  hasMore: boolean;
  onDragStarted?: () => void;
  onDragEnded: (result: DropResult) => void;
  isUpdatingList: boolean;
  reorderedIds?: ReadonlySet<number | string>;
  // When true the per-save reorder cap has been reached, so rows that are not already part
  // of the batch are locked from dragging to prevent starting an over-quota move.
  isAtReorderCap?: boolean;
  // Optional override for InfiniteScroll's dataLength. When `loadedData` is a filtered
  // subset (e.g. "Hide disabled badges" toggle is on), pass the *underlying* loaded count
  // here so react-infinite-scroll-component's "did data grow after next()?" detection
  // stays correct even if a fetched page contributes zero visible rows.
  loadedItemsCount?: number;
}

const DraggableListContainer: FunctionComponent<
  React.PropsWithChildren<DraggableListContainerProps>
> = (props) => {
  const {
    loadedData,
    fetchMoreData,
    hasMore,
    onDragStarted,
    onDragEnded,
    isUpdatingList,
    reorderedIds,
    isAtReorderCap = false,
    loadedItemsCount,
  } = props;
  const { classes: styles } = useDraggableListStyles();

  return (
    <DragDropContext onDragStart={onDragStarted} onDragEnd={onDragEnded}>
      <Droppable droppableId='badges-list'>
        {(provided) => (
          <InfiniteScroll
            dataLength={loadedItemsCount ?? loadedData?.length ?? 0}
            next={fetchMoreData}
            hasMore={hasMore}
            loader={
              <EmptyGrid>
                <CircularProgress />
              </EmptyGrid>
            }
            className={styles.infiniteScroll}
            height={SCROLL_CONTAINER_HEIGHT_PX}>
            <div
              className={styles.infiniteScrollContainer}
              ref={provided.innerRef}
              {...provided.droppableProps}>
              {loadedData
                ? loadedData.map((element, index) => {
                    const isInBatch = reorderedIds?.has(element.id) ?? false;
                    return (
                      <DraggableBadgeListEntry
                        key={element.id.toString()}
                        isReordering={isUpdatingList}
                        index={index}
                        badge={{
                          id: element.id,
                          name: element.name,
                          isActive: element.isActive,
                        }}
                        isInBatch={isInBatch}
                        isDragDisabled={isAtReorderCap && !isInBatch}
                      />
                    );
                  })
                : null}
              {/* Keep the drag placeholder inside the fixed-height scroll container so the
                  reserved space is absorbed by scrolling instead of expanding the page and
                  pushing the Cancel/Save buttons down during a drag. */}
              {provided.placeholder}
            </div>
          </InfiniteScroll>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableListContainer;
