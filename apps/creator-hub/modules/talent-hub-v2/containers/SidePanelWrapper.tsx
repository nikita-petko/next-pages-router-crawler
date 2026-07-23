import React, { useCallback } from 'react';
import { useAuthentication } from '@modules/authentication/providers';
import JobDetailPanel from '../components/jobs/JobDetailPanel';
import { useJob } from '../hooks/useJobs';
import { useJobViewModel } from '../hooks/useJobViewModel';
import { useIsInStudioContext } from '../hooks/useMyStudios';
import useAgeVerification from '../hooks/useAgeVerification';
import { logApplyClick } from '../analytics';
import { resolveApplyTarget, getApplyDisabledTooltip } from '../utils';

const SidePanelWrapper: React.FC<{
  jobId: string;
  onClose: () => void;
}> = ({ jobId, onClose }) => {
  const { user } = useAuthentication();
  const isAuthenticated = Boolean(user);
  const { isVerified, isLoading: isAgeVerificationLoading } = useAgeVerification(isAuthenticated);
  const isAgeVerificationRequired = isAuthenticated && !isAgeVerificationLoading && !isVerified;
  const canApply = isAuthenticated && isVerified;

  const { data } = useJob(jobId);
  const job = useJobViewModel(data);
  const { isInStudioContext } = useIsInStudioContext();

  const canSubmit = canApply && !isInStudioContext;

  let applyLabel = 'Apply';
  if (!isAuthenticated) {
    applyLabel = 'Log in to apply';
  } else if (isAgeVerificationLoading) {
    applyLabel = 'Checking age verification...';
  }

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
  }, [job, data, canApply]);

  if (!job) return null;

  return (
    <JobDetailPanel
      job={job}
      mode='drawer'
      onClose={onClose}
      onApply={handleApply}
      applyLabel={applyLabel}
      isApplyDisabled={!canSubmit}
      showApplyAction
      applyDisabledTooltip={getApplyDisabledTooltip(isInStudioContext, isAgeVerificationRequired)}
    />
  );
};

export default SidePanelWrapper;
