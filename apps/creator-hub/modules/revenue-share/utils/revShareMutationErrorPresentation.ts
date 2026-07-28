// Builds pending-translation banner copy for classified revenue-share mutation errors.
import type { TPendingTranslationFunction } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { RevShareResult } from '../interface/RevShareViewModel';
import type {
  ClassifiedRevShareMutationError,
  RevShareMutationErrorKind,
  RevShareMutationOperation,
} from './revShareMutationError';

export type RevShareMutationErrorPresentation = {
  kind: RevShareMutationErrorKind;
  message: string;
};

const translateGenericMutationError = (tPendingTranslation: TPendingTranslationFunction): string =>
  tPendingTranslation(
    'Something went wrong. Please try again.',
    'Generic fallback shown when a revenue-share action fails without a specific reason.',
    translationKey('Message.GenericError', TranslationNamespace.RevenueShareAgreements),
  );

const translateStaleMutationError = (
  operation: RevShareMutationOperation,
  result: RevShareResult,
  tPendingTranslation: TPendingTranslationFunction,
): string | null => {
  if (result === RevShareResult.NoOpenProposal && operation !== 'cancel') {
    return tPendingTranslation(
      'This proposal is no longer open.',
      'Error when responding to a revenue-share proposal that is no longer open.',
      translationKey('Message.NoOpenProposal', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (result === RevShareResult.RecipientAlreadyResponded) {
    return tPendingTranslation(
      'You already responded to this proposal.',
      'Error when a recipient tries to respond again to a revenue-share proposal.',
      translationKey(
        'Message.RecipientAlreadyResponded',
        TranslationNamespace.RevenueShareAgreements,
      ),
    );
  }
  if (result === RevShareResult.StaleActiveAgreement) {
    return tPendingTranslation(
      'This agreement changed since you started.',
      'Error when proposing a revenue-share change against a stale active agreement.',
      translationKey('Message.StaleActiveAgreement', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (result === RevShareResult.ProposalAlreadyExists) {
    return tPendingTranslation(
      'An open proposal already exists.',
      'Error when proposing a revenue-share change while another proposal is already open.',
      translationKey('Message.ProposalAlreadyExists', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (result === RevShareResult.NotFound || result === RevShareResult.NoOpenProposal) {
    if (operation === 'cancel') {
      return tPendingTranslation(
        'This proposal is no longer available.',
        'Error when cancelling a revenue-share proposal that no longer exists or is no longer open.',
        translationKey(
          'Message.CancelProposalNotFound',
          TranslationNamespace.RevenueShareAgreements,
        ),
      );
    }
    if (operation === 'propose') {
      return tPendingTranslation(
        'This experience or item could not be found.',
        'Error when proposing a revenue-share change for a missing target.',
        translationKey(
          'Message.ProposeTargetNotFound',
          TranslationNamespace.RevenueShareAgreements,
        ),
      );
    }
    return tPendingTranslation(
      'This proposal could not be found.',
      'Error when a revenue-share proposal or agreement is missing on respond.',
      translationKey(
        'Message.RespondProposalNotFound',
        TranslationNamespace.RevenueShareAgreements,
      ),
    );
  }
  if (result === RevShareResult.RecipientNotFound && operation === 'respond') {
    return tPendingTranslation(
      'You are no longer on this proposal.',
      'Error when the responding recipient is not listed on the revenue-share proposal.',
      translationKey(
        'Message.RespondRecipientNotFound',
        TranslationNamespace.RevenueShareAgreements,
      ),
    );
  }
  return null;
};

const translateActionableMutationError = (
  result: RevShareResult,
  tPendingTranslation: TPendingTranslationFunction,
): string | null => {
  if (result === RevShareResult.Unauthorized) {
    return tPendingTranslation(
      'You do not have permission to complete this action.',
      'Error when the caller is unauthorized for a revenue-share mutation.',
      translationKey('Message.MutationUnauthorized', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (result === RevShareResult.SplitSumInvalid) {
    return tPendingTranslation(
      'The split must total 100%. Adjust the shares and try again.',
      'Error when a proposed revenue-share split does not sum correctly.',
      translationKey('Message.SplitSumInvalid', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (result === RevShareResult.DuplicateRecipient) {
    return tPendingTranslation(
      'A recipient was added more than once. Remove the duplicate and try again.',
      'Error when a proposed revenue-share split includes a duplicate recipient.',
      translationKey('Message.DuplicateRecipient', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (result === RevShareResult.RecipientNotGroupMember) {
    return tPendingTranslation(
      'A recipient must be a member of the managing group. Remove them and try again.',
      'Error when a proposed user recipient is not a managing-group member.',
      translationKey(
        'Message.RecipientNotGroupMember',
        TranslationNamespace.RevenueShareAgreements,
      ),
    );
  }
  if (result === RevShareResult.RecipientIsManagingGroup) {
    return tPendingTranslation(
      'The managing group cannot be added as a recipient. Remove it and try again.',
      'Error when the managing group is listed as a revenue-share recipient.',
      translationKey(
        'Message.RecipientIsManagingGroup',
        TranslationNamespace.RevenueShareAgreements,
      ),
    );
  }
  if (result === RevShareResult.RecipientLimitExceeded) {
    return tPendingTranslation(
      'Too many recipients were added. Remove some and try again.',
      'Error when a proposed revenue-share split exceeds the recipient limit.',
      translationKey('Message.RecipientLimitExceeded', TranslationNamespace.RevenueShareAgreements),
    );
  }
  if (result === RevShareResult.RecipientNotFound) {
    return tPendingTranslation(
      'A recipient could not be found. Remove them and try again.',
      'Error when a proposed revenue-share recipient does not exist.',
      translationKey(
        'Message.ProposeRecipientNotFound',
        TranslationNamespace.RevenueShareAgreements,
      ),
    );
  }
  return null;
};

/**
 * Literal tPendingTranslation arguments so translation-sync structural checks can scan
 * descriptions at this call site.
 */
export const translateRevShareMutationError = (
  operation: RevShareMutationOperation,
  classified: ClassifiedRevShareMutationError,
  tPendingTranslation: TPendingTranslationFunction,
): RevShareMutationErrorPresentation => {
  const { kind, result } = classified;

  if (kind === 'stale' && result != null) {
    const message = translateStaleMutationError(operation, result, tPendingTranslation);
    if (message != null) {
      return { kind, message };
    }
  }

  if (kind === 'actionable' && result != null) {
    const message = translateActionableMutationError(result, tPendingTranslation);
    if (message != null) {
      return { kind, message };
    }
  }

  return {
    kind: 'generic',
    message: translateGenericMutationError(tPendingTranslation),
  };
};
