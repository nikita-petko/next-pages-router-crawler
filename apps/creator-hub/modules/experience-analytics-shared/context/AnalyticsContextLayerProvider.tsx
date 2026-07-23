/**
 * Analytics Context Layer Provider
 *
 * This component wires the two-layer analytics context architecture:
 *   - Layer 1: RawAnalyticsQueryParamsProvider (parses query params without defaults)
 *   - Layer 2: PageConfigAwareAnalyticsProvider (applies page-config-based defaults)
 */

import type { FC } from 'react';
import React from 'react';
import type { CreatorAnalyticsPageSurfaceConfig } from '../types/RAQIV2PageConfig';
import { PageConfigAwareAnalyticsProvider } from './pageConfigAware/PageConfigAwareAnalyticsProvider';
import { RawAnalyticsQueryParamsProvider } from './rawQueryParams/RawAnalyticsQueryParamsProvider';

type AnalyticsContextLayerOuterProviderProps = {
  children: React.ReactNode;
};

type AnalyticsContextLayerInnerProviderProps = {
  children: React.ReactNode;
  /**
   * The page surface config that drives defaults for date range, annotations, etc.
   * Use `defaultAnalyticsPageSurfaceConfig` when the page doesn't need specific analytics config.
   */
  config: CreatorAnalyticsPageSurfaceConfig;
};

/**
 * Outer provider for the analytics context layer.
 *
 * This should wrap the entire analytics page and provides Layer 1 (raw query params).
 *
 * Usage:
 * ```tsx
 * // In getCreatorAnalyticsPageLayout or similar
 * <AnalyticsContextLayerOuterProvider>
 *   <ExistingProviders> // These become no-ops or are replaced under the flag
 *     {page}
 *   </ExistingProviders>
 * </AnalyticsContextLayerOuterProvider>
 * ```
 */
export const AnalyticsContextLayerOuterProvider: FC<AnalyticsContextLayerOuterProviderProps> = ({
  children,
}) => {
  return <RawAnalyticsQueryParamsProvider>{children}</RawAnalyticsQueryParamsProvider>;
};

/**
 * Inner provider for the analytics context layer.
 *
 * This should wrap the page content inside the layout and provides Layer 2
 * (page-config-aware defaulting).
 *
 * Usage:
 * ```tsx
 * // In CreatorAnalyticsLayout or similar
 * <AnalyticsContextLayerInnerProvider config={pageConfig}>
 *   <PageContent />
 * </AnalyticsContextLayerInnerProvider>
 * ```
 */
export const AnalyticsContextLayerInnerProvider: FC<AnalyticsContextLayerInnerProviderProps> = ({
  children,
  config,
}) => {
  return (
    <PageConfigAwareAnalyticsProvider config={config}>{children}</PageConfigAwareAnalyticsProvider>
  );
};
