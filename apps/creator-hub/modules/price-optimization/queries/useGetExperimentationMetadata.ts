import { useQuery } from '@tanstack/react-query';
import priceExperimentationApi from '@modules/clients/priceExperimentation';
import { subDays } from '@rbx/core';
import { GetExperimentationMetadataResponse } from '@rbx/clients/priceExperimentationApi/v1';
import useFormatters from '../helpers/useFormatters';
import { getExperimentationMetadataQueryKey, queryRetry } from './constants';

const computeFreezeDates = (
  response: GetExperimentationMetadataResponse,
  mediumDateFormatter: Intl.DateTimeFormat,
) => {
  if (
    response &&
    response.experimentationDisableDates &&
    response.experimentationDisableDates.length > 0
  ) {
    const { startDate, endDate } = response.experimentationDisableDates[0];
    const notificationDurationDays = 28;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      const currentDate = new Date();
      const notificationDate = subDays(start, notificationDurationDays);

      if (currentDate >= notificationDate) {
        const formattedStartDate = mediumDateFormatter.format(start);
        const formattedEndDate = mediumDateFormatter.format(end);
        return {
          pauseDates: { startDate: formattedStartDate, endDate: formattedEndDate },
          hasUpcomingFreezePeriod: true,
          isWithinFreezePeriod: currentDate >= start && currentDate <= end,
        };
      }
    }
  }
  return {
    pauseDates: { startDate: null, endDate: null },
    hasUpcomingFreezePeriod: false,
    isWithinFreezePeriod: false,
  };
};

const useGetExperimentationMetadata = () => {
  const { mediumDateFormatter } = useFormatters();

  const queryKey = [getExperimentationMetadataQueryKey];

  const { data, isPending, isError } = useQuery({
    queryKey,
    queryFn: async () => {
      const response =
        await priceExperimentationApi.priceExperimentationApiGetExperimentationMetadata();

      const { pauseDates, hasUpcomingFreezePeriod, isWithinFreezePeriod } = computeFreezeDates(
        response,
        mediumDateFormatter,
      );

      let experimentProductsRequirements = {
        minCount: Number.MAX_SAFE_INTEGER,
        minTransactionVolumeLast30Days: Number.MAX_SAFE_INTEGER,
        minRobuxSpendFractionLast30Days: 1,
      };
      if (response && response.experimentProductsRequirements) {
        experimentProductsRequirements = response.experimentProductsRequirements;
      }

      const { holdoutDuration, experimentDuration } = response;

      return {
        pauseDates,
        hasUpcomingFreezePeriod,
        isWithinFreezePeriod,
        experimentProductsRequirements,
        holdoutDuration,
        experimentDuration,
      };
    },
    retry: queryRetry,
    staleTime: Infinity,
  });

  if (isPending || isError) {
    return {
      pauseDates: { startDate: null, endDate: null },
      hasUpcomingFreezePeriod: false,
      isWithinFreezePeriod: false,
      experimentProductsRequirements: {
        minCount: Number.MAX_SAFE_INTEGER,
        minTransactionVolumeLast30Days: Number.MAX_SAFE_INTEGER,
        minRobuxSpendFractionLast30Days: 1,
      },
      holdoutDuration: null,
      experimentDuration: null,
      isLoading: isPending,
      isError,
    };
  }

  return {
    pauseDates: data.pauseDates,
    hasUpcomingFreezePeriod: data.hasUpcomingFreezePeriod,
    isWithinFreezePeriod: data.isWithinFreezePeriod,
    experimentProductsRequirements: data.experimentProductsRequirements,
    holdoutDuration: data.holdoutDuration,
    experimentDuration: data.experimentDuration,
    isLoading: isPending,
    isError,
  };
};

export default useGetExperimentationMetadata;
