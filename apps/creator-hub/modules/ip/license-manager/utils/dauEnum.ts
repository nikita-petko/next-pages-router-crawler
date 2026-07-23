import { DauBucket, LifetimeVisitBucket } from '@rbx/client-content-licensing-api/v1';
import type { MinimumDAUValue } from '../ipListings/components/licenseFormTypes';
import { MinimumDAU } from '../ipListings/components/licenseFormTypes';

/**
 * Convert a minimum DAU internal representation to the API enum value.
 * Internally we represent the minDau as three values, but the API represents it
 * as two values + undefined (which is less convenient for the frontend).
 *
 * Returns only Small or Large (or undefined for NoRequirement).
 */
export const convertMinDauToEnum = (minDau: MinimumDAUValue): DauBucket | undefined => {
  if (minDau === MinimumDAU.NoRequirement) {
    return undefined;
  }
  return minDau as DauBucket;
};

/**
 * Get DAU minimum value, used for when displaying license information.
 */
export const getDauLicenseLabelFromEnum = (dauEnum?: DauBucket): string => {
  switch (dauEnum) {
    case DauBucket.Small:
      return 'Label.DauLow';
    case DauBucket.Large:
      return 'Label.DauHigh';
    case DauBucket.None:
    case undefined:
      return 'Label.NoRequirement';
    default:
      return 'Label.Unknown';
  }
};

/**
 * Get a DAU range label for an agreement candidate or agreement target.
 */
export const getCreationDauRangeLabelFromEnum = (dauEnum?: DauBucket): string => {
  switch (dauEnum) {
    case DauBucket.None:
      return 'Label.DauUltraLowRange';
    case DauBucket.Small:
      return 'Label.DauLowRange';
    case DauBucket.Large:
      return 'Label.DauHighRange';
    default:
      return 'Label.Unknown';
  }
};

/**
 * Get Creator lifetime visits range label for an agreement candidate or agreement target.
 */
export const getLifetimeVisitsRangeLabelFromEnum = (
  lifetimeVisitsBucket?: LifetimeVisitBucket,
): string => {
  switch (lifetimeVisitsBucket) {
    case LifetimeVisitBucket.Small:
      return 'Label.LifetimeVisitsRangeSmall';
    case LifetimeVisitBucket.Medium:
      return 'Label.LifetimeVisitsRangeMedium';
    case LifetimeVisitBucket.Large:
      return 'Label.LifetimeVisitsRangeHigh';
    default:
      return 'Label.Unknown';
  }
};
