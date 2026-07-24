// Presents proposed recipient split changes, approval requirements, and navigation controls before submission.
import type { FunctionComponent } from 'react';
import { Button, type TStepperStep } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RevShareWizardStep from './nav/RevShareWizardStep';
import RevShareReviewShell from './RevShareReviewShell';
import type { RevShareDiffRowData } from './tables/RevShareDiffTable';

type RevShareReviewViewProps = {
  rows: readonly RevShareDiffRowData[];
  wizardSteps: TStepperStep[];
  currentStepIndex: number;
  wizardAriaLabel: string;
  onBack?: () => void;
  onContinue?: () => void;
  isSubmitting?: boolean;
  stepFocusRef?: (element: HTMLElement | null) => void;
};

const RevShareReviewView: FunctionComponent<RevShareReviewViewProps> = ({
  rows,
  wizardSteps,
  currentStepIndex,
  wizardAriaLabel,
  onBack,
  onContinue,
  isSubmitting = false,
  stepFocusRef,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const reviewChangesHeading = tPendingTranslation(
    'Review changes',
    'Heading for reviewing a proposed revenue share split.',
    translationKey('Heading.ReviewChanges', TranslationNamespace.RevenueShareAgreements),
  );

  return (
    <RevShareReviewShell
      chrome={
        <RevShareWizardStep
          steps={wizardSteps}
          currentStepIndex={currentStepIndex}
          aria-label={wizardAriaLabel}
        />
      }
      stepFocusRef={stepFocusRef}
      stepFocusFallbackLabel={reviewChangesHeading}
      description={tPendingTranslation(
        'Confirm the proposed splits before submitting for approval.',
        'Description for reviewing a proposed revenue share split.',
        translationKey(
          'Label.ReviewChangesDescription',
          TranslationNamespace.RevenueShareAgreements,
        ),
      )}
      rows={rows}
      footer={
        <div className='flex justify-end gap-medium'>
          <Button type='button' variant='Standard' size='Medium' onClick={onBack}>
            {tPendingTranslation(
              'Back',
              'Label on a button that returns to the previous step in a multi-step wizard.',
              translationKey('Action.Back', TranslationNamespace.Controls),
            )}
          </Button>
          <Button
            type='button'
            variant='Emphasis'
            size='Medium'
            onClick={onContinue}
            isDisabled={onContinue === undefined || isSubmitting}>
            {tPendingTranslation(
              'Continue',
              'Button to continue to the next revenue share wizard step.',
              translationKey('Action.Continue', TranslationNamespace.Controls),
            )}
          </Button>
        </div>
      }
    />
  );
};

export default RevShareReviewView;
