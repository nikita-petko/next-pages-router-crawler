import React, { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { clsx } from '@rbx/foundation-ui';
import JobFilters from '../components/jobs/JobFilters';
import JobList from '../components/jobs/JobList';
import HeroBanner from '../components/shared/HeroBanner';
import PageContent from '../components/shared/PageContent';
import { useJobs } from '../hooks/useJobs';
import { useJobsViewModel } from '../hooks/useJobViewModel';
import { useStudios } from '../hooks/useStudios';
import { useStudiosViewModel } from '../hooks/useStudioViewModel';
import { useMyStudios } from '../hooks/useMyStudios';
import type { JobsListJobsRequest, JobViewModel } from '../types';
import { logFilterChange, logJobCardClick, logJobsPageView } from '../analytics';
import styles from '../components/shared/Layout.module.css';
import SidePanelWrapper from './SidePanelWrapper';

export const FindJobsV2Container: React.FC = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<JobsListJobsRequest>({});

  useEffect(() => {
    logJobsPageView();
  }, []);

  const selectedJobId = (router.query.jobId as string) ?? null;

  const setSelectedJobId = useCallback(
    (id: string | null) => {
      const { jobId: _, ...rest } = router.query;
      if (id) {
        router.replace({ query: { ...rest, jobId: id } }, undefined, { shallow: true });
      } else {
        router.replace({ query: rest }, undefined, { shallow: true });
      }
    },
    [router],
  );

  const { data, isLoading, error, refetch } = useJobs(filters);
  const jobs = useJobsViewModel(data?.jobs ?? []);
  const { data: studiosData } = useStudios();
  const studios = useStudiosViewModel(studiosData?.studios ?? []);
  const { data: myStudiosData } = useMyStudios();
  const myStudio = myStudiosData?.studios?.[0];
  const postJobHref =
    myStudio?.id && myStudio.permissions?.includes('write')
      ? `/hire/studios/onboard?studioId=${myStudio.id}`
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

  return (
    <React.Fragment>
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
      <div className={clsx(selectedJobId && styles.jobsPageGrid)}>
        <PageContent
          testId='talent-hub-v2-jobs'
          className={clsx(selectedJobId && styles.jobsHeroSpan)}>
          <HeroBanner
            title='Get hired by top Roblox studios'
            subtitle='Explore open jobs from Roblox studios and apply today.'
          />
          {!selectedJobId && (
            <React.Fragment>
              <JobFilters
                filters={filters}
                onChange={handleFiltersChange}
                studios={studios}
                postJobHref={postJobHref}
              />
              <JobList
                jobs={jobs}
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={() => refetch()}
                onJobClick={handleJobClick}
              />
            </React.Fragment>
          )}
        </PageContent>
        {selectedJobId && (
          <React.Fragment>
            <div
              className={clsx(
                styles.jobsContentSpan,
                styles.jobsMainFlush,
                'flex flex-col gap-large padding-small small:padding-medium',
              )}>
              <JobFilters
                filters={filters}
                onChange={handleFiltersChange}
                studios={studios}
                postJobHref={postJobHref}
              />
              <JobList
                jobs={jobs}
                isLoading={isLoading}
                error={error as Error | null}
                onRetry={() => refetch()}
                onJobClick={handleJobClick}
              />
            </div>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop dismiss does not need keyboard interaction */}
            <div className={styles.mobileBackdrop} onClick={handleClosePanel} />
            <div className={styles.jobsRail}>
              <SidePanelWrapper jobId={selectedJobId} onClose={handleClosePanel} />
            </div>
          </React.Fragment>
        )}
      </div>
    </React.Fragment>
  );
};

export default FindJobsV2Container;
