import Head from 'next/head';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge, Button, Chip, Icon, clsx } from '@rbx/foundation-ui';
import { logInboxPageView } from '../analytics';
import { LoadingState } from '../components/feedback/LoadingState';
import ApplicantDetailSheet from '../components/inbox/ApplicantDetailSheet';
import PageContent from '../components/shared/PageContent';
import { useStudioApplicantViewModel } from '../hooks/useApplicantViewModel';
import { useGetApplication } from '../hooks/useApplications';
import { useStudioInbox, useToggleApplicantFavorite } from '../hooks/useInbox';
import type { StudioInboxItem } from '../hooks/useInbox';
import { useMyStudios } from '../hooks/useMyStudios';
import { formatRelativeTime } from '../utils';
import styles from '../components/shared/Layout.module.css';

type FilterTab = 'all' | 'starred' | 'unreviewed';

type ApplicantCardProps = {
  item: StudioInboxItem;
  isSelected?: boolean;
  onToggleFavorite: (applicationId: string, favorite: boolean) => void;
  onSelect: (applicationId: string) => void;
};

/**
 * Row in the studio inbox list.
 *
 * The studio inbox is backed by `ApplicationListItem` rows (not full
 * `Application`s), so what's on screen is intentionally minimal: talent name,
 * submitted date, starred toggle. Rich applicant data (bio, location,
 * signals) renders in the detail sheet only, after an extra
 * `GET /api/Applications/{id}` fetch.
 */
const ApplicantCard: React.FC<ApplicantCardProps> = ({
  item,
  isSelected,
  onToggleFavorite,
  onSelect,
}) => {
  const applicationId = item.id ?? '';
  const submittedAt = item.createdAt;

  const handleSelect = useCallback(() => {
    onSelect(applicationId);
  }, [applicationId, onSelect]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        onSelect(applicationId);
      }
    },
    [applicationId, onSelect],
  );

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleFavorite(applicationId, !item.favorite);
    },
    [applicationId, item.favorite, onToggleFavorite],
  );

  return (
    <div
      role='button'
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      className={clsx(
        'cursor-pointer padding-small gap-small flex flex-col small:padding-medium',
        styles.applicantCard,
        isSelected && 'bg-shift-100',
      )}>
      <div className='items-start justify-between gap-small flex'>
        <div className='min-width-0 gap-xxsmall flex flex-col'>
          <div className='text-title-small'>{item.talentName || '—'}</div>
          {item.talentUserId !== undefined ? (
            <div className='content-muted text-body-small'>User ID {item.talentUserId}</div>
          ) : null}
        </div>
        <div className={clsx('items-end gap-xxsmall flex flex-col', styles.applicantMeta)}>
          {item.favorite ? <Badge label='Starred' variant='Success' /> : null}
          {submittedAt ? (
            <div className='content-muted text-label-small text-no-wrap'>
              {formatRelativeTime(submittedAt)}
            </div>
          ) : null}
        </div>
      </div>

      <div className='gap-small flex'>
        <Button
          variant={item.favorite ? 'Emphasis' : 'Standard'}
          size='Small'
          onClick={handleFavorite}>
          <Icon name={item.favorite ? 'icon-filled-star' : 'icon-regular-star'} size='XSmall' />
          <span>{item.favorite ? 'Starred' : 'Star'}</span>
        </Button>
      </div>
    </div>
  );
};

export const TalentInboxV2Container: React.FC = () => {
  const { data: myStudiosData, isFetching: isStudiosFetching } = useMyStudios();
  const studioId = myStudiosData?.studios?.[0]?.id ?? undefined;
  const { applicants, isFetching: isInboxFetching } = useStudioInbox(studioId);
  const toggleFavorite = useToggleApplicantFavorite();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  useEffect(() => {
    logInboxPageView();
  }, []);

  const filtered = useMemo(() => {
    switch (activeTab) {
      case 'starred':
        return applicants.filter((a) => a.favorite);
      case 'unreviewed':
        return applicants.filter((a) => !a.viewed);
      default:
        return applicants;
    }
  }, [applicants, activeTab]);

  /**
   * Group by jobTitle (we don't have a reliable jobId on list items unless we
   * trust the synthetic jobId stamped from the per-job fetch, which we do).
   */
  const grouped = useMemo(() => {
    const map = new Map<string, { jobTitle: string; items: StudioInboxItem[] }>();
    filtered.forEach((a) => {
      const key = a.jobId;
      const title = a.jobTitle ?? 'Untitled job';
      const existing = map.get(key);
      if (existing) {
        existing.items.push(a);
      } else {
        map.set(key, { jobTitle: title, items: [a] });
      }
    });
    return Array.from(map.values());
  }, [filtered]);

  const emptyApplicantsMessage = useMemo(() => {
    if (applicants.length === 0) {
      return 'No applicants yet.';
    }
    if (activeTab === 'unreviewed') {
      return 'No unread applicants.';
    }
    if (activeTab === 'starred') {
      return 'No starred applicants.';
    }
    return 'No applicants yet.';
  }, [activeTab, applicants.length]);

  const { data: selectedApplicationDetail } = useGetApplication(selectedApplicationId ?? undefined);
  const selectedApplicantViewModel = useStudioApplicantViewModel(selectedApplicationDetail);

  const flatApplicants = useMemo(() => filtered, [filtered]);
  const selectedIndex = useMemo(
    () =>
      selectedApplicationId ? flatApplicants.findIndex((a) => a.id === selectedApplicationId) : -1,
    [flatApplicants, selectedApplicationId],
  );

  const handleToggleFavorite = useCallback(
    (applicationId: string, favorite: boolean) => {
      toggleFavorite.mutate({ applicationId, favorite });
    },
    [toggleFavorite],
  );

  const handleNavigate = useCallback(
    (direction: 'prev' | 'next') => {
      const idx = direction === 'prev' ? selectedIndex - 1 : selectedIndex + 1;
      if (idx >= 0 && idx < flatApplicants.length) {
        const nextId = flatApplicants[idx].id ?? null;
        setSelectedApplicationId(nextId);
      }
    },
    [flatApplicants, selectedIndex],
  );

  const handleCloseDetail = useCallback(() => setSelectedApplicationId(null), []);
  const handleDetailInterested = useCallback(() => {
    if (selectedApplicationId) {
      handleToggleFavorite(selectedApplicationId, true);
    }
  }, [selectedApplicationId, handleToggleFavorite]);
  const handleDetailNotInterested = useCallback(() => {
    if (selectedApplicationId) {
      handleToggleFavorite(selectedApplicationId, false);
    }
  }, [selectedApplicationId, handleToggleFavorite]);
  const handlePrevious = useCallback(() => handleNavigate('prev'), [handleNavigate]);
  const handleNext = useCallback(() => handleNavigate('next'), [handleNavigate]);

  const handleTabAll = useCallback((checked: boolean) => {
    if (checked) {
      setActiveTab('all');
    }
  }, []);
  const handleTabStarred = useCallback((checked: boolean) => {
    if (checked) {
      setActiveTab('starred');
    }
  }, []);
  const handleTabUnreviewed = useCallback((checked: boolean) => {
    if (checked) {
      setActiveTab('unreviewed');
    }
  }, []);

  if (isStudiosFetching || isInboxFetching) {
    return <LoadingState itemCount={4} />;
  }

  return (
    <>
      <Head>
        <title>Studio Inbox - Talent Hub</title>
        <meta
          name='description'
          content='Review applicants for your studio jobs.'
          key='description'
        />
        <meta property='og:title' content='Studio Inbox - Talent Hub' key='og:title' />
        <meta
          property='og:description'
          content='Review applicants for your studio jobs.'
          key='og:description'
        />
      </Head>
      <PageContent testId='talent-hub-v2-inbox'>
        <div className='gap-xsmall flex flex-col'>
          <div className='text-title-large'>Applicant inbox</div>
          <div className='content-muted text-body-medium'>
            Review applicants for your open positions.
          </div>
        </div>

        <div className='gap-xsmall flex'>
          <Chip text='All' isChecked={activeTab === 'all'} onCheckedChange={handleTabAll} />
          <Chip
            text='Starred'
            isChecked={activeTab === 'starred'}
            onCheckedChange={handleTabStarred}
          />
          <Chip
            text='Unreviewed'
            isChecked={activeTab === 'unreviewed'}
            onCheckedChange={handleTabUnreviewed}
          />
        </div>

        <div className={styles.overlayWrapper}>
          <div>
            {grouped.length === 0 ? (
              <div className='content-muted text-body-medium'>{emptyApplicantsMessage}</div>
            ) : (
              grouped.map((group) => (
                <div key={group.jobTitle} className='gap-xsmall flex flex-col'>
                  <div className='text-title-small'>{group.jobTitle}</div>
                  <div className={clsx('radius-large flex flex-col', styles.applicantGroup)}>
                    {group.items.map((applicant) => (
                      <ApplicantCard
                        key={applicant.id}
                        item={applicant}
                        isSelected={applicant.id === selectedApplicationId}
                        onToggleFavorite={handleToggleFavorite}
                        onSelect={setSelectedApplicationId}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          {selectedApplicantViewModel ? (
            <React.Fragment>
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- mobile backdrop tap-to-dismiss */}
              <div className={styles.mobileBackdrop} onClick={handleCloseDetail} />
              <div className={styles.overlayRail}>
                <ApplicantDetailSheet
                  applicant={selectedApplicantViewModel}
                  onClose={handleCloseDetail}
                  onInterested={handleDetailInterested}
                  onNotInterested={handleDetailNotInterested}
                  onPrevious={selectedIndex > 0 ? handlePrevious : undefined}
                  onNext={selectedIndex < flatApplicants.length - 1 ? handleNext : undefined}
                />
              </div>
            </React.Fragment>
          ) : null}
        </div>
      </PageContent>
    </>
  );
};

export default TalentInboxV2Container;
