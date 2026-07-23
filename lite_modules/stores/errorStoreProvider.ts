import { create } from 'zustand';

interface HomePageErrorStoreType {
  dateFilteringLoadingError: boolean;
  setDateFilteringLoadingError: (hasError: boolean) => void;
}

export const useHomePageErrorStore = create<HomePageErrorStoreType>((set) => ({
  dateFilteringLoadingError: false,
  setDateFilteringLoadingError: (hasError: boolean) =>
    set(() => ({ dateFilteringLoadingError: hasError })),
}));

interface HomePageRateLimitStoreType {
  dateFilteringRateLimitExceeded: boolean;
  setDateFilteringRateLimitExceeded: (hasExceededRateLimit: boolean) => void;
}

export const useHomePageRateLimitStore = create<HomePageRateLimitStoreType>((set) => ({
  dateFilteringRateLimitExceeded: false,
  setDateFilteringRateLimitExceeded: (hasExceededRateLimit: boolean) =>
    set(() => ({ dateFilteringRateLimitExceeded: hasExceededRateLimit })),
}));
