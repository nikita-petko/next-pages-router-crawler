import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { StudioFilters, type StudioFiltersState } from '../components/studios/StudioFilters';
import StudioList from '../components/studios/StudioList';
import PageContent from '../components/shared/PageContent';
import { useJobs } from '../hooks/useJobs';
import { useStudios } from '../hooks/useStudios';
import { useStudiosViewModel } from '../hooks/useStudioViewModel';
import { logStudioCardClick, logStudiosPageView } from '../analytics';
import { API_TEAM_SIZE_LABELS } from '../constants';
import type { StudioViewModel } from '../types';

export const FindStudiosV2Container: React.FC = () => {
  const [filters, setFilters] = useState<StudioFiltersState>({});

  useEffect(() => {
    logStudiosPageView();
  }, []);
  const { data, isLoading, error, refetch } = useStudios();
  const studios = useStudiosViewModel(data?.studios ?? []);
  const { data: jobsData } = useJobs();

  const jobCounts = useMemo(() => {
    const list = jobsData?.jobs ?? [];
    return list.reduce<Record<string, number>>((acc, job) => {
      if (!job?.studioId) return acc;
      acc[job.studioId] = (acc[job.studioId] ?? 0) + 1;
      return acc;
    }, {});
  }, [jobsData?.jobs]);

  const studiosWithCounts = useMemo(
    () =>
      studios
        .map((studio) => ({
          ...studio,
          openJobsCount: jobCounts[studio.id] ?? 0,
        }))
        // TODO: Compare by enum value instead of display string to avoid
        // breakage if label text in API_TEAM_SIZE_LABELS changes.
        .filter((studio) => {
          if (
            filters.teamSize != null &&
            studio.teamSizeLabel !== API_TEAM_SIZE_LABELS[filters.teamSize]
          ) {
            return false;
          }
          return true;
        }),
    [studios, jobCounts, filters],
  );

  const getStudioHref = useCallback((studio: StudioViewModel) => `/hire/studios/${studio.id}`, []);

  const handleStudioClick = useCallback((studio: StudioViewModel) => {
    logStudioCardClick(studio);
  }, []);

  return (
    <React.Fragment>
      <Head>
        <title>Talent Hub Studios</title>
        <meta
          name='description'
          content='Explore Roblox studios and discover teams hiring now.'
          key='description'
        />
        <meta property='og:title' content='Talent Hub Studios' key='og:title' />
        <meta
          property='og:description'
          content='Explore Roblox studios and discover teams hiring now.'
          key='og:description'
        />
      </Head>
      <PageContent testId='talent-hub-v2-studios'>
        <StudioFilters filters={filters} onChange={setFilters} onReset={() => setFilters({})} />
        <StudioList
          studios={studiosWithCounts}
          isLoading={isLoading}
          error={error as Error | null}
          onRetry={() => refetch()}
          getStudioHref={getStudioHref}
          onStudioClick={handleStudioClick}
        />
      </PageContent>
    </React.Fragment>
  );
};

export default FindStudiosV2Container;
