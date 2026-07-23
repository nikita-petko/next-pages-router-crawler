import type { ReactNode } from 'react';
import React from 'react';
import Authenticated from '@modules/authentication/Authenticated';
import AnalyticsBenchmarkProvider from '../context/AnalyticsBenchmarkProvider';
import AnalyticsTabLayoutBundleProvider from '../context/AnalyticsTabLayoutBundleProvider';
import { CountryMapProvider } from '../context/CountryMapProvider';
import { LocaleMapProvider } from '../context/LocaleMapProvider';
import { LocaleProvider } from '../context/LocaleProvider';
import RAQIV2ClientProvider from '../context/RAQIV2ClientProvider';
import { ThumbnailUrlsMapProvider } from '../context/ThumbnailUrlsMapProvider';
import { UniverseNameMapProvider } from '../context/UniverseNameMapProvider';

export const SharedAnalyticsPageProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticated>
      <LocaleProvider>
        <LocaleMapProvider>
          <CountryMapProvider>
            <ThumbnailUrlsMapProvider>
              <UniverseNameMapProvider>
                <RAQIV2ClientProvider>
                  <AnalyticsBenchmarkProvider>
                    <AnalyticsTabLayoutBundleProvider>{children}</AnalyticsTabLayoutBundleProvider>
                  </AnalyticsBenchmarkProvider>
                </RAQIV2ClientProvider>
              </UniverseNameMapProvider>
            </ThumbnailUrlsMapProvider>
          </CountryMapProvider>
        </LocaleMapProvider>
      </LocaleProvider>
    </Authenticated>
  );
};

export default function getSharedAnalyticsWrapper(page: NonNullable<ReactNode>) {
  return <SharedAnalyticsPageProviders>{page}</SharedAnalyticsPageProviders>;
}
