import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  logFilterChange,
  logJobCardClick,
  logJobsPageView,
  logStudioCardClick,
} from '../analytics';
import { JobFilters } from '../components/jobs/JobFilters';
import { JobList } from '../components/jobs/JobList';
import PageContent from '../components/shared/PageContent';
import { StudioCard } from '../components/studios/StudioCard';
import { useJobs } from '../hooks/useJobs';
import { useJobsViewModel } from '../hooks/useJobViewModel';
import { useMyStudios } from '../hooks/useMyStudios';
import { useStudios } from '../hooks/useStudios';
import { useStudiosViewModel } from '../hooks/useStudioViewModel';
import { JobStatus } from '../types';
import type { JobsListJobsRequest, JobViewModel } from '../types';
import SidePanelWrapper from './SidePanelWrapper';
import styles from '../components/shared/Layout.module.css';

const MAX_FEATURED_STUDIOS = 3;

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = Math.imul(31, hash) + value.charCodeAt(i);
  }
  return Math.abs(hash);
}

function dailySeed(): string {
  return new Date().toISOString().slice(0, 10);
}

export const FindJobsV2Container: React.FC = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<JobsListJobsRequest>({});
  const [featuredStudioSeed, setFeaturedStudioSeed] = useState('');

  useEffect(() => {
    logJobsPageView();
  }, []);

  useEffect(() => {
    setFeaturedStudioSeed(dailySeed());
  }, []);

  useEffect(() => {
    const studioId = typeof router.query.studioId === 'string' ? router.query.studioId : '';
    if (!studioId) {
      return;
    }
    setFilters((prev) => {
      if (prev.studioId?.length === 1 && prev.studioId[0] === studioId) {
        return prev;
      }
      return { ...prev, studioId: [studioId] };
    });
  }, [router.query.studioId]);

  const selectedJobId = typeof router.query.jobId === 'string' ? router.query.jobId : null;

  const setSelectedJobId = useCallback(
    (id: string | null) => {
      const { jobId: _, ...rest } = router.query;
      if (id) {
        void router.replace({ query: { ...rest, jobId: id } }, undefined, { shallow: true });
      } else {
        void router.replace({ query: rest }, undefined, { shallow: true });
      }
    },
    [router],
  );

  const openJobsFilters = useMemo(() => ({ ...filters, status: [JobStatus.NUMBER_0] }), [filters]);
  const { data, isLoading, error, refetch } = useJobs(openJobsFilters);
  const jobs = useJobsViewModel(data?.jobs ?? []);
  const { data: recentJobsData } = useJobs({ status: [JobStatus.NUMBER_0] });
  const { data: studiosData } = useStudios();
  const studios = useStudiosViewModel(studiosData?.studios ?? []);
  const { data: myStudiosData } = useMyStudios();
  const myStudio = myStudiosData?.studios?.[0];
  const postJobHref =
    myStudio?.id && myStudio.permissions?.includes('write')
      ? '/hire/my-studio/post-job'
      : undefined;

  const handleFiltersChange = useCallback(
    (nextFilters: JobsListJobsRequest) => {
      setFilters(nextFilters);
      logFilterChange(nextFilters);
    },
    [setFilters],
  );

  const handleJobClick = useCallback(
    (job: JobViewModel) => {
      logJobCardClick(job);
      setSelectedJobId(job.id);
    },
    [setSelectedJobId],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedJobId(null);
  }, [setSelectedJobId]);

  const handleRetry = useCallback(() => {
    void refetch();
  }, [refetch]);

  const studioById = useMemo(() => {
    const mapping = new Map<string, (typeof studios)[number]>();
    studios.forEach((studio) => {
      if (!studio.id) {
        return;
      }
      mapping.set(studio.id, studio);
    });
    return mapping;
  }, [studios]);

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
    return qs.toString();
  }, [router.query]);

  const getRecentStudioHref = useCallback(
    (studioId: string) => {
      const params = new URLSearchParams(qaParams);
      params.set('from', 'jobs');
      const qs = params.toString();
      return `/hire/studios/${studioId}${qs ? `?${qs}` : ''}`;
    },
    [qaParams],
  );
  const allStudiosHref = useMemo(
    () => `/hire/studios${qaParams ? `?${qaParams}` : ''}`,
    [qaParams],
  );

  const featuredStudios = useMemo(() => {
    const latestUpdateByStudio = new Map<string, number>();
    (recentJobsData?.jobs ?? []).forEach((job) => {
      if (!job.studioId) {
        return;
      }
      const updatedAt = new Date(job.updatedAt ?? job.createdAt ?? 0).getTime();
      const existing = latestUpdateByStudio.get(job.studioId) ?? 0;
      if (updatedAt > existing) {
        latestUpdateByStudio.set(job.studioId, updatedAt);
      }
    });

    return [...latestUpdateByStudio.entries()]
      .toSorted(([aStudioId, aUpdatedAt], [bStudioId, bUpdatedAt]) => {
        if (!featuredStudioSeed) {
          return bUpdatedAt - aUpdatedAt;
        }
        const aHash = hashString(`${featuredStudioSeed}:${aStudioId}`);
        const bHash = hashString(`${featuredStudioSeed}:${bStudioId}`);
        return aHash - bHash;
      })
      .map(([studioId]) => studioById.get(studioId))
      .filter((studio): studio is NonNullable<typeof studio> => Boolean(studio))
      .slice(0, MAX_FEATURED_STUDIOS);
  }, [featuredStudioSeed, recentJobsData?.jobs, studioById]);

  return (
    <>
      <Head>
        <title>Talent Hub Jobs</title>
        <meta
          name='description'
          content='Find Roblox jobs from top studios and teams.'
          key='description'
        />
        <meta property='og:title' content='Talent Hub Jobs' key='og:title' />
        <meta
          property='og:description'
          content='Find Roblox jobs from top studios and teams.'
          key='og:description'
        />
      </Head>
      <div className={styles.overlayWrapper}>
        <PageContent testId='talent-hub-v2-jobs'>
          {featuredStudios.length > 0 ? (
            <div className={styles.recentStudiosSection}>
              <div className={styles.recentStudiosHeader}>
                <div className='text-heading-medium'>Browse studios</div>
                <Link href={allStudiosHref} className={styles.recentStudiosSeeAll}>
                  <span>See all studios</span>
                  <span aria-hidden='true'>{'>'}</span>
                </Link>
              </div>
              <div className={styles.recentStudiosGrid}>
                {featuredStudios.map((studio) => (
                  <div key={studio.id} className={styles.recentStudioGridItem}>
                    <StudioCard
                      studio={studio}
                      href={getRecentStudioHref(studio.id)}
                      onClick={logStudioCardClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className={`text-heading-medium ${styles.browseJobsHeading}`}>Browse jobs</div>
          <JobFilters
            filters={filters}
            onChange={handleFiltersChange}
            studios={studios}
            postJobHref={postJobHref}
          />
          <JobList
            jobs={jobs}
            isLoading={isLoading}
            error={error instanceof Error ? error : null}
            onRetry={handleRetry}
            onJobClick={handleJobClick}
          />
        </PageContent>
        {selectedJobId && (
          <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mobile backdrop tap-to-dismiss */}
            <div className={styles.mobileBackdrop} onClick={handleClosePanel} />
            <div className={styles.overlayRail}>
              <SidePanelWrapper jobId={selectedJobId} onClose={handleClosePanel} />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default FindJobsV2Container;
