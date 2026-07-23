import { RAQIV2Dimension } from '@rbx/creator-hub-analytics-config';
import type { RAQIV2BreakdownValue } from '@modules/clients/analytics';

export type ParsedProductKey = {
  subtype?: 'asset' | 'bundle' | 'gamepass' | 'devproduct';
  itemId: number;
};

const isValidPrefix = (
  prefix: string,
): prefix is 'asset' | 'bundle' | 'gamepass' | 'devproduct' => {
  const normalized = prefix.toLowerCase();
  return (
    normalized === 'asset' ||
    normalized === 'bundle' ||
    normalized === 'gamepass' ||
    normalized === 'devproduct'
  );
};

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

  const raw = (productKeyBreakdownValue ?? '').toString();
  const [maybePrefix, maybeId] = raw.split('_');

  const normalizedPrefix = (maybePrefix || '').toLowerCase();
  const hasValidPrefix = isValidPrefix(normalizedPrefix);

  const idPart = hasValidPrefix ? maybeId : maybePrefix;
  const parsedId = Number(idPart);
  if (!Number.isFinite(parsedId)) {
    return undefined;
  }

  return {
    subtype: hasValidPrefix ? normalizedPrefix : undefined,
    itemId: parsedId,
  };
};

export default parseProductKeyBreakdownValue;
