import React from 'react';
import type { ApiTalentProfile } from '../../types';
import { ProfileSummaryContents } from './ApplyDialog.ProfileSummary';

type Tr = (key: string, fallback: string) => string;

export type ProfilePreviewStepContentProps = {
  currentProfile: ApiTalentProfile;
  robloxUsername: string;
  howStudioWillSeeYouText: string;
  tr: Tr;
};

export const ProfilePreviewStepContent: React.FC<ProfilePreviewStepContentProps> = ({
  currentProfile,
  robloxUsername,
  howStudioWillSeeYouText,
  tr,
}) => (
  <>
    <div className='text-title-large'>{tr('Heading.ProfileInformation', 'Your information')}</div>
    <div className='content-muted text-body-medium'>{howStudioWillSeeYouText}</div>
    <ProfileSummaryContents profile={currentProfile} robloxUsername={robloxUsername} />
  </>
);
