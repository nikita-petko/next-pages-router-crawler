import { OpenInNewIcon } from '@rbx/ui';
import { creatorHub, www } from '@modules/miscellaneous/urls';
import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import type Feature from '@modules/navigation/feature/interfaces/Feature';

const { dashboard, creatorStore } = creatorHub;
const developerItemFeatureManager = new NavigationFeatureManager(
  `${dashboard.configureCreatorStoreItemBasePath}[id]`,
);

export const versionHistoryFeature: Feature = {
  key: 'versionHistory',
  nameKey: 'Heading.VersionHistory',
  path: '/version-history',
  sectionTitleKey: 'Heading.Details',
};

const configureFeature: Feature = {
  key: 'configure',
  nameKey: 'Heading.Configure',
  path: '/configure',
  sectionTitleKey: 'Heading.Details',
};

export const permissionsFeature: Feature = {
  key: 'permissions',
  nameKey: 'Heading.Permissions',
  path: '/permissions',
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

export const openInExperience: Feature = {
  adornment: <OpenInNewIcon fontSize='small' />,
  getExternalPath: (_id, rootPlaceId) => {
    return www.getGameDetailsUrl(rootPlaceId);
  },
  key: 'openInExperience',
  nameKey: 'Action.OpenInExperience',
  path: '',
  sectionTitleKey: 'Heading.RelatedLinks',
};

developerItemFeatureManager.addFeature(configureFeature);
developerItemFeatureManager.addFeature(permissionsFeature);
developerItemFeatureManager.addFeature(openInMarketplace);
developerItemFeatureManager.addFeature(openInExperience);
developerItemFeatureManager.addFeature(versionHistoryFeature);

export const DeveloperItemNavigationSectionTitleKeys = ['Heading.Details', 'Heading.RelatedLinks'];
export default developerItemFeatureManager;
