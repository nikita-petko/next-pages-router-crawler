import { OpenInNewIcon } from '@rbx/ui';
import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import VideosNewChip from '../../placeThumbnails/components/VideosNewChip';
import type PlaceCustomSettings from '../interface/PlaceCustomSettings';

export type PlaceFeatureSettings = TSettings & PlaceCustomSettings;

const placeFeatureManager = new NavigationFeatureManager<PlaceFeatureSettings>(
  '/dashboard/creations/experiences/[id]/places/[placeId]',
);
export const PlaceLeftNavigationSectionTitleKeys = ['Heading.Details', 'Heading.Other'];

const configureFeature: Feature<PlaceFeatureSettings> = {
  key: 'basicSettings',
  nameKey: 'Heading.BasicSettings',
  path: '/configure',
  sectionTitleKey: 'Heading.Details',
};

const placeIconFeature: Feature<PlaceFeatureSettings> = {
  key: 'icon',
  nameKey: 'Heading.Icon',
  path: '/icon',
  sectionTitleKey: 'Heading.Details',
};

const placeThumbnailsFeature: Feature<PlaceFeatureSettings> = {
  key: 'thumbnails',
  nameKey: 'Heading.PlaceThumbnails',
  path: '/thumbnails',
  sectionTitleKey: 'Heading.Details',
};

const placeVideosFeature: Feature<PlaceFeatureSettings> = {
  adornment: <VideosNewChip />,
  key: 'videos',
  nameKey: 'Heading.PlaceVideos',
  path: '/videos',
  sectionTitleKey: 'Heading.Details',
};

const placeAccessFeature: Feature<PlaceFeatureSettings> = {
  key: 'access',
  nameKey: 'Heading.Access',
  path: '/access',
  sectionTitleKey: 'Heading.Details',
};

const versionHistoryFeature: Feature<PlaceFeatureSettings> = {
  key: 'versionHistory',
  nameKey: 'Heading.VersionHistory',
  path: '/version-history',
  sectionTitleKey: 'Heading.Details',
};

const placePermissionsFeature: Feature<PlaceFeatureSettings> = {
  key: 'permissions',
  nameKey: 'Heading.Permissions',
  path: '/permissions',
  sectionTitleKey: 'Heading.Details',
};

const editInStudioLink: Feature<PlaceFeatureSettings> = {
  adornment: <OpenInNewIcon fontSize='small' />,
  key: 'editInStudio',
  nameKey: 'Heading.EditInStudio',
  path: '',
  sectionTitleKey: 'Heading.Other',
};

placeFeatureManager.addFeature(configureFeature);
placeFeatureManager.addFeature(placeIconFeature);
placeFeatureManager.addFeature(placeThumbnailsFeature);
placeFeatureManager.addFeature(placeVideosFeature);
placeFeatureManager.addFeature(placeAccessFeature);
placeFeatureManager.addFeature(versionHistoryFeature);
placeFeatureManager.addFeature(placePermissionsFeature);
placeFeatureManager.addFeature(editInStudioLink);

export default placeFeatureManager;
