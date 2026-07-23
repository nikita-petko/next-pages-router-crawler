import React from 'react';
import { FeedbackBanner } from '@rbx/foundation-ui';
import type {
  ApiTalentProfile,
  ApiTalentProfileCreateRequest,
  ApiTalentProfileUpdateRequest,
} from '../../types';
import { ProfileForm, type ProfileFormHandle } from '../profile/ProfileForm';

type Tr = (key: string, fallback: string) => string;

export type EditProfileStepContentProps = {
  currentProfile: ApiTalentProfile;
  error: string | null;
  profileFormRef: React.RefObject<ProfileFormHandle | null>;
  isUpdatingProfile: boolean;
  onProfileSubmit: (payload: ApiTalentProfileCreateRequest | ApiTalentProfileUpdateRequest) => void;
  onValidityChange: (state: { isValid: boolean; hasSubmitted: boolean }) => void;
  tr: Tr;
};

export const EditProfileStepContent: React.FC<EditProfileStepContentProps> = ({
  currentProfile,
  error,
  profileFormRef,
  isUpdatingProfile,
  onProfileSubmit,
  onValidityChange,
  tr,
}) => (
  <>
    <div className='text-title-large'>{tr('Heading.ProfileInformation', 'Your information')}</div>
    <div className='content-muted text-body-medium'>
      {tr(
        'Text.EditProfileBeforeApplying',
        'Edit the profile information studios will see with your application.',
      )}
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
    <ProfileForm
      ref={profileFormRef}
      mode='edit'
      initialProfile={currentProfile}
      isSaving={isUpdatingProfile}
      onSubmit={onProfileSubmit}
      hideActions
      onValidityChange={onValidityChange}
    />
  </>
);
