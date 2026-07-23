import React from 'react';
import { Feature, NavigationFeatureManager } from '@modules/navigation/feature';
import { OpenInNewIcon } from '@rbx/ui';
import { urls } from '@modules/miscellaneous/common';

const {
  creatorHub: { creatorStore },
} = urls;
const assetFeatureManager = new NavigationFeatureManager('/dashboard/creations/catalog/[id]');

const configureFeature: Feature = {
  key: 'configure',
  nameKey: 'Heading.Configure',
  path: '/configure',
  sectionTitleKey: 'Heading.Details',
};

const openInMarketplace: Feature = {
  adornment: <OpenInNewIcon fontSize='small' />,
  getExternalPath: creatorStore.getAssetUrl,
  key: 'openInMarketplace',
  nameKey: 'Heading.OpenInCreatorStore',
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
  sectionTitleKey: 'Heading.Details',
};

const variantsFeature: Feature = {
  key: 'variants',
  nameKey: 'Heading.Variants',
  path: '/variants',
  sectionTitleKey: 'Heading.Details',
};

assetFeatureManager.addFeature(configureFeature);
assetFeatureManager.addFeature(openInMarketplace);
assetFeatureManager.addFeature(analyticsFeature);
assetFeatureManager.addFeature(variantsFeature);

export const AssetNavigationSectionTitleKeys = ['Heading.Details', 'Heading.RelatedLinks'];
export default assetFeatureManager;
