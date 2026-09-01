import React from 'react';
import { Divider, FeedbackBanner } from '@rbx/foundation-ui';
import type { ApiResume, ApiTalentProfile } from '../../types';
import { TalentSignal } from '../signal/TalentSignal';
import { ReviewProfileSection } from './ApplyDialog.ProfileSummary';
import { ReviewResumeSection } from './ApplyDialog.ReviewResumeSection';

type Tr = (key: string, fallback: string) => string;

export type ReviewStepContentProps = {
  currentProfile: ApiTalentProfile;
  robloxUsername: string;
  allResumes: ApiResume[];
  selectedResumeId: string | undefined;
  includeSignals: boolean;
  error: string | null;
  onGoToResumeStats: () => void;
  tr: Tr;
};

export const ReviewStepContent: React.FC<ReviewStepContentProps> = ({
  currentProfile,
  robloxUsername,
  allResumes,
  selectedResumeId,
  includeSignals,
  error,
  onGoToResumeStats,
  tr,
}) => (
  <>
    <div className='text-title-large'>{tr('Heading.Review', 'Review')}</div>

    <ReviewProfileSection profile={currentProfile} robloxUsername={robloxUsername} />

    <Divider />

    <ReviewResumeSection
      resumes={allResumes}
      selectedResumeId={selectedResumeId}
      onEdit={onGoToResumeStats}
    />

    <Divider />

    {includeSignals ? <TalentSignal /> : null}

    {includeSignals ? <Divider /> : null}

    {error ? (
      <FeedbackBanner
        title=''
        description={error}
        layout='Inline'
        variant='Standard'
        severity='Error'
      />
    ) : null}
  </>
);
