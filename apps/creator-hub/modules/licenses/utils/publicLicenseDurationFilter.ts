import { LicenseDurationType } from '@rbx/client-content-licensing-api/v1';

export type PublicLicenseDurationFilter = 'all' | LicenseDurationType;

/**
 * CEL-style filter for `listPublicLicenses` / `listPublicLicensesUnauthenticated`.
 * Clauses use `&&`; duration uses snake_case name and enum value (e.g. TimeLimited, Perpetual).
 * Omit the duration clause entirely for "all" (empty string).
 */
export function buildPublicLicensesCatalogFilter(
  durationFilter: PublicLicenseDurationFilter,
): string {
  if (durationFilter === 'all') {
    return '';
  }
  if (durationFilter === LicenseDurationType.TimeLimited) {
    return 'license_duration_type=TimeLimited';
  }
  return 'license_duration_type=Perpetual';
}
