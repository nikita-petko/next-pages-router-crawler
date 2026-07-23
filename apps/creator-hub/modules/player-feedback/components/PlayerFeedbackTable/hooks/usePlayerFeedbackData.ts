import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ExperienceReview } from '@rbx/client-player-generated-reviews-service/v1';
import { ReviewCategoryTypeFromJSON } from '@rbx/client-player-generated-reviews-service/v1';
import { useGetAssetReviews } from '@modules/react-query/playerFeedback';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { CategoryType } from '../constants/PlayerFeedbackTableConfigs';
import type { PlayerFeedbackFilterDimension } from '../types/PlayerFeedbackFilters';
import {
  getActiveFilterCount,
  hasEnoughFilteredDataForNextPage,
  getCurrentPageData,
} from '../utils/filterUtils';

interface UsePlayerFeedbackDataParams {
  rootPlaceId: number;
  pageSize: number;
  pageNumber: number;
  startDate: Date;
  endDate: Date;
  categoryType: CategoryType;
  filterState: Record<PlayerFeedbackFilterDimension, string[]>;
}

const DATA_LIMIT = 1000;

interface UsePlayerFeedbackDataReturn {
  data: ExperienceReview[];
  currentPageData: ExperienceReview[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  nextCursor?: string;
  pagination: {
    page: number;
    pageSize: number;
    hasNext: boolean;
    hasPrevious: boolean;
    onNextPage: () => void;
    onPreviousPage: () => void;
    setPageSize: (newPageSize: number) => void;
  };
  refetch: () => void;
}

// The generated ReviewCategoryType type does not include InExperience yet.
// ReviewCategoryTypeFromJSON preserves the wire value without using an unsafe cast.
const getReviewCategoryType = (categoryType: CategoryType) => {
  if (categoryType === CategoryType.All) {
    return undefined;
  }

  return ReviewCategoryTypeFromJSON(categoryType);
};

const usePlayerFeedbackData = ({
  rootPlaceId,
  pageSize,
  pageNumber,
  startDate,
  endDate,
  categoryType,
  filterState,
}: UsePlayerFeedbackDataParams): UsePlayerFeedbackDataReturn => {
  const { settings } = useSettings();
  const isCategoryResetBeforeResponseEnabled =
    settings.enablePlayerFeedbackCategoryResetBeforeResponse;

  const activeFilterCount = useMemo(() => {
    return getActiveFilterCount(filterState);
  }, [filterState]);

  const [previousFilterCount, setPreviousFilterCount] = useState(0);
  const [rawData, setRawData] = useState<ExperienceReview[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(undefined);
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [lastKnownHasMore, setLastKnownHasMore] = useState<boolean>(false);

  const effectiveLimit = useMemo(() => {
    if (activeFilterCount === 0) {
      return pageSize;
    }

    const currentFilteredData = getCurrentPageData(rawData, filterState, pageNumber, pageSize);
    const currentPageDataCount = currentFilteredData.length;

    if (currentPageDataCount >= pageSize) {
      return pageSize;
    }

    const neededData = pageSize - currentPageDataCount;

    let filterSelectivity = 1;
    if (rawData.length > 0) {
      const filteredRatio = currentPageDataCount / Math.min(rawData.length, pageSize * 2);
      filterSelectivity = Math.max(1, 1 / Math.max(filteredRatio, 0.1));
    } else {
      filterSelectivity = Math.max(1, activeFilterCount);
    }

    const dynamicLimit = Math.ceil(neededData * filterSelectivity * 2);
    const minLimit = Math.max(pageSize, neededData * 2);
    const maxLimit = 500;

    return Math.min(Math.max(dynamicLimit, minLimit), maxLimit);
  }, [pageSize, activeFilterCount, rawData, filterState, pageNumber]);

  useEffect(() => {
    if (previousFilterCount === 0 && activeFilterCount > 0) {
      setRawData([]);
      setCurrentCursor(undefined);
    }
    setPreviousFilterCount(activeFilterCount);
  }, [activeFilterCount, previousFilterCount]);

  const hasEnoughFilteredDataForCurrentPage = useMemo(() => {
    const filteredData = getCurrentPageData(rawData, filterState, pageNumber, pageSize);
    return filteredData.length >= pageSize;
  }, [rawData, filterState, pageNumber, pageSize]);

  const needsMoreData = useMemo(() => {
    const nextPageStartIndex = (pageNumber + 1) * pageSize;
    const hasEnoughRawData = rawData.length > nextPageStartIndex;
    const hasReachedLimit = rawData.length >= DATA_LIMIT;

    return (
      (!hasEnoughRawData && !hasReachedLimit) ||
      (pageNumber === 0 && rawData.length === 0) ||
      !hasEnoughFilteredDataForCurrentPage
    );
  }, [rawData.length, pageNumber, pageSize, hasEnoughFilteredDataForCurrentPage]);

  const resetRawData = useCallback(() => {
    setRawData([]);
    setCurrentCursor(undefined);
    setLastKnownHasMore(false);
  }, []);

  // This reset effect must stay above the response-handling effect below.
  // When the selected category already has cached query data, React Query can synchronously
  // return that cached response on rerender. Resetting first prevents that cached data from
  // being appended and then wiped in the same effect phase.
  useEffect(() => {
    if (isCategoryResetBeforeResponseEnabled) {
      resetRawData();
      setIsPageTransitioning(true);
    }
  }, [isCategoryResetBeforeResponseEnabled, categoryType, startDate, endDate, resetRawData]);

  const {
    data: reviewsData,
    isLoading,
    isError,
    refetch,
  } = useGetAssetReviews(
    rootPlaceId,
    effectiveLimit,
    currentCursor,
    startDate.toISOString(),
    endDate.toISOString(),
    getReviewCategoryType(categoryType),
    needsMoreData,
  );

  useEffect(() => {
    if (reviewsData?.reviews) {
      setRawData((prev) => {
        const newData = [...prev, ...reviewsData.reviews];
        return newData.slice(-DATA_LIMIT);
      });

      if (reviewsData.nextCursor) {
        setCurrentCursor(reviewsData.nextCursor);
      }

      if (reviewsData.hasMore !== undefined) {
        setLastKnownHasMore(reviewsData.hasMore);
      }
    }
  }, [reviewsData?.reviews, reviewsData?.nextCursor, reviewsData?.hasMore]);

  useEffect(() => {
    if (!isCategoryResetBeforeResponseEnabled) {
      resetRawData();
      setIsPageTransitioning(true);
    }
  }, [isCategoryResetBeforeResponseEnabled, categoryType, startDate, endDate, resetRawData]);

  const currentPageData = useMemo(() => {
    return getCurrentPageData(rawData, filterState, pageNumber, pageSize);
  }, [rawData, filterState, pageNumber, pageSize]);

  useEffect(() => {
    if (currentPageData.length >= 0) {
      setIsPageTransitioning(false);
    }
  }, [currentPageData]);

  const hasMore = useMemo(() => {
    const hasEnoughFilteredData = hasEnoughFilteredDataForNextPage(
      rawData,
      filterState,
      pageNumber,
      pageSize,
    );

    const hasMoreFromBackend = reviewsData?.hasMore ?? lastKnownHasMore;

    return hasEnoughFilteredData || hasMoreFromBackend;
  }, [rawData, filterState, pageNumber, pageSize, reviewsData?.hasMore, lastKnownHasMore]);

  const onNextPage = useCallback(() => {}, []);

  const onPreviousPage = useCallback(() => {}, []);

  const setPageSize = useCallback(() => {}, []);

  return {
    data: rawData,
    currentPageData,
    isLoading: isLoading || isPageTransitioning,
    isError,
    hasMore,
    nextCursor: reviewsData?.nextCursor,
    pagination: {
      page: pageNumber,
      pageSize,
      hasNext: hasMore,
      hasPrevious: pageNumber > 0,
      onNextPage,
      onPreviousPage,
      setPageSize,
    },
    refetch,
  };
};

export default usePlayerFeedbackData;
