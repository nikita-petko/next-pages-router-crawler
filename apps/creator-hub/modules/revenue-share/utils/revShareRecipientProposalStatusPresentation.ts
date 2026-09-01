// Maps settled recipient proposal confirmation statuses to shared banner presentation.
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareConfirmationStatus } from '../interface/RevShareViewModel';

export type RevShareRecipientProposalStatusTone = 'emphasis' | 'success';

export type RevShareRecipientSettledStatusBanner = {
  tone: RevShareRecipientProposalStatusTone;
  message: string;
};

/**
 * Builds settled-status banner copy with literal tPendingTranslation arguments so
 * translation-sync structural checks can scan descriptions at the call sites.
 */
export const translateRevShareRecipientSettledStatusBanner = (
  status: RevShareConfirmationStatus | undefined,
  tPendingTranslation: TPendingTranslationFunction,
): RevShareRecipientSettledStatusBanner | null => {
  if (status === undefined) {
    return null;
  }

  switch (status) {
    case RevShareConfirmationStatus.Accepted:
      return {
        tone: 'success',
        message: tPendingTranslation(
          'You accepted this proposal. It will activate after all required parties accept.',
          'Status shown when the current recipient already accepted a revenue-share proposal.',
          translationKey(
            'Message.RecipientProposalAcceptedPendingOthers',
            TranslationNamespace.RevenueShareAgreements,
          ),
        ),
      };
    case RevShareConfirmationStatus.AutoAccepted:
      return {
        tone: 'success',
        message: tPendingTranslation(
          'No response is needed from you. This proposal is waiting on other recipients.',
          'Status shown when a recipient proposal was auto-accepted and is waiting on other parties.',
          translationKey(
            'Message.RecipientProposalAutoAcceptedPendingOthers',
            TranslationNamespace.RevenueShareAgreements,
          ),
        ),
      };
    case RevShareConfirmationStatus.Declined:
      return {
        tone: 'emphasis',
        message: tPendingTranslation(
          'You declined this proposal.',
          'Status shown when the current recipient declined a revenue-share proposal.',
          translationKey(
            'Message.RecipientProposalDeclined',
            TranslationNamespace.RevenueShareAgreements,
          ),
        ),
      };
    case RevShareConfirmationStatus.Pending:
      return null;
  }

  return null;
};
