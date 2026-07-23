import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Snackbar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { logApplicationSubmit, logApplyClick } from '../analytics';
import { ErrorState } from '../components/feedback/ErrorState';
import { LoadingState } from '../components/feedback/LoadingState';
import { ApplyDialog } from '../components/jobs/ApplyDialog';
import { JobDetailPanel } from '../components/jobs/JobDetailPanel';
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

const SidePanelWrapper: React.FC<{
  jobId: string;
  onClose: () => void;
  alreadyApplied?: boolean;
  headerSupplement?: React.ReactNode;
}> = ({ jobId, onClose, alreadyApplied = false, headerSupplement }) => {
  const { translate } = useTranslation();
  const { user } = useAuthentication();
  const isAuthenticated = Boolean(user);
  const { isVerified, isLoading: isAgeVerificationLoading } = useAgeVerification(isAuthenticated);
  const isAgeVerificationRequired = isAuthenticated && !isAgeVerificationLoading && !isVerified;
  const canApply = isAuthenticated && isVerified;

  const router = useRouter();
  const { data, isLoading, isError, refetch } = useJob(jobId);
  const job = useJobViewModel(data);
  const { isInStudioContext } = useIsInStudioContext();
  const { canManageJobs } = useStudioPermissions(job?.studioId);
  const isOwner = isInStudioContext && canManageJobs && !alreadyApplied;
  const { data: myProfile, isFetching: isProfileFetching } = useMyTalentProfile();
  const createProfile = useCreateTalentProfile();
  const updateProfile = useUpdateTalentProfile(myProfile?.userId);
  const submitApplication = useSubmitApplication();
  const shouldCheckApplied = isAuthenticated && !isInStudioContext && !alreadyApplied;
  const { data: hasAppliedServer = false, isFetching: isAppliedStateFetching } = useHasAppliedToJob(
    jobId,
    shouldCheckApplied,
  );

  const canSubmit = canApply && !isInStudioContext;
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(alreadyApplied);
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
    const hasAppliedReason = !alreadyApplied && hasAppliedEffective;
    let reason: string | undefined;
    if (hasAppliedReason) {
      reason = tr('Tooltip.AlreadyApplied', 'You already applied to this job.');
    } else if (isInStudioContext) {
      reason = tr('Tooltip.SwitchToPersonalAccount', 'Switch to your personal account to apply.');
    } else if (isAgeVerificationRequired) {
      reason = tr('Tooltip.AgeVerificationRequired', 'Age verification is required to apply.');
    }
    return reason;
  }, [alreadyApplied, hasAppliedEffective, isInStudioContext, isAgeVerificationRequired, tr]);

  const applyDisabledBanner = useMemo<ApplyDisabledBanner | undefined>(() => {
    let banner: ApplyDisabledBanner | undefined;
    if (isOwner) {
      return banner;
    }
    if (hasAppliedEffective && !alreadyApplied) {
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
  }, [
    alreadyApplied,
    hasAppliedEffective,
    isAgeVerificationRequired,
    isInStudioContext,
    isOwner,
    tr,
  ]);

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

  const editHref = useMemo(() => (job ? `/hire/my-studio/jobs/${job.id}/edit` : ''), [job]);
  const handleEditPost = useCallback(() => {
    if (editHref) {
      void router.push(editHref);
    }
  }, [editHref, router]);

  const studioProfileHref = useMemo(() => {
    const base = job?.studioId ? `/hire/studios/${job.studioId}` : '/hire/studios';
    const params = new URLSearchParams();
    params.set('from', 'jobs');
    ['th2', 'th2m2', 'mocks', 'local'].forEach((key) => {
      const value = router.query[key];
      if (typeof value === 'string') {
        params.set(key, value);
      }
    });
    return `${base}?${params.toString()}`;
  }, [job?.studioId, router.query]);

  if (isLoading) {
    return <LoadingState itemCount={2} />;
  }

  if (isError || !job) {
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

  return (
    <>
      <JobDetailPanel
        job={job}
        mode='drawer'
        onClose={onClose}
        isOwner={isOwner}
        studioHref={studioProfileHref}
        onEditPost={isOwner ? handleEditPost : undefined}
        onApply={handleApply}
        applyLabel={applyLabel}
        isApplyDisabled={!canSubmit || hasAppliedEffective || isAppliedStateFetching}
        showApplyAction={!isOwner}
        applyDisabledTooltip={!isOwner ? applyDisabledReason : undefined}
        applyDisabledBanner={applyDisabledBanner}
        hideSectionDividers
        headerSupplement={headerSupplement}
      />
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

export default SidePanelWrapper;
