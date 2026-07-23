import React, { ReactNode } from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { FeatureFlagsProvider } from '@modules/feature-flags/context/FeatureFlagsProvider';
import RAQIV2ClientProvider from '../context/RAQIV2ClientProvider';
import { LocaleProvider } from '../context/LocaleProvider';
import { LocaleMapProvider } from '../context/LocaleMapProvider';
import { CountryMapProvider } from '../context/CountryMapProvider';
import { ThumbnailUrlsMapProvider } from '../context/ThumbnailUrlsMapProvider';
import { UniverseNameMapProvider } from '../context/UniverseNameMapProvider';
import AnalyticsBenchmarkProvider from '../context/AnalyticsBenchmarkProvider';
import AnalyticsTabLayoutBundleProvider from '../context/AnalyticsTabLayoutBundleProvider';

export const SharedAnalyticsPageProviders = ({
  children,
  universeId,
}: {
  children: React.ReactNode;
  universeId?: number;
}) => {
  return (
    <Authenticated>
      <FeatureFlagsProvider
        namespaces={[FeatureFlagNamespace.Analytics]}
        evaluationContext={{ universeId }}>
        <LocaleProvider>
          <LocaleMapProvider>
            <CountryMapProvider>
              <ThumbnailUrlsMapProvider>
                <UniverseNameMapProvider>
                  <RAQIV2ClientProvider>
                    <AnalyticsBenchmarkProvider>
                      <AnalyticsTabLayoutBundleProvider>
                        {children}
                      </AnalyticsTabLayoutBundleProvider>
                    </AnalyticsBenchmarkProvider>
                  </RAQIV2ClientProvider>
                </UniverseNameMapProvider>
              </ThumbnailUrlsMapProvider>
            </CountryMapProvider>
          </LocaleMapProvider>
        </LocaleProvider>
      </FeatureFlagsProvider>
    </Authenticated>
  );
};

export default function getSharedAnalyticsWrapper(page: NonNullable<ReactNode>) {
  return <SharedAnalyticsPageProviders>{page}</SharedAnalyticsPageProviders>;
}
