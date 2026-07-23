import type { RoadmapItem, TimeFrame } from '../v2/types';

/**
 * Merges the current user's liked item ids into the roadmap items, setting `isLiked` on each. The
 * likes feed is a separate, user-scoped request from the (public) items feed, so the two are combined
 * at read time rather than inside the item mapper.
 */
export const applyLikedState = (items: RoadmapItem[], likedItemIds: string[]): RoadmapItem[] => {
  const liked = new Set(likedItemIds);
  return items.map((item) => ({ ...item, isLiked: liked.has(item.id) }));
};

const MAX_ITEMS_PER_TIME_FRAME = 8;
export const ALL_FILTER = 'all';
export const FAVORITES_FILTER = 'Favorites';
/** Virtual stage value that matches every dev stage — the "All Stages" dropdown option. */
export const ALL_STAGES_FILTER = 'all';

export type RoadmapRow = {
  id: string;
  labelKey: string;
  year: number;
  matches: (item: RoadmapItem) => boolean;
};

const TIME_FRAME_ROWS: { timeFrame: TimeFrame; labelKey: string; idPrefix: string }[] = [
  { timeFrame: 'Early', labelKey: 'Label.EarlyYear', idPrefix: 'early' },
  { timeFrame: 'Mid', labelKey: 'Label.MidYear', idPrefix: 'mid' },
  { timeFrame: 'Late', labelKey: 'Label.LateYear', idPrefix: 'late' },
];

const ONWARD_ROW_ID = 'onward';
const ONWARD_ROW_LABEL_KEY = 'Label.YearAndOnward';
const ONWARD_YEAR_OFFSET = 1;

export const buildRoadmapRows = (items: RoadmapItem[]): RoadmapRow[] => {
  const committedYears = items
    .filter((item) => item.timeFrame !== null && item.year > 0)
    .map((item) => item.year);
  const earliestYear = committedYears.length > 0 ? Math.min(...committedYears) : undefined;

  const timeFrameRows: RoadmapRow[] =
    earliestYear === undefined
      ? []
      : TIME_FRAME_ROWS.map(({ timeFrame, labelKey, idPrefix }) => ({
          id: `${idPrefix}-${earliestYear}`,
          labelKey,
          year: earliestYear,
          matches: (item: RoadmapItem) =>
            item.timeFrame === timeFrame && item.year === earliestYear,
        }));

  const onwardItemYears = items
    .filter((item) => item.timeFrame === null && item.year > 0)
    .map((item) => item.year);
  let onwardYear = 0;
  if (earliestYear !== undefined) {
    onwardYear = earliestYear + ONWARD_YEAR_OFFSET;
  } else if (onwardItemYears.length > 0) {
    onwardYear = Math.min(...onwardItemYears);
  }

  const onwardRow: RoadmapRow = {
    id: ONWARD_ROW_ID,
    labelKey: ONWARD_ROW_LABEL_KEY,
    year: onwardYear,
    matches: (item) =>
      item.timeFrame === null || (earliestYear !== undefined && item.year > earliestYear),
  };

  return [...timeFrameRows, onwardRow];
};

export type TimelineRow = {
  row: RoadmapRow;
  rowItems: RoadmapItem[];
  startIndex: number;
};

export const buildTimelineRows = (
  items: RoadmapItem[],
  selectedCategory: string,
  selectedStage: string,
): TimelineRow[] => {
  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === FAVORITES_FILTER
        ? item.isLiked
        : selectedCategory === ALL_FILTER ||
          item.category.some((category) => category === selectedCategory);
    const matchesStage = selectedStage === ALL_STAGES_FILTER || item.devStage === selectedStage;
    return matchesCategory && matchesStage;
  });
  const populatedRows = buildRoadmapRows(items)
    .map((row) => {
      const rowItems = filteredItems.filter(row.matches);
      return {
        row,
        rowItems:
          selectedCategory === ALL_FILTER ? rowItems : rowItems.slice(0, MAX_ITEMS_PER_TIME_FRAME),
      };
    })
    .filter(({ rowItems }) => rowItems.length > 0);

  let runningIndex = 0;
  return populatedRows.map(({ row, rowItems }) => {
    const startIndex = runningIndex;
    runningIndex += rowItems.length;
    return { row, rowItems, startIndex };
  });
};

export const countVisibleItems = (
  items: RoadmapItem[],
  selectedCategory: string,
  selectedStage: string,
): number =>
  buildTimelineRows(items, selectedCategory, selectedStage).reduce(
    (total, { rowItems }) => total + rowItems.length,
    0,
  );
