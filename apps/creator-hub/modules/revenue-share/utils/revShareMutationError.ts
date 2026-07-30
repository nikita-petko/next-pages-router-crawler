// Classifies revenue-share mutation failures into stale (needs Refresh), actionable, or generic.
import { RevShareResult } from '../interface/RevShareViewModel';

export type RevShareMutationOperation = 'respond' | 'propose' | 'cancel';

export type RevShareMutationErrorKind = 'stale' | 'actionable' | 'generic';

export type ClassifiedRevShareMutationError = {
  kind: RevShareMutationErrorKind;
  result: RevShareResult | null;
};

const RESULT_BY_VALUE: ReadonlyMap<string, RevShareResult> = new Map(
  Object.values(RevShareResult).map((value) => [value, value]),
);

const RESPOND_STALE: ReadonlySet<RevShareResult> = new Set([
  RevShareResult.NoOpenProposal,
  RevShareResult.RecipientAlreadyResponded,
  RevShareResult.NotFound,
  RevShareResult.RecipientNotFound,
]);

const RESPOND_ACTIONABLE: ReadonlySet<RevShareResult> = new Set([RevShareResult.Unauthorized]);

const PROPOSE_STALE: ReadonlySet<RevShareResult> = new Set([
  RevShareResult.StaleActiveAgreement,
  RevShareResult.ProposalAlreadyExists,
  RevShareResult.NotFound,
]);

const PROPOSE_ACTIONABLE: ReadonlySet<RevShareResult> = new Set([
  RevShareResult.SplitSumInvalid,
  RevShareResult.DuplicateRecipient,
  RevShareResult.RecipientNotGroupMember,
  RevShareResult.RecipientIsManagingGroup,
  RevShareResult.RecipientLimitExceeded,
  RevShareResult.RecipientNotFound,
  RevShareResult.Unauthorized,
]);

const CANCEL_STALE: ReadonlySet<RevShareResult> = new Set([
  RevShareResult.NotFound,
  RevShareResult.NoOpenProposal,
]);

const CANCEL_ACTIONABLE: ReadonlySet<RevShareResult> = new Set([RevShareResult.Unauthorized]);

// Every mutation is gated behind the same 2SV challenge, so the failure is actionable regardless
// of which one the caller attempted: retrying the challenge is all that is needed.
const ACTIONABLE_FOR_EVERY_OPERATION: ReadonlySet<RevShareResult> = new Set([
  RevShareResult.TwoFaFailed,
]);

const parseRevShareResult = (value: string): RevShareResult | null =>
  RESULT_BY_VALUE.get(value) ?? null;

export const getRevShareResultFromUnknown = (error: unknown): RevShareResult | null => {
  if (typeof error === 'string') {
    return parseRevShareResult(error);
  }
  if (error instanceof Error) {
    return parseRevShareResult(error.message);
  }
  return null;
};

const kindForResult = (
  operation: RevShareMutationOperation,
  result: RevShareResult,
): RevShareMutationErrorKind => {
  if (result === RevShareResult.Succeeded) {
    return 'generic';
  }
  if (ACTIONABLE_FOR_EVERY_OPERATION.has(result)) {
    return 'actionable';
  }

  const staleResults =
    operation === 'respond'
      ? RESPOND_STALE
      : operation === 'propose'
        ? PROPOSE_STALE
        : CANCEL_STALE;
  const actionableResults =
    operation === 'respond'
      ? RESPOND_ACTIONABLE
      : operation === 'propose'
        ? PROPOSE_ACTIONABLE
        : CANCEL_ACTIONABLE;

  if (staleResults.has(result)) {
    return 'stale';
  }
  if (actionableResults.has(result)) {
    return 'actionable';
  }
  return 'generic';
};

export const classifyRevShareMutationError = (
  operation: RevShareMutationOperation,
  resultOrError: unknown,
): ClassifiedRevShareMutationError => {
  const result = getRevShareResultFromUnknown(resultOrError);

  if (result == null) {
    return { kind: 'generic', result: null };
  }

  return { kind: kindForResult(operation, result), result };
};
