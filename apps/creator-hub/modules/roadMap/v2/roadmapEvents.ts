import type { UnifiedLogger } from '@rbx/unified-logger';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import type { RoadmapItem } from './types';

/** Where a feedback interaction originated; only 'detail_modal' is wired up today. */
export type RoadmapFeedbackSource = 'card' | 'detail_modal';

/** Which of the two roadmap filter dropdowns fired the event. Both share one event name and both report
 *  an itemsRemainingCount, so this disambiguates them downstream. */
export type RoadmapFilterType = 'category' | 'stage';

// timeFrame is null for the "2027 & onward" bucket; serialize it to a stable, queryable token.
const UNSCHEDULED_TIME_FRAME = '2027+';

const serializeTimeFrame = (timeFrame: RoadmapItem['timeFrame']): string =>
  timeFrame ?? UNSCHEDULED_TIME_FRAME;

// item_id/timeFrame/year/category are shared by item click + impression; keep the shaping in one place.
const itemBaseParams = (item: RoadmapItem): Record<string, string> => ({
  itemId: item.id,
  timeFrame: serializeTimeFrame(item.timeFrame),
  year: String(item.year),
  category: item.category.join(','),
});

export const logRoadmapPageView = (
  logger: UnifiedLogger,
  { itemsVisibleCount }: { itemsVisibleCount: number },
): void => {
  logger.logImpressionEvent({
    eventName: CreatorDashboardEventType.RoadmapPageView,
    parameters: {
      itemsVisibleCount: String(itemsVisibleCount),
    },
  });
};

export const logRoadmapItemClick = (logger: UnifiedLogger, item: RoadmapItem): void => {
  logger.logClickEvent({
    eventName: CreatorDashboardEventType.RoadmapItemClick,
    parameters: { ...itemBaseParams(item), status: item.devStage },
  });
};

// nextLiked distinguishes a like from an unlike (the aggregate likeCount is net-only); positionIndex lets
// demand be normalized against exposure so below-the-fold items aren't read as unwanted.
export const logRoadmapItemLikeToggle = (
  logger: UnifiedLogger,
  item: RoadmapItem,
  nextLiked: boolean,
  positionIndex: number,
): void => {
  logger.logClickEvent({
    eventName: CreatorDashboardEventType.RoadmapItemLikeToggle,
    parameters: {
      ...itemBaseParams(item),
      status: item.devStage,
      nextLiked: String(nextLiked),
      positionIndex: String(positionIndex),
    },
  });
};

export const logRoadmapFilterApplied = (
  logger: UnifiedLogger,
  {
    filterType,
    filterValue,
    itemsRemainingCount,
  }: { filterType: RoadmapFilterType; filterValue: string; itemsRemainingCount?: number },
): void => {
  logger.logClickEvent({
    eventName: CreatorDashboardEventType.RoadmapFilterApplied,
    parameters: {
      filterType,
      filterValue,
      ...(itemsRemainingCount != null ? { itemsRemainingCount: String(itemsRemainingCount) } : {}),
    },
  });
};

export const logRoadmapFeedbackOpen = (
  logger: UnifiedLogger,
  { itemId, source }: { itemId: string; source: RoadmapFeedbackSource },
): void => {
  logger.logClickEvent({
    eventName: CreatorDashboardEventType.RoadmapFeedbackOpen,
    parameters: { itemId, source },
  });
};

export const logRoadmapFeedbackClose = (
  logger: UnifiedLogger,
  { itemId, source }: { itemId: string; source: RoadmapFeedbackSource },
): void => {
  logger.logClickEvent({
    eventName: CreatorDashboardEventType.RoadmapFeedbackClose,
    parameters: { itemId, source },
  });
};

export const logRoadmapFeedbackSubmit = (
  logger: UnifiedLogger,
  {
    itemId,
    sentiment,
    categories,
    hasComment,
  }: { itemId: string; sentiment: string; categories: string; hasComment: boolean },
): void => {
  logger.logClickEvent({
    eventName: CreatorDashboardEventType.RoadmapDetailFeedbackSubmit,
    parameters: {
      itemId,
      sentiment,
      categories,
      hasComment: String(hasComment),
    },
  });
};

export const logRoadmapItemImpression = (
  logger: UnifiedLogger,
  item: RoadmapItem,
  positionIndex: number,
): void => {
  logger.logImpressionEvent({
    eventName: CreatorDashboardEventType.RoadmapItemImpression,
    parameters: { ...itemBaseParams(item), positionIndex: String(positionIndex) },
  });
};
