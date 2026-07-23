import React, { FC, useCallback, useEffect, useMemo } from 'react';
import {
  logAnalyticsHomeExperiencesTableImpression,
  useApiRequest,
  useOwner,
  usePaginatedSearchUniverses,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { gamesClient } from '@modules/clients';
import { Surface } from '@rbx/clients/universesApi';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import ExperiencesTable from './experiencesTable/ExperiencesTable';
import ExperiencesTableRow from './experiencesTable/ExperiencesTableRow';
import { ExperiencesTableMetricColumnsOrder } from './experiencesTable/ExperiencesTableMetrics';
import experiencesRAQIV2ColumDataAdapter from '../adapters/experiencesRAQIV2ColumnDataAdapter';
import useExperiencesColumnData from './useExperiencesColumnData';

const MostRecentExperiencesTableV2: FC = () => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const owner = useOwner();
  const {
    data: mostRecentExperiencesData,
    isDataLoading,
    isResponseFailed,
    isUserForbidden,
    pagination,
  } = usePaginatedSearchUniverses({
    owner,
    pageSizeOptions: [10, 20, 50, 100],
    defaultPageSize: 10,
    surface: Surface.CreatorHubAnalytics,
  });

  const mostRecentExperiencesIds = useMemo(
    () =>
      (mostRecentExperiencesData?.data?.map((exp) => exp.id).filter((id) => id) ?? []) as number[],
    [mostRecentExperiencesData],
  );

  const { data: columnData } = useExperiencesColumnData({
    universeIds: mostRecentExperiencesIds,
    keys: ExperiencesTableMetricColumnsOrder,
  });

  const fetchExperienceDetails = useCallback(
    async () =>
      mostRecentExperiencesIds.length > 0 ? gamesClient.getDetails(mostRecentExperiencesIds) : null,
    [mostRecentExperiencesIds],
  );
  const { data: experienceDetailsData } = useApiRequest(fetchExperienceDetails);

  const fetchVotesData = useCallback(
    async () =>
      mostRecentExperiencesIds.length > 0
        ? gamesClient.multigetGameVotes(mostRecentExperiencesIds)
        : null,
    [mostRecentExperiencesIds],
  );
  const { data: votesData } = useApiRequest(fetchVotesData);

  const experiences = useMemo(
    () =>
      experiencesRAQIV2ColumDataAdapter({
        votesData,
        experienceDetailsData,
        mostRecentExperiencesData,
        columnData,
        translationDependencies,
      }),
    [
      columnData,
      experienceDetailsData,
      mostRecentExperiencesData,
      translationDependencies,
      votesData,
    ],
  );

  // Send unified logging events
  const { unifiedLogger } = useUnifiedLoggerProvider();
  useEffect(() => {
    if (mostRecentExperiencesIds.length && owner.isFetched) {
      logAnalyticsHomeExperiencesTableImpression(unifiedLogger, {
        loggingTarget: {
          targetId: owner.ownerId,
          targetType: owner.ownerType,
        },
        experienceIds: mostRecentExperiencesIds,
      });
    }
  }, [owner, unifiedLogger, mostRecentExperiencesIds]);

  return (
    <ExperiencesTable
      isDataLoading={isDataLoading}
      isResponseFailed={isResponseFailed}
      isUserForbidden={isUserForbidden}
      {...pagination}>
      {experiences.map((experience) => (
        <ExperiencesTableRow key={experience.universeId} {...experience} />
      ))}
    </ExperiencesTable>
  );
};

export default MostRecentExperiencesTableV2;
