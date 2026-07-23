export const rootQueryKey = 'priceExperimentationApi';
export const isEligibleQueryKey = 'isEligibleForPriceExperimentation';
export const currentExperimentQueryKey = 'currentExperiment';
export const lastCompletedExperimentQueryKey = 'lastCompletedExperiment';
export const getExperimentProductsQueryKey = 'getExperimentProducts';
export const getGamePassesByIdsQueryKey = 'getGamePassesByIds';
export const getUniverseDevProductsQueryKey = 'getUniverseDevProducts';
export const getExperimentResultsQueryKey = 'getExperimentResults';
export const getExperimentMetricsQueryKey = 'getExperimentMetrics';
export const getHoldoutMetricsQueryKey = 'getHoldoutMetrics';
export const getExperimentationMetadataQueryKey = 'getExperimentationMetadata';
export const getProductTransactionVolumesQueryKey = 'getProductTransactionVolumes';

export const paginationLimit = 100;
export const mutationLimit = 25;
export const readBatchSize = 500;

export const queryRetry = 1;
export const mutationRetry = 1;

export const pollingInterval = 5000;
export const staleTime = 60000; // 1 minute
export const transactionVolumeStaleTime = 3_600_000; // 1 hour
