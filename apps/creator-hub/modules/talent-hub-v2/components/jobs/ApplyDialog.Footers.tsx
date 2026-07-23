import React from 'react';
import { Button } from '@rbx/foundation-ui';
import type { ApiTalentProfile } from '../../types';
import type { Step } from './ApplyDialog.steps';
import dialogStyles from '../shared/Layout.module.css';

type Tr = (key: string, fallback: string) => string;

export type ApplyDialogFootersProps = {
  step: Step;
  currentProfile: ApiTalentProfile | null;
  profileFormValidity: { isValid: boolean; hasSubmitted: boolean };
  isCreatingProfile: boolean;
  isUpdatingProfile: boolean;
  isUploadingResume: boolean;
  isSubmitting: boolean;
  onCreateContinue: () => void;
  onProfilePreviewNext: () => void;
  onProfilePreviewEdit: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onResumeNext: () => void;
  onResumeBack: () => void;
  onReviewSubmit: () => void;
  onReviewBack: () => void;
  tr: Tr;
};

export const ApplyDialogFooters: React.FC<ApplyDialogFootersProps> = ({
  step,
  currentProfile,
  profileFormValidity,
  isCreatingProfile,
  isUpdatingProfile,
  isUploadingResume,
  isSubmitting,
  onCreateContinue,
  onProfilePreviewNext,
  onProfilePreviewEdit,
  onEditSave,
  onEditCancel,
  onResumeNext,
  onResumeBack,
  onReviewSubmit,
  onReviewBack,
  tr,
}) => {
  if (step === 'create-profile') {
    return (
      <div className='gap-xsmall flex flex-col'>
        {profileFormValidity.hasSubmitted && !profileFormValidity.isValid ? (
          <div className='content-alert text-body-small'>
            {tr(
              'Description.CompleteRequiredFieldsBeforeContinuing',
              'Fill in the required fields above before continuing.',
            )}
          </div>
        ) : null}
        <div className={`width-full gap-small flex ${dialogStyles.equalButtons}`}>
          <Button
            variant='Emphasis'
            size='Medium'
            className='width-full'
            onClick={onCreateContinue}
            isLoading={isCreatingProfile}
            isDisabled={!profileFormValidity.isValid && profileFormValidity.hasSubmitted}>
            {tr('Action.Continue', 'Next')}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'profile-preview') {
    return (
      <div className={`width-full gap-small flex ${dialogStyles.equalButtons}`}>
        <Button
          variant='Emphasis'
          size='Medium'
          className='width-full'
          onClick={onProfilePreviewNext}
          isDisabled={!currentProfile}>
          {tr('Action.Continue', 'Next')}
        </Button>
        <Button
          variant='Standard'
          size='Medium'
          className='width-full'
          onClick={onProfilePreviewEdit}
          isDisabled={!currentProfile}>
          {tr('Action.Edit', 'Edit')}
        </Button>
      </div>
    );
  }

  if (step === 'edit-profile') {
    return (
      <div className='gap-xsmall flex flex-col'>
        {profileFormValidity.hasSubmitted && !profileFormValidity.isValid ? (
          <div className='content-alert text-body-small'>
            {tr(
              'Description.CompleteRequiredFieldsBeforeContinuing',
              'Fill in the required fields above before continuing.',
            )}
          </div>
        ) : null}
        <div className={`width-full gap-small flex ${dialogStyles.equalButtons}`}>
          <Button
            variant='Emphasis'
            size='Medium'
            className='width-full'
            onClick={onEditSave}
            isLoading={isUpdatingProfile}
            isDisabled={!profileFormValidity.isValid && profileFormValidity.hasSubmitted}>
            {tr('Action.Save', 'Save')}
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            className='width-full'
            onClick={onEditCancel}
            isDisabled={isUpdatingProfile}>
            {tr('Action.Cancel', 'Cancel')}
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'resume-stats') {
    return (
      <div className={`gap-small flex ${dialogStyles.equalButtons}`}>
        <Button
          variant='Emphasis'
          size='Medium'
          onClick={onResumeNext}
          isDisabled={isUploadingResume}>
          {tr('Action.Next', 'Next')}
        </Button>
        <Button variant='Standard' size='Medium' onClick={onResumeBack}>
          {tr('Action.Back', 'Back')}
        </Button>
      </div>
    );
  }

  if (step === 'review' && currentProfile) {
    return (
      <div className={`gap-small flex ${dialogStyles.equalButtons}`}>
        <Button variant='Emphasis' size='Medium' onClick={onReviewSubmit} isLoading={isSubmitting}>
          {tr('Action.Apply', 'Apply')}
        </Button>
        <Button variant='Standard' size='Medium' onClick={onReviewBack}>
          {tr('Action.Back', 'Back')}
        </Button>
      </div>
    );
  }

  return null;
};
