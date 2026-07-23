// Renders the revenue share split editor with recipient search, allocation controls, validation feedback, and wizard navigation.
import type { FunctionComponent, Ref } from 'react';
import { Button, type TStepperStep } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { RevShareRecipientSearchResult } from '../interface/RevShareViewModel';
import RevShareWizardStep from './nav/RevShareWizardStep';
import RevShareBanner from './RevShareBanner';
import RevShareRecipientSearch from './RevShareRecipientSearch';
import RevShareSplitEditorTable from './tables/RevShareSplitEditorTable';
import type { SplitEditorRow } from './tables/RevShareSplitEditorTable';

type RevShareSplitEditorViewProps = {
  wizardSteps: TStepperStep[];
  currentStepIndex: number;
  wizardAriaLabel: string;
  rows: readonly SplitEditorRow[];
  onSplitChange?: (key: string, newBasisPoints: number) => void;
  onSplitValidityChange?: (key: string, isValid: boolean) => void;
  onRemove?: (key: string) => void;
  recipientQuery: string;
  searchResults: readonly RevShareRecipientSearchResult[];
  excludedRecipientKeys?: ReadonlySet<string>;
  onRecipientQueryChange: (query: string) => void;
  onAddRecipient: (recipient: RevShareRecipientSearchResult) => void;
  isRecipientSearchLoading?: boolean;
  recipientSearchError?: string;
  onBack?: () => void;
  onContinue?: () => void;
  validationMessage?: string;
  validationMessageId?: string;
  validationBannerRef?: Ref<HTMLDivElement>;
};

const RevShareSplitEditorView: FunctionComponent<RevShareSplitEditorViewProps> = ({
  wizardSteps,
  currentStepIndex,
  wizardAriaLabel,
  rows,
  onSplitChange,
  onSplitValidityChange,
  onRemove,
  recipientQuery,
  searchResults,
  excludedRecipientKeys,
  onRecipientQueryChange,
  onAddRecipient,
  isRecipientSearchLoading = false,
  recipientSearchError,
  onBack,
  onContinue,
  validationMessage,
  validationMessageId,
  validationBannerRef,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  return (
    <div className='flex flex-col gap-large width-full max-width-[700px] margin-x-auto'>
      <RevShareWizardStep
        steps={wizardSteps}
        currentStepIndex={currentStepIndex}
        aria-label={wizardAriaLabel}
      />

      <div className='flex flex-col gap-xsmall'>
        <h2 className='text-heading-medium content-emphasis margin-none'>
          {tPendingTranslation(
            'Edit recipients',
            'Heading and accessible table label for editing revenue share recipients.',
            translationKey('Heading.EditRecipients', TranslationNamespace.RevenueShareAgreements),
          )}
        </h2>
        <span className='text-body-medium content-muted'>
          {tPendingTranslation(
            'Add or remove recipients, and adjust their revenue splits.',
            'Description for editing revenue share recipients.',
            translationKey(
              'Label.EditRecipientsDescription',
              TranslationNamespace.RevenueShareAgreements,
            ),
          )}
        </span>
      </div>

      <RevShareRecipientSearch
        query={recipientQuery}
        results={searchResults}
        excludedRecipientKeys={excludedRecipientKeys}
        isLoading={isRecipientSearchLoading}
        error={recipientSearchError}
        onQueryChange={onRecipientQueryChange}
        onSelect={onAddRecipient}
      />

      <RevShareSplitEditorTable
        rows={rows}
        onSplitChange={onSplitChange}
        onSplitValidityChange={onSplitValidityChange}
        onRemove={onRemove}
      />

      {validationMessage && (
        <RevShareBanner
          ref={validationBannerRef}
          id={validationMessageId}
          tabIndex={-1}
          tone='alert'
          message={validationMessage}
        />
      )}

      <div className='flex justify-end gap-medium'>
        <Button type='button' variant='Standard' size='Medium' onClick={onBack}>
          {tPendingTranslation(
            'Back',
            'Label on a button that returns to the previous step in a multi-step wizard.',
            translationKey('Action.Back', TranslationNamespace.Controls),
          )}
        </Button>
        <Button type='button' variant='Emphasis' size='Medium' onClick={onContinue}>
          {tPendingTranslation(
            'Continue',
            'Button to continue to the next revenue share wizard step.',
            translationKey('Action.Continue', TranslationNamespace.Controls),
          )}
        </Button>
      </div>
    </div>
  );
};

export default RevShareSplitEditorView;
