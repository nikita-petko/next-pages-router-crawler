import React from 'react';
import { FeedbackBanner } from '@rbx/foundation-ui';
import type {
  ApiTalentProfileCreateRequest,
  ApiTalentProfileUpdateRequest,
  JobViewModel,
} from '../../types';
import { ProfileForm, type ProfileFormHandle } from '../profile/ProfileForm';

type Tr = (key: string, fallback: string) => string;

export type CreateProfileStepContentProps = {
  job: JobViewModel;
  error: string | null;
  profileSaveSuccess: string | null;
  profileFormRef: React.RefObject<ProfileFormHandle | null>;
  isCreatingProfile: boolean;
  onProfileSubmit: (payload: ApiTalentProfileCreateRequest | ApiTalentProfileUpdateRequest) => void;
  onValidityChange: (state: { isValid: boolean; hasSubmitted: boolean }) => void;
  tr: Tr;
};

export const CreateProfileStepContent: React.FC<CreateProfileStepContentProps> = ({
  job,
  error,
  profileSaveSuccess,
  profileFormRef,
  isCreatingProfile,
  onProfileSubmit,
  onValidityChange,
  tr,
}) => (
  <>
    <div className='text-title-large'>{tr('Heading.ProfileInformation', 'Your information')}</div>
    <div className='content-muted text-body-medium'>
      <span>
        {tr('Text.CreateProfileBeforeApplyingPrefix', 'Create a profile before applying to')}{' '}
      </span>
      <strong>{job.title}</strong>
    </div>
    {error ? (
      <FeedbackBanner
        title=''
        description={error}
        layout='Inline'
        variant='Standard'
        severity='Error'
      />
    ) : null}
    {profileSaveSuccess ? (
      <FeedbackBanner
        title=''
        description={profileSaveSuccess}
        layout='Inline'
        variant='Standard'
        severity='Success'
      />
    ) : null}
    <ProfileForm
      ref={profileFormRef}
      mode='create'
      isSaving={isCreatingProfile}
      onSubmit={onProfileSubmit}
      hideActions
      onValidityChange={onValidityChange}
    />
  </>
);
