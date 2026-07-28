import React, { useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { logApplicationSubmit, logApplyClick } from '../analytics';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { ApplyDialog } from '../components/jobs/ApplyDialog';
import { JobDetailPanel } from '../components/jobs/JobDetailPanel';
import PageContent from '../components/shared/PageContent';
import useAgeVerification from '../hooks/useAgeVerification';
import { useHasAppliedToJob } from '../hooks/useApplications';
import { useSubmitApplication } from '../hooks/useInbox';
import { useJob } from '../hooks/useJobs';
import { useJobViewModel } from '../hooks/useJobViewModel';
import { useIsInStudioContext, useStudioPermissions } from '../hooks/useMyStudios';
import {
  useMyTalentProfile,
  useCreateTalentProfile,
  useUpdateTalentProfile,
} from '../hooks/useTalentProfile';
import type { ApiTalentProfileCreateRequest, ApiTalentProfileUpdateRequest } from '../types';
import type { ApplyDisabledBanner } from '../utils';

type JobDetailContainerProps = {
  jobId: string;
};

export const JobDetailContainer: React.FC<JobDetailContainerProps> = ({ jobId }) => {
  const { translate } = useTranslation();
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
  const { canManageJobs } = useStudioPermissions(job?.studioId);
  const isOwnerRoute = query.from === 'profile';
  const isOwner = isOwnerRoute || canManageJobs;
  const { data: myProfile, isFetching: isProfileFetching } = useMyTalentProfile();
  const createProfile = useCreateTalentProfile();
  const updateProfile = useUpdateTalentProfile(myProfile?.userId);
  const submitApplication = useSubmitApplication();
  const shouldCheckApplied = isAuthenticated && !isInStudioContext;
  const { data: hasAppliedServer = false, isFetching: isAppliedStateFetching } = useHasAppliedToJob(
    jobId,
    shouldCheckApplied,
  );

  const canSubmit = canApply && !isInStudioContext;
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showSubmittedSnackbar, setShowSubmittedSnackbar] = useState(false);

  const hasAppliedEffective = hasApplied || hasAppliedServer;

  const tr = useCallback(
    (key: string, fallback: string) => {
      const text = translate(key);
      if (!text?.trim()) {
        return fallback;
      }
      if (text === key) {
        return fallback;
      }
      if (text.startsWith('<') && text.endsWith('>')) {
        return fallback;
      }
      return text;
    },
    [translate],
  );

  let applyLabel = translate('Action.Apply');
  if (hasAppliedEffective) {
    applyLabel = translate('Label.Applied');
  } else if (!isAuthenticated) {
    applyLabel = translate('Action.LogInToApply');
  } else if (isAgeVerificationLoading) {
    applyLabel = translate('Status.CheckingAgeVerification');
  }

  const applyDisabledReason = useMemo(() => {
    let reason: string | undefined;
    if (hasAppliedEffective) {
      reason = tr('Tooltip.AlreadyApplied', 'You already applied to this job.');
    } else if (isInStudioContext) {
      reason = tr('Tooltip.SwitchToPersonalAccount', 'Switch to your personal account to apply.');
    } else if (isAgeVerificationRequired) {
      reason = tr('Tooltip.AgeVerificationRequired', 'Age verification is required to apply.');
    }
    return reason;
  }, [hasAppliedEffective, isInStudioContext, isAgeVerificationRequired, tr]);

  const applyDisabledBanner = useMemo<ApplyDisabledBanner | undefined>(() => {
    let banner: ApplyDisabledBanner | undefined;
    if (isOwner) {
      return banner;
    }
    if (hasAppliedEffective) {
      banner = {
        message: tr('Banner.AlreadyApplied', 'You already applied to this job.'),
        actionLabel: tr('Action.ViewApplications', 'View applications'),
        actionHref: '/hire/my-profile/applied',
      };
    } else if (isInStudioContext) {
      banner = {
        message: tr('Banner.SwitchToPersonalAccount', 'Switch to your personal account to apply.'),
        actionLabel: '',
        actionHref: '',
      };
    } else if (isAgeVerificationRequired) {
      banner = {
        message: tr('Banner.AgeVerificationRequired', 'Age verification is required to apply.'),
        actionLabel: tr('Action.VerifyAge', 'Verify age'),
        actionHref: 'https://www.roblox.com/my/account#!/info',
        external: true,
      };
    }
    return banner;
  }, [hasAppliedEffective, isAgeVerificationRequired, isInStudioContext, isOwner, tr]);

  const backLink = useMemo(() => {
    const from = typeof query.from === 'string' ? query.from : '';
    const studioId = typeof query.studioId === 'string' ? query.studioId : '';
    if (from === 'profile') {
      return { href: '/hire/my-studio', label: translate('Action.BackToStudioProfile') };
    }
    if (from === 'studio' && studioId) {
      return { href: `/hire/studios/${studioId}`, label: translate('Action.BackToStudioProfile') };
    }
    return { href: '/hire', label: translate('Action.BackToJobs') };
  }, [query.from, query.studioId, translate]);

  const qaParams = useMemo(() => {
    const qs = new URLSearchParams();
    if (typeof query.th2 === 'string') {
      qs.set('th2', query.th2);
    }
    if (typeof query.th2m2 === 'string') {
      qs.set('th2m2', query.th2m2);
    }
    if (typeof query.mocks === 'string') {
      qs.set('mocks', query.mocks);
    }
    if (typeof query.local === 'string') {
      qs.set('local', query.local);
    }
    return qs.toString();
  }, [query.local, query.mocks, query.th2, query.th2m2]);

  const handleEditPost = useCallback(() => {
    const qs = new URLSearchParams();
    if (isOwnerRoute) {
      qs.set('from', 'profile');
    }
    if (qaParams) {
      new URLSearchParams(qaParams).forEach((value, key) => {
        qs.set(key, value);
      });
    }
    const editParams = qs.toString();
    const href = `/hire/my-studio/jobs/${jobId}/edit${editParams ? `?${editParams}` : ''}`;
    void router.push(href);
  }, [isOwnerRoute, jobId, qaParams, router]);

  const handleGoToApplications = useCallback(() => {
    const qs = new URLSearchParams();
    if (isOwnerRoute) {
      qs.set('from', 'profile');
    }
    if (qaParams) {
      new URLSearchParams(qaParams).forEach((value, key) => {
        qs.set(key, value);
      });
    }
    const applicationsParams = qs.toString();
    const href = `/hire/my-studio/jobs/${jobId}${applicationsParams ? `?${applicationsParams}` : ''}`;
    void router.push(href);
  }, [isOwnerRoute, jobId, qaParams, router]);

  const studioProfileHref = useMemo(() => {
    const params = new URLSearchParams(qaParams);
    params.set('from', 'jobs');
    const queryString = params.toString();
    const base = job?.studioId ? `/hire/studios/${job.studioId}` : '/hire/studios';
    return `${base}${queryString ? `?${queryString}` : ''}`;
  }, [job?.studioId, qaParams]);

  // Matches the side-panel flow: always open the in-app ApplyDialog on click.
  // The old behavior (mailto:/external ATS) is superseded by the in-app flow
  // per the Figma spec for PR #13391.
  const handleApply = useCallback(() => {
    if (!job || !canApply || isProfileFetching) {
      return;
    }
    logApplyClick(job);
    setIsApplyOpen(true);
  }, [job, canApply, isProfileFetching]);

  const handleCloseDialog = useCallback(() => {
    setIsApplyOpen(false);
  }, []);

  const handleCreateProfile = useCallback(
    async (payload: ApiTalentProfileCreateRequest) => {
      return createProfile.mutateAsync(payload);
    },
    [createProfile],
  );

  const handleUpdateProfile = useCallback(
    async (payload: ApiTalentProfileUpdateRequest) => {
      return updateProfile.mutateAsync(payload);
    },
    [updateProfile],
  );

  const handleSubmitApplication = useCallback(
    async ({
      resumeId,
      includeSignals,
      profileId,
    }: {
      resumeId?: string;
      includeSignals: boolean;
      profileId?: string;
    }) => {
      await submitApplication.mutateAsync({
        jobId,
        resumeId: resumeId ?? null,
        consentToShareSignal: includeSignals,
      });
      logApplicationSubmit(jobId, profileId ?? '');
      setHasApplied(true);
      setShowSubmittedSnackbar(true);
    },
    [submitApplication, jobId],
  );

  if (isLoading) {
    return <LoadingState itemCount={3} />;
  }

  if (error || !job) {
    return (
      <ErrorState
        title={translate('Error.UnableToLoadJob')}
        description={translate('Error.PleaseTryAgain')}
        actionLabel={translate('Action.TryAgain')}
        onAction={() => {
          void refetch();
        }}
      />
    );
  }

  const studioName = job.studioName ?? translate('Label.Studio');
  const pageTitle = translate('Text.JobTitleWithStudio', { title: job.title, studio: studioName });
  const pageDescription = job.description ?? translate('Description.JobDetailsOnTalentHub');

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name='description' content={pageDescription} key='description' />
        <meta property='og:title' content={pageTitle} key='og:title' />
        <meta property='og:description' content={pageDescription} key='og:description' />
      </Head>
      <PageContent testId='talent-hub-v2-job-detail'>
        <JobDetailPanel
          job={job}
          mode='page'
          isOwner={isOwner}
          studioHref={studioProfileHref}
          onEditPost={isOwner ? handleEditPost : undefined}
          onGoToApplications={isOwner ? handleGoToApplications : undefined}
          onApply={handleApply}
          onBack={() => {
            void router.push(backLink.href);
          }}
          backLabel={backLink.label}
          applyLabel={applyLabel}
          isApplyDisabled={!canSubmit || hasAppliedEffective || isAppliedStateFetching}
          showApplyAction={!isOwner}
          applyDisabledTooltip={!isOwner ? applyDisabledReason : undefined}
          applyDisabledBanner={applyDisabledBanner}
        />
      </PageContent>
      {job && (
        <ApplyDialog
          open={isApplyOpen}
          job={job}
          profile={myProfile ?? null}
          isCreatingProfile={createProfile.isPending}
          isUpdatingProfile={updateProfile.isPending}
          isSubmitting={submitApplication.isPending}
          onClose={handleCloseDialog}
          onCreateProfile={handleCreateProfile}
          onUpdateProfile={handleUpdateProfile}
          onSubmitApplication={handleSubmitApplication}
        />
      )}
      {showSubmittedSnackbar ? (
        <Snackbar
          title='Application Submitted! The studio will contact you via email if they’re interested.'
          shouldAutoDismiss
          onClose={() => setShowSubmittedSnackbar(false)}
        />
      ) : null}
    </>
  );
};

export default JobDetailContainer;
