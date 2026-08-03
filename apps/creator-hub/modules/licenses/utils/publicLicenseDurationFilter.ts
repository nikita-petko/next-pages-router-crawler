import type { LicenseDurationType, LicenseType } from '@rbx/client-content-licensing-api/v1';

export type PublicLicenseDurationFilter = 'all' | LicenseDurationType;
export type PublicLicenseTypeFilter = 'all' | LicenseType;

export interface PublicLicenseCatalogFilters {
  durationType: PublicLicenseDurationFilter;
  licenseType: PublicLicenseTypeFilter;
}

/**
 * CEL-style filter for `listPublicLicenses` / `listPublicLicensesUnauthenticated`.
 * Clauses use `&&` and omit dimensions whose selection is "all".
 */
export function buildPublicLicensesCatalogFilter({
  durationType,
  licenseType,
}: PublicLicenseCatalogFilters): string {
  const clauses: string[] = [];

  if (durationType !== 'all') {
    clauses.push(`license_duration_type=${durationType}`);
  }

  if (licenseType !== 'all') {
    clauses.push(`license_type=${licenseType}`);
  }

  return clauses.join(' && ');
}

export type PublicLicensesTableAnalyticsContext = {
  durationTypeFilter: string;
  licenseTypeFilter: string;
  activeFilterCount: number;
  catalogFilter: string;
};

/** Analytics context for public licenses list filter interactions and empty states. */
export function getPublicLicensesTableAnalyticsContext({
  durationType,
  licenseType,
  enableLicenseTypeFilter,
}: PublicLicenseCatalogFilters & {
  enableLicenseTypeFilter: boolean;
}): PublicLicensesTableAnalyticsContext {
  const effectiveLicenseType = enableLicenseTypeFilter ? licenseType : 'all';
  const catalogFilter = buildPublicLicensesCatalogFilter({
    durationType,
    licenseType: effectiveLicenseType,
  });
  const hasDurationFilter = durationType !== 'all';
  const hasLicenseTypeFilter = enableLicenseTypeFilter && licenseType !== 'all';

  return {
    durationTypeFilter: hasDurationFilter ? durationType : 'all',
    licenseTypeFilter: hasLicenseTypeFilter ? licenseType : 'all',
    activeFilterCount: [hasDurationFilter, hasLicenseTypeFilter].filter(Boolean).length,
    catalogFilter: catalogFilter || 'all',
  };
}

/** True when any catalog filter dimension is narrowed from "all". */
export function hasActivePublicLicenseCatalogFilters({
  durationType,
  licenseType,
  enableLicenseTypeFilter,
}: PublicLicenseCatalogFilters & {
  enableLicenseTypeFilter: boolean;
}): boolean {
  return durationType !== 'all' || (enableLicenseTypeFilter && licenseType !== 'all');
}
