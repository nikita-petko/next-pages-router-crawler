import { ExperienceReview } from '@rbx/clients/playerGeneratedReviewsService';
import { PlayerFeedbackFilterDimension } from '../types/PlayerFeedbackFilters';

/**
 * Apply frontend filters to reviews
 * @param reviews - Array of reviews to filter
 * @param filterState - Current filter state
 * @returns Filtered array of reviews
 */
export const applyFiltersToReviews = (
  reviews: ExperienceReview[],
  filterState: Record<PlayerFeedbackFilterDimension, string[]>,
): ExperienceReview[] => {
  if (!reviews || reviews.length === 0) return [];

  let filteredReviews = reviews;

  if (filterState[PlayerFeedbackFilterDimension.OperatingSystem].length > 0) {
    filteredReviews = filteredReviews.filter((review) =>
      filterState[PlayerFeedbackFilterDimension.OperatingSystem].includes(
        review.metadata.operatingSystemType,
      ),
    );
  }

  if (filterState[PlayerFeedbackFilterDimension.DeviceType].length > 0) {
    filteredReviews = filteredReviews.filter((review) =>
      filterState[PlayerFeedbackFilterDimension.DeviceType].includes(review.metadata.deviceType),
    );
  }

  return filteredReviews;
};

/**
 * Check if there are any active filters
 * @param filterState - Current filter state
 * @returns True if any filters are active
 */
export const hasActiveFilters = (
  filterState: Record<PlayerFeedbackFilterDimension, string[]>,
): boolean => {
  return Object.values(filterState).some((values) => values.length > 0);
};

/**
 * Get filter summary for debugging/logging
 * @param filterState - Current filter state
 * @returns Object with filter counts and summary
 */
export const getFilterSummary = (filterState: Record<PlayerFeedbackFilterDimension, string[]>) => {
  return {
    operatingSystem: {
      count: filterState[PlayerFeedbackFilterDimension.OperatingSystem].length,
      values: filterState[PlayerFeedbackFilterDimension.OperatingSystem],
    },
    deviceType: {
      count: filterState[PlayerFeedbackFilterDimension.DeviceType].length,
      values: filterState[PlayerFeedbackFilterDimension.DeviceType],
    },
    totalActive: Object.values(filterState).reduce((sum, values) => sum + values.length, 0),
  };
};

/**
 * Calculate the total count of active filters
 * @param filterState - Current filter state
 * @returns Total count of active filter values
 */
export const getActiveFilterCount = (
  filterState: Record<PlayerFeedbackFilterDimension, string[]>,
): number => {
  return Object.values(filterState).reduce((sum, values) => sum + values.length, 0);
};

/**
 * Check if we have enough filtered data for the next page
 * @param rawData - Raw data array
 * @param filterState - Current filter state
 * @param pageNumber - Current page number
 * @param pageSize - Page size
 * @returns True if we have enough filtered data for the next page
 */
export const hasEnoughFilteredDataForNextPage = (
  rawData: ExperienceReview[],
  filterState: Record<PlayerFeedbackFilterDimension, string[]>,
  pageNumber: number,
  pageSize: number,
): boolean => {
  const filteredData = applyFiltersToReviews(rawData, filterState);
  const nextPageStartIndex = (pageNumber + 1) * pageSize;
  return filteredData.length > nextPageStartIndex;
};

/**
 * Check if we have enough raw data for the next page
 * @param rawData - Raw data array
 * @param pageNumber - Current page number
 * @param pageSize - Page size
 * @returns True if we have enough raw data for the next page
 */
export const hasEnoughRawDataForNextPage = (
  rawData: ExperienceReview[],
  pageNumber: number,
  pageSize: number,
): boolean => {
  const nextPageStartIndex = (pageNumber + 1) * pageSize;
  return rawData.length > nextPageStartIndex;
};

/**
 * Get current page data from filtered data
 * @param rawData - Raw data array
 * @param filterState - Current filter state
 * @param pageNumber - Current page number
 * @param pageSize - Page size
 * @returns Current page data
 */
export const getCurrentPageData = (
  rawData: ExperienceReview[],
  filterState: Record<PlayerFeedbackFilterDimension, string[]>,
  pageNumber: number,
  pageSize: number,
): ExperienceReview[] => {
  const filteredData = applyFiltersToReviews(rawData, filterState);
  if (!filteredData.length) return [];
  const startIndex = pageNumber * pageSize;
  return filteredData.slice(startIndex, startIndex + pageSize);
};
