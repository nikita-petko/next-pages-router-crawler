import React from 'react';
import { Feature, NavigationFeatureManager } from '@modules/navigation/feature';
import { OpenInNewIcon } from '@rbx/ui';
import { urls } from '@modules/miscellaneous/common';

const {
  www: { getBundleUrl },
} = urls;
const bundleFeatureManager = new NavigationFeatureManager('/dashboard/creations/bundle/[id]');
const configureFeature: Feature = {
  key: 'configure',
  nameKey: 'Heading.Configure',
  path: '/configure',
  sectionTitleKey: 'Heading.Details',
};

const openInMarketplace: Feature = {
  adornment: <OpenInNewIcon fontSize='small' />,
  getExternalPath: getBundleUrl,
  key: 'openInMarketplace',
  nameKey: 'Heading.OpenInMarketplace',
  path: '',
  sectionTitleKey: 'Heading.RelatedLinks',
  isEnabledOnSettings: () => process.env.buildTarget !== 'luobu',
};

const analyticsFeature: Feature = {
  key: 'analytics',
  nameKey: 'Heading.Analytics',
  path: '/analytics',
  query: {
    rangeType: 'Last7Days',
  },
  sectionTitleKey: 'Heading.RelatedLinks',
};

const variantsFeature: Feature = {
  key: 'variants',
  nameKey: 'Heading.Variants',
  path: '/variants',
  sectionTitleKey: 'Heading.Details',
};

bundleFeatureManager.addFeature(configureFeature);
bundleFeatureManager.addFeature(openInMarketplace);
bundleFeatureManager.addFeature(analyticsFeature);
bundleFeatureManager.addFeature(variantsFeature);

export const BundleNavigationSectionTitleKeys = ['Heading.Details', 'Heading.RelatedLinks'];
export default bundleFeatureManager;
