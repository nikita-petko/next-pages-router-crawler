/**
 * Apply-to-job flow. Three logical steps, with the first step branching on
 * whether the user already has a profile:
 *
 *   1a. `profile-preview` — user has a profile. Shows a read-only summary
 *       so they can confirm what the studio will see. "Next" moves on.
 *   1b. `create-profile` — user has no profile yet. Uses the shared
 *       `ProfileForm` so first-time applicants don't have to leave the
 *       dialog to go create a profile somewhere else.
 *   2.  `resume-stats` — pick a resume (or upload one), opt in/out of
 *       sharing studio-activity signals with the application.
 *   3.  `review` — final review + submit.
 *
 * NOTE on signals: the old UI rendered platform signals inline here. Rich
 * signals rendering is now owned by lhoward's #13385 (`<TalentSignal />`).
 * This dialog deliberately does NOT render signals — once #13385 merges, drop
 * `<TalentSignal onOptInChange={setIncludeSignals} />` into the resume-stats
 * step to restore the opt-in + preview flow.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, ProgressBar } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useAuthentication } from '@modules/authentication/providers';
import { resumeClient } from '../../api/resumeClient';
import { downloadMockResume, downloadResumeUrl } from '../../api/resumeDownload';
import { useDeleteResume, useResumes, useResumeUpload } from '../../hooks/useResumes';
import type {
  ApiResume,
  ApiTalentProfile,
  ApiTalentProfileCreateRequest,
  ApiTalentProfileUpdateRequest,
} from '../../types';
import { isMocksEnabled } from '../../utils';
import type { ProfileFormHandle } from '../profile/ProfileForm';
import { CreateProfileStepContent } from './ApplyDialog.CreateProfileStepContent';
import { EditProfileStepContent } from './ApplyDialog.EditProfileStepContent';
import { ApplyDialogFooters } from './ApplyDialog.Footers';
import { ProfilePreviewStepContent } from './ApplyDialog.ProfilePreviewStepContent';
import { ReviewStepContent } from './ApplyDialog.ReviewStepContent';
import type { ApplyDialogProps, Step } from './ApplyDialog.steps';
import { stepProgress } from './ApplyDialog.steps';
import { ResumeStatsStep } from './ResumeStatsStep';
import dialogStyles from '../shared/Layout.module.css';

export type { ApplyDialogProps } from './ApplyDialog.steps';

export const ApplyDialog: React.FC<ApplyDialogProps> = ({
  open,
  job,
  profile,
  isCreatingProfile,
  isUpdatingProfile,
  isSubmitting,
  onClose,
  onCreateProfile,
  onUpdateProfile,
  onSubmitApplication,
}) => {
  const { translate } = useTranslation();
  const tr = useCallback(
    (key: string, fallback: string) => {
      const value = translate(key);
      return value && value !== key ? value : fallback;
    },
    [translate],
  );
  const { user } = useAuthentication();
  const robloxUsername = user?.name ?? '';

  const initialStep: Step = profile ? 'profile-preview' : 'create-profile';
  const [step, setStep] = useState<Step>(initialStep);
  const [currentProfile, setCurrentProfile] = useState<ApiTalentProfile | null>(profile);
  const [error, setError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [includeSignals, setIncludeSignals] = useState(true);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>();
  const [deletedResumeIds, setDeletedResumeIds] = useState<Set<string>>(() => new Set());

  const profileFormRef = useRef<ProfileFormHandle>(null);
  const [profileFormValidity, setProfileFormValidity] = useState<{
    isValid: boolean;
    hasSubmitted: boolean;
  }>({ isValid: true, hasSubmitted: false });

  const { data: resumesData } = useResumes();
  const allResumes = useMemo(
    () =>
      (resumesData?.resumes ?? []).filter(
        (r) => r.status === 'active' && !deletedResumeIds.has(r.id),
      ),
    [deletedResumeIds, resumesData],
  );
  const resumeUpload = useResumeUpload();
  const deleteResume = useDeleteResume();
  const wasOpenRef = useRef(open);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setStep(profile ? 'profile-preview' : 'create-profile');
      setCurrentProfile(profile);
      setError(null);
      setProfileSaveSuccess(null);
      setResumeError(null);
      setIncludeSignals(true);
      setSelectedResumeId(undefined);
      setDeletedResumeIds(new Set());
      setProfileFormValidity({ isValid: true, hasSubmitted: false });
      resumeUpload.reset();
    }
    wasOpenRef.current = open;
  }, [open, profile, resumeUpload]);

  useEffect(() => {
    if (profile && step === 'create-profile') {
      setCurrentProfile(profile);
      setStep('profile-preview');
    }
  }, [profile, step]);

  useEffect(() => {
    if (selectedResumeId || allResumes.length === 0) {
      return;
    }
    const sorted = [...allResumes].toSorted((a, b) => {
      const aTs = a.confirmedAt ? new Date(a.confirmedAt).getTime() : 0;
      const bTs = b.confirmedAt ? new Date(b.confirmedAt).getTime() : 0;
      return bTs - aTs;
    });
    setSelectedResumeId(sorted[0]?.id);
  }, [allResumes, selectedResumeId]);

  const handleCreateProfile = useCallback(
    async (payload: ApiTalentProfileCreateRequest) => {
      setError(null);
      try {
        const created = await onCreateProfile(payload);
        setCurrentProfile(created);
        setStep('resume-stats');
      } catch {
        setError(tr('Error.FailedToCreateProfile', 'Failed to create profile. Please try again.'));
      }
    },
    [onCreateProfile, tr],
  );

  const handleUpdateProfile = useCallback(
    async (payload: ApiTalentProfileCreateRequest | ApiTalentProfileUpdateRequest) => {
      setError(null);
      setProfileSaveSuccess(null);
      try {
        const updated = await onUpdateProfile(payload);
        setCurrentProfile(updated);
        setProfileSaveSuccess(tr('Status.ProfileSaved', 'Profile saved'));
        setProfileFormValidity({ isValid: true, hasSubmitted: false });
        setStep('profile-preview');
      } catch {
        setError(tr('Error.FailedToUpdateProfile', 'Failed to update profile. Please try again.'));
      }
    },
    [onUpdateProfile, tr],
  );

  const handleResumeUpload = useCallback(
    async (file: File) => {
      setResumeError(null);
      const uploaded = await resumeUpload.upload(file);
      if (uploaded?.id) {
        setSelectedResumeId(uploaded.id);
      }
    },
    [resumeUpload],
  );

  const handleSelectResume = useCallback((id: string | undefined) => {
    setResumeError(null);
    setSelectedResumeId(id);
  }, []);

  const handleDownloadResume = useCallback(
    async (resume: ApiResume) => {
      setResumeError(null);
      try {
        if (isMocksEnabled()) {
          downloadMockResume(resume.fileName || 'resume');
          return;
        }
        const { downloadUrl } = await resumeClient.getDownloadUrl(resume.id);
        if (!downloadUrl) {
          throw new Error('Missing resume download URL');
        }
        await downloadResumeUrl(downloadUrl, resume.fileName || 'resume');
      } catch {
        setResumeError(
          tr('Error.FailedToDownloadResume', 'Unable to download resume. Please try again.'),
        );
      }
    },
    [tr],
  );

  const handleDeleteResume = useCallback(
    async (resume: ApiResume) => {
      setResumeError(null);
      setDeletedResumeIds((prev) => new Set(prev).add(resume.id));
      if (selectedResumeId === resume.id) {
        setSelectedResumeId(undefined);
      }
      try {
        await deleteResume.mutateAsync(resume.id);
      } catch {
        setDeletedResumeIds((prev) => {
          const next = new Set(prev);
          next.delete(resume.id);
          return next;
        });
        setResumeError(
          tr('Error.FailedToDeleteResume', 'Unable to delete resume. Please try again.'),
        );
      }
    },
    [deleteResume, selectedResumeId, tr],
  );

  const handleResumeBack = useCallback(() => {
    setStep(profile ? 'profile-preview' : 'create-profile');
  }, [profile]);

  const handleClose = useCallback(() => {
    setStep(profile ? 'profile-preview' : 'create-profile');
    setError(null);
    setResumeError(null);
    resumeUpload.reset();
    onClose();
  }, [onClose, profile, resumeUpload]);

  const handleSubmit = useCallback(async () => {
    if (!currentProfile) {
      return;
    }
    if (!selectedResumeId) {
      setResumeError(tr('Error.ResumeRequired', 'Upload or select a resume to continue.'));
      setStep('resume-stats');
      return;
    }
    setError(null);
    try {
      await onSubmitApplication({
        resumeId: selectedResumeId,
        includeSignals,
        profileId: currentProfile.userId !== undefined ? String(currentProfile.userId) : undefined,
      });
      handleClose();
    } catch {
      setError(tr('Error.FailedToSubmitApplication', 'Failed to submit application.'));
    }
  }, [currentProfile, onSubmitApplication, includeSignals, selectedResumeId, handleClose, tr]);

  const handleReviewResumeStats = useCallback(() => {
    if (!selectedResumeId) {
      setResumeError(tr('Error.ResumeRequired', 'Upload or select a resume to continue.'));
      return;
    }
    setResumeError(null);
    setStep('review');
  }, [selectedResumeId, tr]);

  const handleDialogOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        handleClose();
      }
    },
    [handleClose],
  );

  const handleProfileFormSubmit = useCallback(
    (payload: ApiTalentProfileCreateRequest | ApiTalentProfileUpdateRequest) => {
      if (step === 'edit-profile') {
        void handleUpdateProfile(payload);
        return;
      }
      void handleCreateProfile(payload);
    },
    [handleCreateProfile, handleUpdateProfile, step],
  );

  const progress = useMemo(() => stepProgress(step), [step]);

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogOpenChange}
      size='Large'
      isModal
      hasCloseAffordance
      closeLabel={tr('Action.Close', 'Close')}>
      <DialogContent>
        <div className={dialogStyles.applyDialogLayout}>
          <div className='items-center justify-between flex'>
            <div className='gap-xxsmall flex flex-col'>
              <DialogTitle className='text-title-medium margin-none'>
                {translate('Text.ApplyTo', { jobTitle: job.title })}
              </DialogTitle>
              <div className='content-muted text-body-small'>
                {translate('Text.AtStudio', {
                  studioName: job.studioName ?? tr('Label.Studio', 'Studio'),
                })}
              </div>
            </div>
          </div>

          <ProgressBar
            variant='Determinate'
            value={progress}
            ariaLabel={tr('Aria.ApplicationProgress', 'Application progress')}
          />

          <div className={dialogStyles.applyDialogScroll}>
            {step === 'create-profile' && (
              <CreateProfileStepContent
                job={job}
                error={error}
                profileSaveSuccess={profileSaveSuccess}
                profileFormRef={profileFormRef}
                isCreatingProfile={isCreatingProfile}
                onProfileSubmit={handleProfileFormSubmit}
                onValidityChange={setProfileFormValidity}
                tr={tr}
              />
            )}

            {step === 'profile-preview' && currentProfile && (
              <ProfilePreviewStepContent
                currentProfile={currentProfile}
                robloxUsername={robloxUsername}
                howStudioWillSeeYouText={translate('Text.HowStudioWillSeeYou', {
                  studioName: job.studioName ?? tr('Label.Studio', 'the studio'),
                })}
                tr={tr}
              />
            )}

            {step === 'edit-profile' && currentProfile && (
              <EditProfileStepContent
                currentProfile={currentProfile}
                error={error}
                profileFormRef={profileFormRef}
                isUpdatingProfile={isUpdatingProfile}
                onProfileSubmit={handleProfileFormSubmit}
                onValidityChange={setProfileFormValidity}
                tr={tr}
              />
            )}

            {step === 'resume-stats' && (
              <ResumeStatsStep
                resumes={allResumes}
                selectedResumeId={selectedResumeId}
                onSelectResume={handleSelectResume}
                isUploading={resumeUpload.isUploading}
                uploadError={resumeUpload.error}
                onUpload={handleResumeUpload}
                onDownloadResume={handleDownloadResume}
                onDeleteResume={handleDeleteResume}
                isDeletingResume={deleteResume.isPending}
                includeSignals={includeSignals}
                onChangeIncludeSignals={setIncludeSignals}
                resumeError={resumeError}
              />
            )}

            {step === 'review' && currentProfile && (
              <ReviewStepContent
                currentProfile={currentProfile}
                robloxUsername={robloxUsername}
                allResumes={allResumes}
                selectedResumeId={selectedResumeId}
                includeSignals={includeSignals}
                error={error}
                onGoToResumeStats={() => setStep('resume-stats')}
                tr={tr}
              />
            )}
          </div>

          <ApplyDialogFooters
            step={step}
            currentProfile={currentProfile}
            profileFormValidity={profileFormValidity}
            isCreatingProfile={isCreatingProfile}
            isUpdatingProfile={isUpdatingProfile}
            isUploadingResume={resumeUpload.isUploading}
            isSubmitting={isSubmitting}
            onCreateContinue={() => profileFormRef.current?.submit()}
            onProfilePreviewNext={() => setStep('resume-stats')}
            onProfilePreviewEdit={() => setStep('edit-profile')}
            onEditSave={() => profileFormRef.current?.submit()}
            onEditCancel={() => {
              setProfileSaveSuccess(null);
              setStep('profile-preview');
            }}
            onResumeNext={handleReviewResumeStats}
            onResumeBack={handleResumeBack}
            onReviewSubmit={handleSubmit}
            onReviewBack={() => setStep('resume-stats')}
            tr={tr}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApplyDialog;
