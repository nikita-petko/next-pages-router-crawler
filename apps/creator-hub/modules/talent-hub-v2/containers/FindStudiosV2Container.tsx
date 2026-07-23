import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { logStudioCardClick, logStudiosPageView } from '../analytics';
import PageContent from '../components/shared/PageContent';
import { StudioFilters, type StudioFiltersState } from '../components/studios/StudioFilters';
import StudioList from '../components/studios/StudioList';
import { API_TEAM_SIZE_LABELS } from '../constants';
import { useJobs } from '../hooks/useJobs';
import { useStudios } from '../hooks/useStudios';
import { useStudiosViewModel } from '../hooks/useStudioViewModel';
import { JobStatus } from '../types';
import type { StudioViewModel } from '../types';

export const FindStudiosV2Container: React.FC = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<StudioFiltersState>({});

  useEffect(() => {
    logStudiosPageView();
  }, []);
  const { data, isLoading, error, refetch } = useStudios();
  const studios = useStudiosViewModel(data?.studios ?? []);
  const { data: jobsData } = useJobs({ status: [JobStatus.NUMBER_0] });

  const jobCounts = useMemo(() => {
    const list = jobsData?.jobs ?? [];
    return list.reduce<Record<string, number>>((acc, job) => {
      if (!job?.studioId) {
        return acc;
      }
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

  const qaParams = useMemo(() => {
    const qs = new URLSearchParams();
    const { th2, th2m2, mocks, local } = router.query;
    if (typeof th2 === 'string') {
      qs.set('th2', th2);
    }
    if (typeof th2m2 === 'string') {
      qs.set('th2m2', th2m2);
    }
    if (typeof mocks === 'string') {
      qs.set('mocks', mocks);
    }
    if (typeof local === 'string') {
      qs.set('local', local);
    }
    return qs;
  }, [router.query]);

  const getStudioHref = useCallback(
    (studio: StudioViewModel) => {
      const qs = new URLSearchParams(qaParams);
      const query = qs.toString();
      return `/hire/studios/${studio.id}${query ? `?${query}` : ''}`;
    },
    [qaParams],
  );

  const handleStudioClick = useCallback((studio: StudioViewModel) => {
    logStudioCardClick(studio);
  }, []);

  const handleReset = useCallback(() => setFilters({}), []);
  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <>
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
        <StudioFilters filters={filters} onChange={setFilters} onReset={handleReset} />
        <StudioList
          studios={studiosWithCounts}
          isLoading={isLoading}
          error={error instanceof Error ? error : null}
          onRetry={handleRetry}
          getStudioHref={getStudioHref}
          onStudioClick={handleStudioClick}
          preferCommunityLink={false}
        />
      </PageContent>
    </>
  );
};

export default FindStudiosV2Container;
