// Pure validation for revenue share percent drafts and split-editor allocation state.
import {
  BASIS_POINTS_PER_PERCENT,
  REV_SHARE_TOTAL_BASIS_POINTS,
} from '../interface/RevShareViewModel';

export const REV_SHARE_PERCENT_FRACTION_DIGITS = 2;
/** Max digits allowed left of the decimal, not counting the special whole value `100`. */
export const REV_SHARE_PERCENT_INTEGER_DIGITS = 2;

/** Keeps digits and at most the decimal point characters; strips all other junk. */
export const stripRevSharePercentNoise = (value: string): string => value.replaceAll(/[^\d.]/g, '');

/**
 * Transient in-field drafts: at most one ".", left side at most 2 digits or exactly "100",
 * right side at most 2 digits; when left is "100", every right digit must be "0".
 */
export const isTransientRevSharePercent = (draftValue: string): boolean => {
  if (draftValue === '') {
    return true;
  }

  if ((draftValue.match(/\./g) ?? []).length > 1) {
    return false;
  }

  const periodIndex = draftValue.indexOf('.');
  const left = periodIndex === -1 ? draftValue : draftValue.slice(0, periodIndex);
  const right = periodIndex === -1 ? '' : draftValue.slice(periodIndex + 1);

  if (right.length > REV_SHARE_PERCENT_FRACTION_DIGITS) {
    return false;
  }

  if (!(left.length <= REV_SHARE_PERCENT_INTEGER_DIGITS || left === '100')) {
    return false;
  }

  if (left === '100' && Array.from(right).some((digit) => digit !== '0')) {
    return false;
  }

  return true;
};

export const normalizeRevSharePercentDraft = (draftValue: string): string =>
  draftValue.endsWith('.') ? draftValue.slice(0, -1) : draftValue;

export const parseRevSharePercentToBasisPoints = (percent: string): number | null => {
  const trimmedPercent = percent.trim();
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(trimmedPercent);
  if (!match) {
    return null;
  }

  const wholePercent = Number.parseInt(match[1], 10);
  const fractionalPercent = Number.parseInt(
    (match[2] ?? '').padEnd(REV_SHARE_PERCENT_FRACTION_DIGITS, '0') || '0',
    10,
  );
  const basisPoints = wholePercent * BASIS_POINTS_PER_PERCENT + fractionalPercent;

  if (basisPoints > REV_SHARE_TOTAL_BASIS_POINTS) {
    return null;
  }

  return basisPoints;
};

/** True when the draft is an allowed in-field transient (including empty and "."). */
export const isRevSharePercentDraftValid = (draftValue: string): boolean =>
  isTransientRevSharePercent(draftValue);

export type RevSharePercentEditInput = {
  value: string;
  selectionStart: number;
  selectionEnd: number;
  data: string | null;
  inputType: string;
};

const isDeleteForwardInputType = (inputType: string): boolean =>
  inputType === 'deleteContentForward' ||
  inputType === 'deleteWordForward' ||
  inputType === 'deleteSoftLineForward' ||
  inputType === 'deleteHardLineForward';

const isDeleteBackwardInputType = (inputType: string): boolean =>
  inputType === 'deleteContentBackward' ||
  inputType === 'deleteByCut' ||
  inputType === 'deleteContent' ||
  inputType === 'deleteWordBackward' ||
  inputType === 'deleteSoftLineBackward' ||
  inputType === 'deleteHardLineBackward' ||
  // Some environments omit inputType on backspace; treat empty as backward delete.
  inputType === '' ||
  (inputType.startsWith('delete') && !isDeleteForwardInputType(inputType));

export const computeRevSharePercentEditValue = ({
  value,
  selectionStart,
  selectionEnd,
  data,
  inputType,
}: RevSharePercentEditInput): string => {
  const start = Math.max(0, Math.min(selectionStart, value.length));
  const end = Math.max(start, Math.min(selectionEnd, value.length));

  if (start !== end) {
    return `${value.slice(0, start)}${data ?? ''}${value.slice(end)}`;
  }

  if (data != null && data.length > 0) {
    return `${value.slice(0, start)}${data}${value.slice(end)}`;
  }

  if (isDeleteForwardInputType(inputType)) {
    if (start >= value.length) {
      return value;
    }
    return `${value.slice(0, start)}${value.slice(start + 1)}`;
  }

  if (isDeleteBackwardInputType(inputType) || data == null) {
    if (start === 0) {
      return value;
    }
    return `${value.slice(0, start - 1)}${value.slice(start)}`;
  }

  return `${value.slice(0, start)}${data ?? ''}${value.slice(end)}`;
};

export type AcceptRevSharePercentEditResult =
  | { accepted: false }
  | { accepted: true; rawNext: string; nextDraft: string };

/** Strip noise from a proposed edit, then accept only valid transient drafts. */
export const acceptRevSharePercentEdit = (
  input: RevSharePercentEditInput,
): AcceptRevSharePercentEditResult => {
  const rawNext = computeRevSharePercentEditValue(input);
  const nextDraft = stripRevSharePercentNoise(rawNext);
  if (!isTransientRevSharePercent(nextDraft)) {
    return { accepted: false };
  }

  return { accepted: true, rawNext, nextDraft };
};

/** Blur commit: empty / "." → 0; otherwise normalize leading/trailing dots and parse bp. */
export const commitRevSharePercentDraft = (draftValue: string): number => {
  if (draftValue === '' || draftValue === '.') {
    return 0;
  }

  let normalized = draftValue.startsWith('.') ? `0${draftValue}` : draftValue;
  normalized = normalizeRevSharePercentDraft(normalized);
  if (normalized === '') {
    return 0;
  }

  const parsedBasisPoints = parseRevSharePercentToBasisPoints(normalized);
  return parsedBasisPoints != null && Number.isSafeInteger(parsedBasisPoints)
    ? parsedBasisPoints
    : 0;
};

export type RevShareSplitEditorAllocation = {
  splitBasisPoints: number;
  isManagingGroup?: boolean;
};

export const isRevShareSplitEditorAllocationInvalid = ({
  splitBasisPoints,
  isManagingGroup,
}: RevShareSplitEditorAllocation): boolean =>
  !Number.isSafeInteger(splitBasisPoints) ||
  splitBasisPoints < 0 ||
  splitBasisPoints > REV_SHARE_TOTAL_BASIS_POINTS ||
  (!isManagingGroup && splitBasisPoints === 0);

const MAX_REV_SHARE_RECIPIENTS = 100;

export type RevShareSplitEditorValidationReason =
  | 'empty'
  | 'invalid-basis-points'
  | 'recipient-zero'
  | 'recipient-limit'
  | 'total';

export const validateRevShareSplitEditorAllocations = (
  allocations: readonly RevShareSplitEditorAllocation[],
) => {
  const totalBasisPoints = allocations.reduce(
    (total, allocation) => total + allocation.splitBasisPoints,
    0,
  );

  let reason: RevShareSplitEditorValidationReason | null = null;
  if (allocations.length === 0) {
    reason = 'empty';
  } else if (
    allocations.some(
      ({ splitBasisPoints }) =>
        !Number.isSafeInteger(splitBasisPoints) ||
        splitBasisPoints < 0 ||
        splitBasisPoints > REV_SHARE_TOTAL_BASIS_POINTS,
    )
  ) {
    reason = 'invalid-basis-points';
  } else if (
    allocations.some(
      ({ splitBasisPoints, isManagingGroup }) => !isManagingGroup && splitBasisPoints === 0,
    )
  ) {
    reason = 'recipient-zero';
  } else {
    const recipientCount = allocations.filter(
      ({ splitBasisPoints, isManagingGroup }) => !isManagingGroup && splitBasisPoints > 0,
    ).length;
    if (recipientCount > MAX_REV_SHARE_RECIPIENTS) {
      reason = 'recipient-limit';
    } else if (totalBasisPoints !== REV_SHARE_TOTAL_BASIS_POINTS) {
      reason = 'total';
    }
  }

  return {
    isValid: reason === null,
    totalBasisPoints,
    reason,
  };
};
