import React, { useCallback, useEffect, useMemo, useState } from 'react';
/* eslint-disable @next/next/no-duplicate-head -- mutually exclusive branches across AppliedJobsView + studio jobs renders each include `<Head />` */
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button, Chip, clsx, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { resumeClient } from '../api/resumeClient';
import { downloadMockResume, downloadResumeUrl } from '../api/resumeDownload';
import { LoadingState } from '../components/feedback/LoadingState';
import PageContent from '../components/shared/PageContent';
import useAgeVerification from '../hooks/useAgeVerification';
import { useGetApplication } from '../hooks/useApplications';
import { useStudioInbox, useTalentApplied } from '../hooks/useInbox';
import { useJobs } from '../hooks/useJobs';
import { toJobViewModel } from '../hooks/useJobViewModel';
import { useMyStudios, useIsInStudioContext } from '../hooks/useMyStudios';
import { JobStatus } from '../types';
import type { ApiApplicationListItem, Job } from '../types';
import { isMocksEnabled, isNoApplicationsMockEnabled } from '../utils';
import { JobRow } from './MyJobsContainer.JobRow';
import {
  buildTalentHubHref,
  getSelectedApplicationId,
  getStudioJobsParams,
} from './MyJobsContainer.urls';
import SidePanelWrapper from './SidePanelWrapper';
import styles from '../components/shared/Layout.module.css';

export {
  buildTalentHubHref,
  buildTalentHubQueryString,
  getSelectedApplicationId,
  getStudioJobsParams,
} from './MyJobsContainer.urls';
export type { TalentHubQuery } from './MyJobsContainer.urls';

const NoApplicationsIllustration: React.FC = () => (
  <div className={styles.appliedEmptyIllustrationWrap} aria-hidden>
    <svg
      width='320'
      height='180'
      viewBox='0 0 320 180'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={styles.appliedEmptyIllustrationMain}>
      <path
        opacity='0.16'
        d='M216.986 124.942L217.374 126.39L128.509 150.202L128.121 148.753L216.986 124.942ZM218.754 121.88L194.943 33.0146C194.608 31.7643 193.382 30.9904 192.131 31.1928L191.881 31.2468L103.016 55.0581C101.765 55.3931 100.991 56.6188 101.194 57.8696L101.248 58.12L125.059 146.985C125.417 148.319 126.787 149.11 128.121 148.753L128.509 150.202L128.309 150.25C126.307 150.68 124.298 149.52 123.668 147.571L123.61 147.373L99.7989 58.5082C99.2272 56.3744 100.494 54.181 102.627 53.6093L191.493 29.7979L191.693 29.7493C193.762 29.3059 195.838 30.5592 196.392 32.6263L220.203 121.492L220.251 121.692C220.681 123.694 219.521 125.703 217.572 126.332L217.374 126.39L216.986 124.942C218.32 124.584 219.111 123.213 218.754 121.88Z'
        fill='#F7F7F8'
      />
      <path
        d='M154.289 91.5H150.379C146.851 91.5001 143.799 93.9597 143.05 97.4072L139.155 115.322C139.139 115.395 139.141 115.446 139.144 115.473C140.39 116.625 145.294 120 160 120C171.324 120 176.835 117.997 179.34 116.551L181.521 118.732C178.66 120.609 172.552 123 160 123C144.776 123 139.032 119.485 137.06 117.633C136.151 116.778 136.026 115.595 136.224 114.686L140.118 96.7695C141.167 91.9429 145.439 88.5001 150.379 88.5H151.289L154.289 91.5ZM132.152 61.9395C132.738 61.3538 133.688 61.3537 134.273 61.9395L188.273 115.939C188.859 116.525 188.859 117.475 188.273 118.06C187.688 118.646 186.738 118.646 186.152 118.06L132.152 64.0606C131.566 63.4748 131.566 62.5253 132.152 61.9395ZM169.621 88.5C174.56 88.5002 178.832 91.943 179.882 96.7695L181.402 103.766L177.479 99.8428L176.95 97.4072C176.201 93.9598 173.149 91.5002 169.621 91.5H169.137L166.137 88.5H169.621ZM150.357 59.7774C151.038 57.2396 153.647 55.7334 156.184 56.4132L169.973 60.1075C172.51 60.7879 174.017 63.3968 173.337 65.9346L169.643 79.7227L169.573 79.9571C168.824 82.2752 166.435 83.655 164.053 83.1446L163.815 83.0869L159.592 81.9551L155.348 77.711L164.592 80.1885C165.529 80.4393 166.493 79.8836 166.744 78.9463L170.438 65.1583C170.689 64.2209 170.133 63.2576 169.196 63.0059L155.408 59.3116C154.471 59.0605 153.507 59.6164 153.256 60.5538L150.072 72.4356L147.622 69.9854L150.357 59.7774Z'
        fill='#F7F7F8'
      />
    </svg>
  </div>
);

export const AppliedJobsTable: React.FC<{
  applications: ApiApplicationListItem[];
  selectedApplicationId: string | null;
  onSelect: (app: ApiApplicationListItem) => void;
}> = ({ applications, selectedApplicationId, onSelect }) => {
  const { translate } = useTranslation();

  return (
    <div
      className={clsx('overflow-hidden radius-medium', styles.borderedCard)}
      data-testid='applied-jobs-list'>
      <table className={styles.applicantTable}>
        <thead>
          <tr className={styles.applicantTableHeaderRow}>
            <th className='content-muted text-label-small'>{translate('Label.JobTitle')}</th>
            <th className='content-muted text-label-small'>{translate('Label.Studio')}</th>
            <th className='content-muted text-label-small'>{translate('Label.DateApplied')}</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr
              key={app.id}
              className={clsx(
                styles.applicantTableRow,
                app.id === selectedApplicationId && styles.applicantTableRowSelected,
              )}
              onClick={() => onSelect(app)}
              data-testid={`applied-row-${app.id}`}
              aria-label={app.jobTitle ?? translate('Label.JobTitle')}>
              <td>
                <span className='content-default text-body-medium'>{app.jobTitle ?? ''}</span>
              </td>
              <td>
                <span className='content-muted text-body-small'>{app.studioName ?? ''}</span>
              </td>
              <td>
                <span className='content-muted text-body-small'>
                  {app.createdAt
                    ? new Date(app.createdAt).toLocaleDateString(undefined, {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '\u2014'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Talent-side "Applied" list.
 *
 * Backend `ApplicationListItem` does NOT carry `jobId` — only jobTitle and
 * studioName. The legacy UI used jobId to drive a side-panel `SidePanelWrapper`
 * preview, but since that's no longer reachable from the list row, the
 * selection model moves to `applicationId` (which IS returned) and tapping
 * an entry now deep-links to the job browse page via studio name. Deep-link
 * to the actual job requires another call: `GET /api/Applications/{id}` for
 * the full `Application` (which DOES include `jobId`), then push that.
 */
const AppliedJobsView: React.FC = () => {
  const { translate } = useTranslation();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    },
    [translate],
  );
  const router = useRouter();
  const { user } = useAuthentication();
  const isAuthenticated = Boolean(user);
  const { isVerified, isLoading: isAgeVerificationLoading } = useAgeVerification(isAuthenticated);
  const { data: inboxData, isFetching } = useTalentApplied();
  const forceEmpty = isNoApplicationsMockEnabled();
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [resumeDownloadError, setResumeDownloadError] = useState<string | null>(null);
  const applications = useMemo<ApiApplicationListItem[]>(
    () =>
      forceEmpty ? [] : (inboxData?.items ?? []).filter((a): a is ApiApplicationListItem => !!a.id),
    [inboxData, forceEmpty],
  );

  const selectedApplicationId = getSelectedApplicationId(router.query.applicationId);

  const setSelectedApplicationId = useCallback(
    (id: string | null) => {
      const { applicationId: _, ...rest } = router.query;
      if (id) {
        void router.replace({ query: { ...rest, applicationId: id } }, undefined, {
          shallow: true,
        });
      } else {
        void router.replace({ query: rest }, undefined, { shallow: true });
      }
    },
    [router],
  );

  const handleSelectApp = useCallback(
    (app: ApiApplicationListItem) => {
      if (app.id) {
        setSelectedApplicationId(app.id);
      }
    },
    [setSelectedApplicationId],
  );

  const handleClosePanel = useCallback(() => {
    setSelectedApplicationId(null);
  }, [setSelectedApplicationId]);

  // The list endpoint doesn't return jobId on its rows — the server sends
  // jobTitle + studioName only. To show the side-panel job preview we fetch
  // the full Application by id (which DOES include jobId) whenever one is
  // selected.
  const { data: selectedApplicationDetail } = useGetApplication(selectedApplicationId ?? undefined);
  const selectedJobId = selectedApplicationDetail?.jobId ?? null;
  const selectedResumeId = selectedApplicationDetail?.resumeId ?? null;

  const handleDownloadSelectedResume = useCallback(async () => {
    if (!selectedResumeId) {
      return;
    }
    setIsDownloadingResume(true);
    setResumeDownloadError(null);
    try {
      if (isMocksEnabled()) {
        downloadMockResume();
        return;
      }
      const { downloadUrl } = await resumeClient.getDownloadUrl(selectedResumeId);
      if (!downloadUrl) {
        throw new Error('Missing resume download URL');
      }
      await downloadResumeUrl(downloadUrl);
    } catch {
      setResumeDownloadError(
        tr('Error.FailedToDownloadResume', 'Unable to download resume. Please try again.'),
      );
    } finally {
      setIsDownloadingResume(false);
    }
  }, [selectedResumeId, tr]);

  const browseHref = useMemo(() => buildTalentHubHref('/hire', router.query), [router.query]);

  useEffect(() => {
    if (!isAuthenticated || (!isAgeVerificationLoading && !isVerified)) {
      void router.replace(browseHref);
    }
  }, [browseHref, isAgeVerificationLoading, isAuthenticated, isVerified, router]);

  if (isFetching || isAgeVerificationLoading || !isAuthenticated || !isVerified) {
    return <LoadingState itemCount={4} />;
  }

  if (applications.length === 0) {
    return (
      <>
        <Head>
          <title>{tr('Text.MyApplicationsTitle', 'My applications - Talent Hub')}</title>
        </Head>
        <PageContent testId='talent-hub-v2-applied-empty' className={styles.centeredEmptyPage}>
          <div className={styles.appliedEmptyState}>
            <NoApplicationsIllustration />
            <div className='text-align-center text-heading-medium'>
              {translate('Empty.NoApplicationsYet')}
            </div>
            <div
              className={clsx(
                'text-align-center content-muted text-body-medium',
                styles.appliedEmptyText,
              )}>
              {tr(
                'Empty.NoApplicationsDescription',
                'You have not applied to any jobs. Browse the job board and start applying today.',
              )}
            </div>
            <Button as='a' href={browseHref} variant='Emphasis' size='Medium'>
              {translate('Action.BrowseJobs')}
            </Button>
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{tr('Text.MyApplicationsTitle', 'My applications - Talent Hub')}</title>
      </Head>
      <div className={styles.overlayWrapper}>
        <PageContent testId='talent-hub-v2-applied'>
          <div className='gap-xxsmall flex flex-col'>
            <div className='text-title-large'>
              {tr('Heading.MyApplications', 'My applications')}
            </div>
            <div className='content-muted text-body-medium'>
              {tr(
                'Description.MyApplications',
                "Here are the jobs you've applied to. If there's interest, studios will contact you directly via email.",
              )}
            </div>
          </div>
          <AppliedJobsTable
            applications={applications}
            selectedApplicationId={selectedApplicationId}
            onSelect={handleSelectApp}
          />
        </PageContent>
        {selectedApplicationId && selectedJobId ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mobile backdrop tap-to-dismiss */}
            <div className={styles.mobileBackdrop} onClick={handleClosePanel} />
            <div className={styles.overlayRail}>
              <SidePanelWrapper
                key={selectedApplicationId}
                jobId={selectedJobId}
                onClose={handleClosePanel}
                alreadyApplied
                headerSupplement={
                  selectedResumeId ? (
                    <div className='items-start margin-top-small gap-small flex flex-col'>
                      <span className='text-heading-small'>
                        {tr('Label.SubmittedResume', 'Submitted resume')}
                      </span>
                      <Button
                        variant='Standard'
                        size='Medium'
                        onClick={handleDownloadSelectedResume}
                        isDisabled={isDownloadingResume}>
                        <span className='items-center gap-xsmall flex'>
                          <Icon name='icon-regular-arrow-down-to-line' size='Small' />
                          <span>{tr('Action.Download', 'Download')}</span>
                        </span>
                      </Button>
                      {resumeDownloadError ? (
                        <span className='content-alert text-body-small'>{resumeDownloadError}</span>
                      ) : null}
                    </div>
                  ) : null
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </>
  );
};

export const MyJobsContainer: React.FC = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { isInStudioContext } = useIsInStudioContext();
  const isStudioManageRoute = router.pathname.startsWith('/hire/my-studio');
  const showStudioJobsView = isInStudioContext || isStudioManageRoute;
  const { data: myStudiosData, isFetching: isStudiosFetching } = useMyStudios();
  const studioId = myStudiosData?.studios?.[0]?.id ?? undefined;

  const { data: jobsData, isFetching: isJobsFetching } = useJobs(getStudioJobsParams(studioId));
  const { applicants: studioApplicants, isInitialLoading: isInboxInitialLoading } =
    useStudioInbox(studioId);

  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

  const jobs = useMemo(() => jobsData?.jobs ?? [], [jobsData]);

  const filtered = useMemo(() => {
    if (statusFilter === 'open') {
      return jobs.filter((j) => j.status !== JobStatus.NUMBER_1);
    }
    if (statusFilter === 'closed') {
      return jobs.filter((j) => j.status === JobStatus.NUMBER_1);
    }
    return jobs;
  }, [jobs, statusFilter]);

  const applicationsCountByJobId = useMemo(() => {
    const counts = new Map<string, number>();
    studioApplicants.forEach(({ jobId }) => {
      if (!jobId) {
        return;
      }
      counts.set(jobId, (counts.get(jobId) ?? 0) + 1);
    });
    return counts;
  }, [studioApplicants]);

  const handleSelectJob = useCallback(
    (jobId: string) => {
      void router.push(buildTalentHubHref(`/hire/my-studio/jobs/${jobId}`, router.query));
    },
    [router],
  );

  const handlePostJob = useCallback(() => {
    void router.push(buildTalentHubHref('/hire/my-studio/post-job', router.query));
  }, [router]);

  const handleChipAll = useCallback((checked: boolean) => {
    if (checked) {
      setStatusFilter('all');
    }
  }, []);

  const handleChipOpen = useCallback((checked: boolean) => {
    if (checked) {
      setStatusFilter('open');
    }
  }, []);

  const handleChipClosed = useCallback((checked: boolean) => {
    if (checked) {
      setStatusFilter('closed');
    }
  }, []);

  const isInitialStudiosLoading = isStudiosFetching && !myStudiosData;
  const isInitialJobsLoading = Boolean(studioId) && isJobsFetching && !jobsData;
  const shouldShowInitialLoading =
    isInitialStudiosLoading || isInitialJobsLoading || (Boolean(studioId) && isInboxInitialLoading);

  useEffect(() => {
    if (!showStudioJobsView || shouldShowInitialLoading || studioId) {
      return;
    }
    router.replace(buildTalentHubHref('/hire/my-studio', router.query)).catch(() => {});
  }, [router, shouldShowInitialLoading, showStudioJobsView, studioId]);

  if (shouldShowInitialLoading) {
    return <LoadingState itemCount={4} />;
  }

  if (!showStudioJobsView) {
    return <AppliedJobsView />;
  }

  if (!studioId) {
    return <LoadingState itemCount={3} />;
  }

  if (jobs.length === 0) {
    return (
      <>
        <Head>
          <title>{translate('Text.MyJobsTitle')}</title>
        </Head>
        <PageContent testId='talent-hub-v2-my-jobs-empty'>
          <div className={styles.appliedEmptyState}>
            <NoApplicationsIllustration />
            <div className='text-align-center text-heading-medium'>
              {translate('Empty.NoJobsPostedYet')}
            </div>
            <div
              className={`text-align-center content-muted text-body-medium ${styles.appliedEmptyText}`}>
              {translate('Description.PostFirstJobListing')}
            </div>
            <Button variant='Emphasis' size='Medium' onClick={handlePostJob}>
              {translate('Action.PostAJob')}
            </Button>
          </div>
        </PageContent>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{translate('Text.MyJobsTitle')}</title>
      </Head>
      <PageContent testId='talent-hub-v2-my-jobs'>
        <div className={clsx(styles.pageHeader, 'min-width-0 width-full')}>
          <div className='min-width-0 gap-xxsmall flex flex-col'>
            <div className='text-heading-large'>{translate('Heading.MyJobs')}</div>
            <div className='content-muted text-body-medium'>
              {`${translate(jobs.length === 1 ? 'Text.JobCount' : 'Text.JobCountPlural', {
                count: String(jobs.length),
              })} posted`}
            </div>
          </div>
          <div className={styles.pageHeaderActions}>
            <Button variant='Emphasis' size='Medium' onClick={handlePostJob}>
              {translate('Action.PostAJob')}
            </Button>
          </div>
        </div>

        <div className='gap-xsmall flex'>
          <Chip
            text={translate('Tab.All')}
            isChecked={statusFilter === 'all'}
            onCheckedChange={handleChipAll}
          />
          <Chip
            text={translate('Tab.Open')}
            isChecked={statusFilter === 'open'}
            onCheckedChange={handleChipOpen}
          />
          <Chip
            text={translate('Tab.Closed')}
            isChecked={statusFilter === 'closed'}
            onCheckedChange={handleChipClosed}
          />
        </div>

        {filtered.length === 0 ? (
          <div className='content-muted text-body-medium padding-medium'>
            {`No ${statusFilter} jobs.`}
          </div>
        ) : (
          <div className={styles.myJobsCardList} data-testid='my-jobs-list'>
            {filtered
              .filter((rawJob): rawJob is Job & { id: string } => Boolean(rawJob.id))
              .map((rawJob) => (
                <JobRow
                  key={rawJob.id}
                  job={toJobViewModel(rawJob)}
                  raw={rawJob}
                  applicationsCount={applicationsCountByJobId.get(rawJob.id) ?? 0}
                  onSelect={handleSelectJob}
                />
              ))}
          </div>
        )}
      </PageContent>
    </>
  );
};

export default MyJobsContainer;
