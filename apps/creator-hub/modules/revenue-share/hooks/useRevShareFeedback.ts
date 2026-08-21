// Provides localized success and error toast feedback for proposing, responding to, and cancelling revenue share changes.
import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { toast } from '@modules/monetization-shared/snackbar/actions';

export type RevShareOperation = 'propose' | 'respond' | 'cancel';

const SUCCESS_ICON = 'icon-filled-circle-check' as const;
const ERROR_ICON = 'icon-filled-triangle-exclamation' as const;

export type RevShareFeedback = {
  showSuccess: (operation: RevShareOperation) => void;
  showError: (operation: RevShareOperation, message?: string) => void;
};

const useRevShareFeedback = (): RevShareFeedback => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());

  const genericError = tPendingTranslation(
    'Something went wrong. Please try again.',
    'Generic fallback shown when a revenue-share action fails without a specific reason.',
    translationKey('Message.GenericError', TranslationNamespace.RevenueShareAgreements),
  );

  const showSuccess = useCallback(
    (operation: RevShareOperation) => {
      let title: string;
      switch (operation) {
        case 'propose':
          title = tPendingTranslation(
            'Proposal sent.',
            'Success toast shown after a revenue-share action completes.',
            translationKey('Message.ProposeSuccess', TranslationNamespace.RevenueShareAgreements),
          );
          break;
        case 'respond':
          title = tPendingTranslation(
            'Response submitted.',
            'Success toast shown after a revenue-share action completes.',
            translationKey('Message.RespondSuccess', TranslationNamespace.RevenueShareAgreements),
          );
          break;
        case 'cancel':
          title = tPendingTranslation(
            'Proposal cancelled.',
            'Success toast shown after a revenue-share action completes.',
            translationKey('Message.CancelSuccess', TranslationNamespace.RevenueShareAgreements),
          );
          break;
      }
      toast({
        title,
        icon: SUCCESS_ICON,
      });
    },
    [tPendingTranslation],
  );

  const showError = useCallback(
    (operation: RevShareOperation, message?: string) => {
      let fallback: string;
      switch (operation) {
        case 'propose':
          fallback = tPendingTranslation(
            'Could not send the proposal. Please try again.',
            'Error toast shown when a revenue-share action fails.',
            translationKey('Message.ProposeError', TranslationNamespace.RevenueShareAgreements),
          );
          break;
        case 'respond':
          fallback = tPendingTranslation(
            'Could not submit your response. Please try again.',
            'Error toast shown when a revenue-share action fails.',
            translationKey('Message.RespondError', TranslationNamespace.RevenueShareAgreements),
          );
          break;
        case 'cancel':
          fallback = tPendingTranslation(
            'Could not cancel the proposal. Please try again.',
            'Error toast shown when a revenue-share action fails.',
            translationKey('Message.CancelError', TranslationNamespace.RevenueShareAgreements),
          );
          break;
      }
      toast({
        title: message ?? fallback ?? genericError,
        icon: ERROR_ICON,
      });
    },
    [tPendingTranslation, genericError],
  );

  return { showSuccess, showError };
};

export default useRevShareFeedback;
