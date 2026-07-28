// Presents proposed recipient split changes, approval requirements, and navigation controls before submission.
import { useEffect, useMemo, useRef, type FunctionComponent } from 'react';
import { Button, type TStepperStep } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { ClassifiedRevShareMutationError } from '../utils/revShareMutationError';
import { translateRevShareMutationError } from '../utils/revShareMutationErrorPresentation';
import RevShareWizardStep from './nav/RevShareWizardStep';
import RevShareBanner from './RevShareBanner';
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
  replacesOpenProposal?: boolean;
  stepFocusRef?: (element: HTMLElement | null) => void;
  submissionError?: ClassifiedRevShareMutationError | null;
  onRefreshSubmissionError?: () => void;
};

const RevShareReviewView: FunctionComponent<RevShareReviewViewProps> = ({
  rows,
  wizardSteps,
  currentStepIndex,
  wizardAriaLabel,
  onBack,
  onContinue,
  isSubmitting = false,
  replacesOpenProposal = false,
  stepFocusRef,
  submissionError = null,
  onRefreshSubmissionError,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const reviewChangesHeading = tPendingTranslation(
    'Review changes',
    'Heading for reviewing a proposed revenue share split.',
    translationKey('Heading.ReviewChanges', TranslationNamespace.RevenueShareAgreements),
  );
  const refreshLabel = tPendingTranslation(
    'Refresh',
    'Button label to refresh revenue-share data after a stale mutation error.',
    translationKey('Action.Refresh', TranslationNamespace.Controls),
  );
  useEffect(() => {
    if (submissionError != null) {
      errorBannerRef.current?.focus();
    }
  }, [submissionError]);
  const errorBanner = useMemo(() => {
    if (submissionError == null) {
      return undefined;
    }
    const presentation = translateRevShareMutationError(
      'propose',
      submissionError,
      tPendingTranslation,
    );
    const showRefresh = presentation.kind === 'stale' && onRefreshSubmissionError !== undefined;
    return showRefresh ? (
      <RevShareBanner
        ref={errorBannerRef}
        tabIndex={-1}
        tone='alert'
        message={presentation.message}
        actionLabel={refreshLabel}
        onAction={onRefreshSubmissionError}
      />
    ) : (
      <RevShareBanner
        ref={errorBannerRef}
        tabIndex={-1}
        tone='alert'
        message={presentation.message}
      />
    );
  }, [onRefreshSubmissionError, refreshLabel, submissionError, tPendingTranslation]);

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
      banner={errorBanner}
      foreshadowCurrentUserAutoAccept
      replacesOpenProposal={replacesOpenProposal}
      footer={
        <div className='flex justify-end gap-medium'>
          <Button
            type='button'
            variant='Standard'
            size='Medium'
            onClick={onBack}
            isDisabled={isSubmitting}>
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
