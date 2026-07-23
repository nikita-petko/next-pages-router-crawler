/**
 * Layer 2: Combined Page Config Aware Analytics Provider
 *
 * This provider composes all the page-config-aware context providers together.
 * It consumes raw query params from Layer 1 and applies page-config-based defaults
 * for all analytics contexts (date range, breakdown, granularity, filters, annotations).
 *
 * Usage:
 * - Wrap this around page content inside CreatorAnalyticsLayout
 * - Pass the page config to enable defaulting based on that config
 * - Inner components will receive the same context types they currently expect
 *
 * This provider is now the source of truth for analytics contexts. Legacy wrapper providers
 * (ExperienceAnalyticsCurrentDateRangeBundleProvider, UniverseAnalyticsCurrentFilterBundleProvider,
 * ExperienceAnalyticsCurrentAnnotationsBundleProvider) have been removed, while their hooks and
 * contexts remain for compatibility.
 */

import type { FC } from 'react';
import React from 'react';
import type { CreatorAnalyticsPageSurfaceConfig } from '../../types/RAQIV2PageConfig';
import { PageConfigAwareAnnotationProvider } from './PageConfigAwareAnnotationProvider';
import { PageConfigAwareBreakdownProvider } from './PageConfigAwareBreakdownProvider';
import { PageConfigAwareDateRangeProvider } from './PageConfigAwareDateRangeProvider';
import { PageConfigAwareFilterProvider } from './PageConfigAwareFilterProvider';
import { PageConfigAwareGranularityProvider } from './PageConfigAwareGranularityProvider';
import { PageConfigAwareSingleDateProvider } from './PageConfigAwareSingleDateProvider';

type PageConfigAwareAnalyticsProviderProps = {
  children: React.ReactNode;
  config: CreatorAnalyticsPageSurfaceConfig;
};

/**
 * Combined provider that applies page-config-based defaults to all analytics contexts.
 *
 * This is the main component for Layer 2 of the analytics context architecture.
 * It should be placed inside the page layout after Layer 1 (RawAnalyticsQueryParamsProvider).
 */
export const PageConfigAwareAnalyticsProvider: FC<PageConfigAwareAnalyticsProviderProps> = ({
  children,
  config,
}) => {
  return (
    <PageConfigAwareSingleDateProvider config={config}>
      <PageConfigAwareDateRangeProvider config={config}>
        <PageConfigAwareGranularityProvider config={config}>
          <PageConfigAwareBreakdownProvider config={config}>
            <PageConfigAwareFilterProvider config={config}>
              <PageConfigAwareAnnotationProvider config={config}>
                {children}
              </PageConfigAwareAnnotationProvider>
            </PageConfigAwareFilterProvider>
          </PageConfigAwareBreakdownProvider>
        </PageConfigAwareGranularityProvider>
      </PageConfigAwareDateRangeProvider>
    </PageConfigAwareSingleDateProvider>
  );
};

export default PageConfigAwareAnalyticsProvider;
