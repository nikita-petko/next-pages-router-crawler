import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';

const NUMERIC_ID_SUBTYPES = ['asset', 'bundle', 'gamepass', 'devproduct'] as const;
const STRING_ID_SUBTYPES = ['iec'] as const;

type NumericIdSubtype = (typeof NUMERIC_ID_SUBTYPES)[number];
type StringIdSubtype = (typeof STRING_ID_SUBTYPES)[number];

export type ParsedProductKey = {
  subtype?: NumericIdSubtype | StringIdSubtype;
  itemId: number;
  stringId?: string;
};

const isNumericIdSubtype = (prefix: string): prefix is NumericIdSubtype =>
  (NUMERIC_ID_SUBTYPES as readonly string[]).includes(prefix);

const isStringIdSubtype = (prefix: string): prefix is StringIdSubtype =>
  (STRING_ID_SUBTYPES as readonly string[]).includes(prefix);

const parseProductKeyBreakdownValue = (
  breakdownValues: RAQIV2BreakdownValue[],
): ParsedProductKey | undefined => {
  // If the dimension is GamePassId, we can return the itemId directly.
  const gamePassIdBreakdownValue = breakdownValues.find(
    (value) => value.dimension === RAQIV2Dimension.GamePassId,
  )?.value;
  if (gamePassIdBreakdownValue && Number.isFinite(Number(gamePassIdBreakdownValue))) {
    return {
      subtype: 'gamepass',
      itemId: Number(gamePassIdBreakdownValue),
    };
  }

  const productKeyBreakdownValue = breakdownValues.find(
    (value) => value.dimension === RAQIV2Dimension.ProductKey,
  )?.value;

  const raw = productKeyBreakdownValue ?? '';
  const [maybePrefix, ...remainderParts] = raw.split('_');
  const remainder = remainderParts.join('_');
  const normalizedPrefix = (maybePrefix ?? '').toLowerCase();

  if (isStringIdSubtype(normalizedPrefix)) {
    if (remainder === '') {
      return undefined;
    }
    return {
      subtype: normalizedPrefix,
      itemId: 0,
      stringId: remainder,
    };
  }

  if (isNumericIdSubtype(normalizedPrefix)) {
    const parsedId = Number(remainder);
    if (!Number.isFinite(parsedId)) {
      return undefined;
    }
    return {
      subtype: normalizedPrefix,
      itemId: parsedId,
    };
  }

  const parsedId = Number(raw);
  if (!Number.isFinite(parsedId)) {
    return undefined;
  }

  return {
    subtype: undefined,
    itemId: parsedId,
  };
};

export default parseProductKeyBreakdownValue;
