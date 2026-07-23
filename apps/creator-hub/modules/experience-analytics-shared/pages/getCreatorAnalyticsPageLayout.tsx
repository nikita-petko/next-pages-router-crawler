import type { ReactNode } from 'react';
import React from 'react';
import { CreatorAnnotationsClientProvider } from '@modules/charts-generic/context/annotations/CreatorAnnotationsClientProvider';
import { AnalyticsContextLayerOuterProvider } from '../context/AnalyticsContextLayerProvider';
import { BreakdownColorConsistencyProvider } from '../context/BreakdownColorConsistencyContext';
import { CreatorResourceProvider } from '../context/resourceContexts/CreatorResourceProvider';
import getSharedAnalyticsWrapper from './getSharedAnalyticsWrapper';

const CreatorAnalyticsPageLayoutProviders = ({ children }: { children: React.ReactNode }) => {
  // TODO(gperkins@20260115): Pull CreatorResourceProvider in to be a PageConfigAware provider DSA-5204
  return (
    <AnalyticsContextLayerOuterProvider>
      <BreakdownColorConsistencyProvider>
        <CreatorResourceProvider>
          <CreatorAnnotationsClientProvider>{children}</CreatorAnnotationsClientProvider>
        </CreatorResourceProvider>
      </BreakdownColorConsistencyProvider>
    </AnalyticsContextLayerOuterProvider>
  );
};

export default function getCreatorAnalyticsPageLayout(page: NonNullable<ReactNode>) {
  return getSharedAnalyticsWrapper(
    <CreatorAnalyticsPageLayoutProviders>{page}</CreatorAnalyticsPageLayoutProviders>,
  );
}
