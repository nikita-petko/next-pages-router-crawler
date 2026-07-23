// 14 days for initial experiment, 1.5 days for analyzing, plus some buffer for the analyzing state
export const getExperimentDurationDays = () => 16;
export const getHoldoutDurationDays = () => 28;

// Local storage for whether user has seen the failed experiment banner
export const lastViewedFailedPriceExperimentKey = 'lastViewedFailedPriceExperiment';

// Local storage for whether user has seen the intro modal for price optimization
export const hasViewedIntroductionKey = 'hasViewedPriceOptimizationIntroduction';

// Local storage for whether the user has seen/confirmed holdout finished after polling
export const lastViewedHoldoutFinishedKey = 'lastViewedHoldoutFinished';

export const holdoutTestPopulation = 0.05;
export const maxTestPopulation = 0.5;
export const maxNumCohorts = 6;

// Default holdout test population for legacy experiments before PO Expansion
export const legacyHoldoutTestPopulation = 0.02;
