import React, { useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuthentication } from '@modules/authentication/providers';
import { JobDetailPanel } from '../components/jobs/JobDetailPanel';
import { useJob } from '../hooks/useJobs';
import { useJobViewModel } from '../hooks/useJobViewModel';
import { useIsInStudioContext } from '../hooks/useMyStudios';
import ErrorState from '../components/feedback/ErrorState';
import LoadingState from '../components/feedback/LoadingState';
import PageContent from '../components/shared/PageContent';
import { logApplyClick } from '../analytics';
import useAgeVerification from '../hooks/useAgeVerification';
import { resolveApplyTarget, getApplyDisabledTooltip } from '../utils';

type JobDetailContainerProps = {
  jobId: string;
};

export const JobDetailContainer: React.FC<JobDetailContainerProps> = ({ jobId }) => {
  const router = useRouter();
  const { query } = router;
  const { user } = useAuthentication();
  const isAuthenticated = Boolean(user);
  const { isVerified, isLoading: isAgeVerificationLoading } = useAgeVerification(isAuthenticated);
  const canApply = isAuthenticated && isVerified;
  const isAgeVerificationRequired = isAuthenticated && !isAgeVerificationLoading && !isVerified;
  const { data, isLoading, error, refetch } = useJob(jobId);
  const job = useJobViewModel(data);
  const { isInStudioContext } = useIsInStudioContext();
  const canSubmit = canApply && !isInStudioContext;
  let applyLabel = 'Apply';
  if (!isAuthenticated) {
    applyLabel = 'Log in to apply';
  } else if (isAgeVerificationLoading) {
    applyLabel = 'Checking age verification...';
  }

  const backLink = useMemo(() => {
    const from = typeof query.from === 'string' ? query.from : '';
    const studioId = typeof query.studioId === 'string' ? query.studioId : '';
    if (from === 'profile') {
      return { href: '/hire/profile', label: 'Back to profile' };
    }
    if (from === 'studio' && studioId) {
      return { href: `/hire/studios/${studioId}`, label: 'Back to studio profile' };
    }
    return { href: '/hire', label: 'Back to jobs' };
  }, [query.from, query.studioId]);

  const handleApply = useCallback(() => {
    if (!job || !data || !canApply) return;
    logApplyClick(job);
    const studioUrl = data.studio?.atsLink ?? data.studio?.website ?? null;
    const target = resolveApplyTarget(job.applyMethod, data.studio?.email ?? null, studioUrl);
    if (target.kind === 'email') {
      window.location.href = target.href;
      return;
    }
    if (target.kind === 'url') {
      window.open(target.href, '_blank', 'noopener,noreferrer');
    }
  }, [canApply, job, data]);

  if (isLoading) return <LoadingState itemCount={3} />;

  if (error || !job) {
    return (
      <ErrorState
        title='Unable to load job'
        description='Please try again in a moment.'
        actionLabel='Try again'
        onAction={() => refetch()}
      />
    );
  }

  return (
    <React.Fragment>
      <Head>
        <title>{`${job.title} - ${job.studioName ?? 'Studio'}`}</title>
        <meta
          name='description'
          content={job.description ?? 'Job details on Talent Hub.'}
          key='description'
        />
        <meta
          property='og:title'
          content={`${job.title} - ${job.studioName ?? 'Studio'}`}
          key='og:title'
        />
        <meta
          property='og:description'
          content={job.description ?? 'Job details on Talent Hub.'}
          key='og:description'
        />
      </Head>
      <PageContent testId='talent-hub-v2-job-detail'>
        <JobDetailPanel
          job={job}
          mode='page'
          onApply={handleApply}
          onBack={() => router.push(backLink.href)}
          backLabel={backLink.label}
          applyLabel={applyLabel}
          isApplyDisabled={!canSubmit}
          showApplyAction
          applyDisabledTooltip={getApplyDisabledTooltip(
            isInStudioContext,
            isAgeVerificationRequired,
          )}
        />
      </PageContent>
    </React.Fragment>
  );
};

export default JobDetailContainer;
