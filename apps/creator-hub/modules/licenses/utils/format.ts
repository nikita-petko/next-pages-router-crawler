import { numberFormatter } from '@rbx/core';

export const formatDauEligibility = (dauEligibility?: number | null): string => {
  if (dauEligibility === null || dauEligibility === undefined || dauEligibility < 0) {
    return '0';
  }
  return numberFormatter(dauEligibility, 'decimal').toString();
};

/**
 * Formats the royalty rate aka revenue rate of a license into a percentage
 * eg '5%' (string)
 */
export const formatRoyaltyRate = (royaltyRate?: number | null): string => {
  if (royaltyRate === null || royaltyRate === undefined) {
    return numberFormatter(0, 'percent').toString();
  }
  return numberFormatter(royaltyRate / 100, 'percent').toString();
};
