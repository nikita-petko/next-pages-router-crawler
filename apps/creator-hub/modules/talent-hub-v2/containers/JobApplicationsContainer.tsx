import React, { useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { Badge, Button, Chip, Icon, Tabs, TabsList, TabsTrigger, clsx } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import usersClient from '@modules/clients/users';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { ApplicantDetailSheet } from '../components/inbox/ApplicantDetailSheet';
import { CloseJobDialog } from '../components/jobs/CloseJobDialog';
import { JobDetailPanel } from '../components/jobs/JobDetailPanel';
import PageContent from '../components/shared/PageContent';
import {
  toApplicantRowViewModel,
  useStudioApplicantViewModel,
} from '../hooks/useApplicantViewModel';
import {
  useListApplications,
  useGetApplication,
  useToggleFavorite,
} from '../hooks/useApplications';
import { useJob } from '../hooks/useJobs';
import { useJobViewModel } from '../hooks/useJobViewModel';
import { JobStatus } from '../types';
import type { ApplicantRowViewModel } from '../types';
import { isMocksEnabled } from '../utils';
import { ApplicantRow } from './JobApplicationsContainer.ApplicantRow';
import {
  applyApplicantUsernames,
  getApplicantUserIdsNeedingUsernameLookup,
  getAriaSort,
  getSubmittedAtTime,
  isMainTab,
  toUsernamesById,
  type SortColumn,
  type SortDir,
} from './JobApplicationsContainer.helpers';
import { SortIcon } from './JobApplicationsContainer.SortIcon';
import styles from '../components/shared/Layout.module.css';

export {
  applyApplicantUsernames,
  getApplicantUserIdsNeedingUsernameLookup,
  getSubmittedAtTime,
  toUsernamesById,
} from './JobApplicationsContainer.helpers';
export type { UserNameRecord } from './JobApplicationsContainer.helpers';

type FilterTab = 'all' | 'unread' | 'starred';
type SortState = 'default' | 'dateAsc' | 'starred';

type JobApplicationsContainerProps = {
  jobId: string;
};

export const JobApplicationsContainer: React.FC<JobApplicationsContainerProps> = ({ jobId }) => {
  const { translate } = useTranslation();
  const router = useRouter();
  const mocks = isMocksEnabled();
  const { data: job, isLoading: isJobLoading } = useJob(jobId);
  // Use `isLoading` (initial fetch only) instead of `isFetching` (any
  // in-flight request) so background refetches — e.g. when the close-job
  // dialog opens and re-subscribes to the same query, or when favorite-
  // toggle invalidations run — don't blank the page with the skeleton.
  const {
    data: applicationsData,
    isLoading: isApplicationsLoading,
    error,
    refetch,
  } = useListApplications({ jobId });
  const toggleFavorite = useToggleFavorite();

  const [mainTab, setMainTab] = useState<'applications' | 'details'>('applications');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [localViewedById, setLocalViewedById] = useState<Record<string, true>>({});
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [sortState, setSortState] = useState<SortState>('default');
  const [starredSortSnapshot, setStarredSortSnapshot] = useState<Record<string, boolean> | null>(
    null,
  );
  const jobViewModel = useJobViewModel(job);

  const allApplicants = useMemo<ApplicantRowViewModel[]>(
    () =>
      (applicationsData?.items ?? [])
        .filter((a) => !!a.id)
        .map(toApplicantRowViewModel)
        .map((applicant) =>
          mocks && localViewedById[applicant.id] ? { ...applicant, viewed: true } : applicant,
        ),
    [applicationsData, localViewedById, mocks],
  );
  const applicantUserIds = useMemo(
    () => getApplicantUserIdsNeedingUsernameLookup(allApplicants),
    [allApplicants],
  );
  const { data: usernamesById } = useQuery({
    queryKey: ['talent-hub-v2', 'applications', 'applicant-usernames', applicantUserIds],
    queryFn: async () => {
      const response = await usersClient.getUsersByIds(applicantUserIds);
      return toUsernamesById(response.data);
    },
    enabled: applicantUserIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  const applicantsWithUsernames = useMemo(
    () => applyApplicantUsernames(allApplicants, usernamesById),
    [allApplicants, usernamesById],
  );

  const filteredUnsorted = useMemo(() => {
    switch (activeTab) {
      case 'all':
        return applicantsWithUsernames;
      case 'unread':
        return applicantsWithUsernames.filter((a) => !a.viewed);
      case 'starred':
        return applicantsWithUsernames.filter((a) => a.favorite);
      default:
        return applicantsWithUsernames;
    }
  }, [activeTab, applicantsWithUsernames]);

  const filtered = useMemo(() => {
    const sorted = [...filteredUnsorted];
    if (sortState === 'starred') {
      const starredById = starredSortSnapshot ?? {};
      sorted.sort((a, b) => {
        const aFavorite = starredById[a.id] ?? a.favorite;
        const bFavorite = starredById[b.id] ?? b.favorite;
        if (aFavorite !== bFavorite) {
          return aFavorite ? -1 : 1;
        }
        const aTime = getSubmittedAtTime(a.submittedAt);
        const bTime = getSubmittedAtTime(b.submittedAt);
        return bTime - aTime;
      });
      return sorted;
    }

    if (sortState === 'dateAsc') {
      sorted.sort((a, b) => {
        const aTime = getSubmittedAtTime(a.submittedAt);
        const bTime = getSubmittedAtTime(b.submittedAt);
        return aTime - bTime;
      });
      return sorted;
    }

    sorted.sort((a, b) => {
      const aTime = getSubmittedAtTime(a.submittedAt);
      const bTime = getSubmittedAtTime(b.submittedAt);
      return bTime - aTime;
    });
    return sorted;
  }, [filteredUnsorted, sortState, starredSortSnapshot]);

  const sortColumn: SortColumn = sortState === 'starred' ? 'starred' : 'date';
  const sortDir: SortDir = sortState === 'dateAsc' ? 'asc' : 'desc';
  const selectedApplicantId =
    typeof router.query.applicationId === 'string' ? router.query.applicationId : null;

  const setSelectedApplicantId = useCallback(
    (id: string | null) => {
      const { applicationId: _, ...rest } = router.query;
      const query = id ? { ...rest, applicationId: id } : rest;
      router.replace({ query }, undefined, { shallow: true }).catch(() => {});
    },
    [router],
  );

  const handleDateSort = useCallback(() => {
    setStarredSortSnapshot(null);
    setSortState((prev) => (prev === 'dateAsc' ? 'default' : 'dateAsc'));
  }, []);

  const handleStarredSort = useCallback(() => {
    if (sortState === 'starred') {
      setStarredSortSnapshot(null);
      setSortState('default');
      return;
    }
    setStarredSortSnapshot(
      Object.fromEntries(
        applicantsWithUsernames.map((applicant) => [applicant.id, applicant.favorite]),
      ),
    );
    setSortState('starred');
  }, [applicantsWithUsernames, sortState]);

  const emptyApplicantsMessage = useMemo(() => {
    if (applicantsWithUsernames.length === 0) {
      return translate('Empty.NoApplicantsYet');
    }
    if (activeTab === 'unread') {
      return translate('Empty.NoUnreadApplicants');
    }
    if (activeTab === 'starred') {
      return translate('Empty.NoStarredApplicants');
    }
    return translate('Empty.NoApplicantsYet');
  }, [activeTab, applicantsWithUsernames.length, translate]);

  // For the detail sheet, we need the full Application (includes talentProfile
  // with all fields, not just the list-item subset).
  const { data: selectedApplicationDetail } = useGetApplication(selectedApplicantId ?? undefined);
  const selectedApplicantViewModel = useStudioApplicantViewModel(selectedApplicationDetail);

  const selectedIndex = useMemo(
    () => (selectedApplicantId ? filtered.findIndex((a) => a.id === selectedApplicantId) : -1),
    [filtered, selectedApplicantId],
  );
  const selectedApplicantRow =
    selectedIndex >= 0 && selectedIndex < filtered.length ? filtered[selectedIndex] : undefined;

  const handleToggleFavorite = useCallback(
    (id: string, favorite: boolean) => {
      toggleFavorite.mutate({ id, favorite });
    },
    [toggleFavorite],
  );

  const handleCloseDetail = useCallback(() => {
    setSelectedApplicantId(null);
  }, [setSelectedApplicantId]);

  const handleSelectApplicant = useCallback(
    (id: string) => {
      setSelectedApplicantId(id);
      if (mocks) {
        setLocalViewedById((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
      }
    },
    [mocks, setSelectedApplicantId],
  );

  const handleDetailInterested = useCallback(() => {
    if (selectedApplicantId) {
      handleToggleFavorite(selectedApplicantId, true);
    }
  }, [selectedApplicantId, handleToggleFavorite]);

  const handleDetailNotInterested = useCallback(() => {
    if (selectedApplicantId) {
      handleToggleFavorite(selectedApplicantId, false);
    }
  }, [selectedApplicantId, handleToggleFavorite]);

  const handlePrevious = useCallback(() => {
    const idx = selectedIndex - 1;
    if (idx >= 0) {
      setSelectedApplicantId(filtered[idx].id);
    }
  }, [filtered, selectedIndex, setSelectedApplicantId]);

  const handleNext = useCallback(() => {
    const idx = selectedIndex + 1;
    if (idx < filtered.length) {
      setSelectedApplicantId(filtered[idx].id);
    }
  }, [filtered, selectedIndex, setSelectedApplicantId]);

  const qaParams = useMemo(() => {
    const qs = new URLSearchParams();
    const { th2, th2m2, mocks: mocksQ, from, local } = router.query;
    if (from === 'profile') {
      qs.set('from', 'profile');
    }
    if (typeof th2 === 'string') {
      qs.set('th2', th2);
    }
    if (typeof th2m2 === 'string') {
      qs.set('th2m2', th2m2);
    }
    if (typeof mocksQ === 'string') {
      qs.set('mocks', mocksQ);
    }
    if (typeof local === 'string') {
      qs.set('local', local);
    }
    return qs.toString();
  }, [router.query]);

  const isFromProfile = router.query.from === 'profile';
  const backHref = isFromProfile
    ? `/hire/jobs/${jobId}${qaParams ? `?${qaParams}` : ''}`
    : `/hire/my-studio/jobs${qaParams ? `?${qaParams}` : ''}`;
  const editHref = `/hire/my-studio/jobs/${jobId}/edit${qaParams ? `?${qaParams}` : ''}`;
  const handleBack = useCallback(() => {
    void router.push(backHref);
  }, [router, backHref]);

  const handleOpenCloseDialog = useCallback(() => setShowCloseDialog(true), []);
  const handleCloseDialog = useCallback(() => setShowCloseDialog(false), []);
  const handleEditJob = useCallback(() => {
    void router.push(editHref);
  }, [router, editHref]);

  const handleMainTabChange = useCallback((value: string) => {
    if (isMainTab(value)) {
      setMainTab(value);
    }
  }, []);

  const handleRefetchApplications = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleChipAll = useCallback((checked: boolean) => {
    if (checked) {
      setActiveTab('all');
    }
  }, []);
  const handleChipUnread = useCallback((checked: boolean) => {
    if (checked) {
      setActiveTab('unread');
    }
  }, []);
  const handleChipStarred = useCallback((checked: boolean) => {
    if (checked) {
      setActiveTab('starred');
    }
  }, []);

  const isLoading = isJobLoading || isApplicationsLoading;
  const isJobClosed = job?.status === JobStatus.NUMBER_1;

  if (isLoading) {
    return <LoadingState itemCount={4} />;
  }

  if (error) {
    return (
      <ErrorState
        title={translate('Error.UnableToLoadApplications')}
        description={translate('Error.PleaseTryAgain')}
        actionLabel={translate('Action.TryAgain')}
        onAction={handleRefetchApplications}
      />
    );
  }

  return (
    <>
      <Head>
        <title>{`${job?.title ?? 'Job'} - Applications - Talent Hub`}</title>
      </Head>

      <div className={styles.overlayWrapper}>
        <PageContent
          testId='talent-hub-v2-job-applications'
          gap='medium'
          className={styles.jobApplicationsContent}>
          <div className='self-start margin-bottom-small'>
            <Button variant='Utility' size='Small' onClick={handleBack}>
              <span className='items-center gap-xxsmall flex'>
                <Icon name='icon-regular-chevron-small-left' size='Small' />
                <span>
                  {isFromProfile ? translate('Action.Back') : translate('Heading.MyJobs')}
                </span>
              </span>
            </Button>
          </div>

          <div className={styles.pageHeader}>
            <div className='flex-wrap items-center min-width-0 gap-small flex'>
              <h1 className='m-0 text-heading-large'>{job?.title ?? 'Job'}</h1>
              {isJobClosed ? <Badge label={translate('Tab.Closed')} variant='Neutral' /> : null}
            </div>
            <div className={styles.pageHeaderActions}>
              <Button variant='Standard' size='Medium' onClick={handleEditJob}>
                {translate('Action.EditJob')}
              </Button>
              {!isJobClosed ? (
                <Button variant='Standard' size='Medium' onClick={handleOpenCloseDialog}>
                  {translate('Action.CloseJob')}
                </Button>
              ) : null}
            </div>
          </div>

          <div className={styles.jobApplicationsTabs}>
            <Tabs
              value={mainTab}
              onValueChange={handleMainTabChange}
              size='Small'
              variant='Inlined'>
              <TabsList>
                <TabsTrigger value='applications'>
                  {`Applications (${allApplicants.length})`}
                </TabsTrigger>
                <TabsTrigger value='details'>{translate('Tab.Details')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {(() => {
            if (mainTab === 'applications') {
              return (
                <>
                  <div className='padding-y-xsmall gap-xxsmall flex'>
                    <Chip
                      text={translate('Tab.All')}
                      isChecked={activeTab === 'all'}
                      onCheckedChange={handleChipAll}
                    />
                    <Chip
                      text={translate('Tab.Unread')}
                      isChecked={activeTab === 'unread'}
                      onCheckedChange={handleChipUnread}
                    />
                    <Chip
                      text={translate('Tab.Starred')}
                      isChecked={activeTab === 'starred'}
                      onCheckedChange={handleChipStarred}
                    />
                  </div>

                  {filtered.length === 0 ? (
                    <div className='content-muted text-body-medium padding-medium'>
                      {emptyApplicantsMessage}
                    </div>
                  ) : (
                    <div className={clsx('overflow-hidden radius-medium', styles.borderedCard)}>
                      <table className={styles.applicantTable}>
                        <thead>
                          <tr className={styles.applicantTableHeaderRow}>
                            <th className='content-muted text-label-medium'>
                              {translate('Label.Name')}
                            </th>
                            <th className='content-muted text-label-medium'>
                              {translate('Label.Username')}
                            </th>
                            <th
                              className='content-muted text-label-medium'
                              aria-sort={getAriaSort('date', sortColumn, sortDir)}>
                              <button
                                type='button'
                                className={clsx(
                                  styles.buttonReset,
                                  'items-center gap-xxsmall flex',
                                )}
                                onClick={handleDateSort}>
                                {translate('Label.DateApplied')}
                                <SortIcon active={sortColumn === 'date'} direction={sortDir} />
                              </button>
                            </th>
                            <th
                              className={clsx(
                                'text-right content-muted text-label-medium',
                                styles.starCell,
                              )}
                              aria-sort={getAriaSort('starred', sortColumn, sortDir)}>
                              <button
                                type='button'
                                className={styles.buttonReset}
                                onClick={handleStarredSort}
                                aria-label='Sort by starred'>
                                <SortIcon active={sortColumn === 'starred'} direction={sortDir} />
                              </button>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((applicant) => (
                            <ApplicantRow
                              key={applicant.id}
                              applicant={applicant}
                              isSelected={applicant.id === selectedApplicantId}
                              onSelect={handleSelectApplicant}
                              onToggleFavorite={handleToggleFavorite}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              );
            }
            if (jobViewModel) {
              return (
                <JobDetailPanel
                  job={jobViewModel}
                  mode='page'
                  isOwner={false}
                  showApplyAction={false}
                  hideStudioHeader
                  hideTitleHeader
                  hideSectionDividers
                />
              );
            }
            return null;
          })()}
        </PageContent>

        {selectedApplicantViewModel ? (
          <>
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- backdrop dismiss */}
            <div className={styles.mobileBackdrop} onClick={handleCloseDetail} />
            <div className={styles.overlayRail}>
              <ApplicantDetailSheet
                applicant={selectedApplicantViewModel}
                applicantRow={selectedApplicantRow}
                onClose={handleCloseDetail}
                onInterested={handleDetailInterested}
                onNotInterested={handleDetailNotInterested}
                onPrevious={selectedIndex > 0 ? handlePrevious : undefined}
                onNext={selectedIndex < filtered.length - 1 ? handleNext : undefined}
              />
            </div>
          </>
        ) : null}
      </div>

      <CloseJobDialog open={showCloseDialog} jobId={jobId} onClose={handleCloseDialog} />
    </>
  );
};

export default JobApplicationsContainer;
