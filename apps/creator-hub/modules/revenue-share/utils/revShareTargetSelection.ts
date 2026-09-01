// Parses revenue-share target query parameters and finds the matching recipient agreement.
import {
  RevShareTargetType,
  type ManagerAgreement,
  type RecipientAgreement,
  type RevShareTarget,
} from '../interface/RevShareViewModel';

const REV_SHARE_TARGET_TYPES = new Set<string>(Object.values(RevShareTargetType));

const isRevShareTargetType = (value: string): value is RevShareTargetType =>
  REV_SHARE_TARGET_TYPES.has(value);

export const parseRevShareTargetQuery = (
  targetType: string | string[] | null | undefined,
  targetId: string | string[] | null | undefined,
): RevShareTarget | null => {
  if (typeof targetType !== 'string' || typeof targetId !== 'string' || targetId.length === 0) {
    return null;
  }
  if (!isRevShareTargetType(targetType)) {
    return null;
  }
  return { type: targetType, id: targetId };
};

export const findManagerAgreementByTarget = (
  agreements: readonly ManagerAgreement[],
  target: RevShareTarget | null,
): ManagerAgreement | null => {
  if (!target) {
    return null;
  }
  return (
    agreements.find(
      (agreement) => agreement.target.type === target.type && agreement.target.id === target.id,
    ) ?? null
  );
};

export const findRecipientAgreementByTarget = (
  agreements: readonly RecipientAgreement[],
  target: RevShareTarget | null,
): RecipientAgreement | null => {
  if (!target) {
    return null;
  }
  return (
    agreements.find(
      (agreement) => agreement.target.type === target.type && agreement.target.id === target.id,
    ) ?? null
  );
};
