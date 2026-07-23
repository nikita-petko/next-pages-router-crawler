import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { Badge, Button, Icon, clsx } from '@rbx/foundation-ui';
import PageContent from '../components/shared/PageContent';
import ErrorState from '../components/feedback/ErrorState';
import LoadingState from '../components/feedback/LoadingState';
import { useStudioInbox } from '../hooks/useInbox';
import { logInboxPageView } from '../analytics';
import { API_APPLICATION_STATUS_LABELS } from '../constants';
import { formatRelativeTime, getEnumLabel } from '../utils';
import type { ApiStudioApplicant, StudioApplicantViewModel } from '../types';
import styles from '../components/shared/Layout.module.css';

function toViewModel(a: ApiStudioApplicant): StudioApplicantViewModel {
  const loc = a.talentProfile.location;
  return {
    ...a,
    statusLabel: getEnumLabel(API_APPLICATION_STATUS_LABELS, a.status, 'Applied'),
    locationLabel: loc ? [loc.city, loc.country].filter(Boolean).join(', ') : '',
  };
}

/* ------------------------------------------------------------------ */
/*  Per-applicant card                                                 */
/* ------------------------------------------------------------------ */

const ApplicantCard: React.FC<{ applicant: StudioApplicantViewModel }> = ({ applicant }) => {
  const [interested, setInterested] = useState(applicant.interested ?? false);
  const [dismissed, setDismissed] = useState(false);
  const tp = applicant.talentProfile;

  if (dismissed) return null;

  return (
    <div
      className={clsx(
        'flex flex-col gap-small padding-small small:padding-medium',
        styles.applicantCard,
      )}>
      <div className='flex items-start justify-between gap-small'>
        <div className='flex flex-col gap-xxsmall min-width-0'>
          <div className='text-title-small'>{tp.fullName}</div>
          <div className='text-body-small content-muted'>@{tp.robloxUsername}</div>
          {applicant.locationLabel ? (
            <div className='text-body-small content-muted'>{applicant.locationLabel}</div>
          ) : null}
        </div>
        <div className={clsx('flex flex-col items-end gap-xxsmall', styles.applicantMeta)}>
          <Badge label={applicant.statusLabel} variant='Neutral' />
          <div className='text-label-small content-muted text-no-wrap'>
            {formatRelativeTime(applicant.submittedAt)}
          </div>
        </div>
      </div>

      {tp.aboutMe ? <div className='text-body-small content-default'>{tp.aboutMe}</div> : null}

      {tp.creationLinks && tp.creationLinks.length > 0 ? (
        <div className='flex flex-wrap gap-xsmall'>
          {tp.creationLinks.map((link) => (
            <a
              key={link}
              href={link}
              target='_blank'
              rel='noreferrer'
              className={clsx('text-body-small content-link', styles.wordBreakAll)}>
              {link}
            </a>
          ))}
        </div>
      ) : null}

      {interested ? (
        <div className='flex items-center gap-xsmall bg-shift-200 radius-medium padding-xsmall small:padding-small'>
          <Icon name='icon-regular-check' size='XSmall' />
          <span className='text-body-small content-emphasis'>Contact: {tp.contactEmail}</span>
        </div>
      ) : (
        <div className='flex gap-small'>
          <Button variant='Standard' size='Small' onClick={() => setInterested(true)}>
            Interested
          </Button>
          <Button variant='Standard' size='Small' onClick={() => setDismissed(true)}>
            Not interested
          </Button>
        </div>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Container                                                         */
/* ------------------------------------------------------------------ */

export const TalentInboxV2Container: React.FC = () => {
  const { data, isLoading, error, refetch } = useStudioInbox();

  useEffect(() => {
    logInboxPageView();
  }, []);

  const applicants = useMemo(() => (data?.applicants ?? []).map(toViewModel), [data]);

  const grouped = useMemo(() => {
    const map = new Map<string, { jobTitle: string; items: StudioApplicantViewModel[] }>();
    applicants.forEach((a) => {
      const existing = map.get(a.jobId);
      if (existing) {
        existing.items.push(a);
      } else {
        map.set(a.jobId, { jobTitle: a.jobTitle, items: [a] });
      }
    });
    return Array.from(map.values());
  }, [applicants]);

  if (isLoading) {
    return <LoadingState itemCount={4} />;
  }

  if (error) {
    return (
      <ErrorState
        title='Unable to load inbox'
        description='Please try again in a moment.'
        actionLabel='Try again'
        onAction={() => refetch()}
      />
    );
  }

  return (
    <React.Fragment>
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
        <div className='flex flex-col gap-xsmall'>
          <div className='text-title-large'>Applicant inbox</div>
          <div className='text-body-medium content-muted'>
            Review applicants for your open positions.
          </div>
        </div>

        {grouped.length === 0 ? (
          <div className='text-body-medium content-muted'>No applicants yet.</div>
        ) : (
          grouped.map((group) => (
            <div key={group.jobTitle} className='flex flex-col gap-xsmall'>
              <div className='text-title-small'>{group.jobTitle}</div>
              <div className={clsx('flex flex-col radius-large', styles.applicantGroup)}>
                {group.items.map((applicant) => (
                  <ApplicantCard key={applicant.id} applicant={applicant} />
                ))}
              </div>
            </div>
          ))
        )}
      </PageContent>
    </React.Fragment>
  );
};

export default TalentInboxV2Container;
