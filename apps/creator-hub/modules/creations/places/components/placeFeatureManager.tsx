import React from 'react';
import { Feature, NavigationFeatureManager } from '@modules/navigation/feature';
import { TSettings } from '@modules/settings';
import { OpenInNewIcon } from '@rbx/ui';
import PlaceCustomSettings from '../interface/PlaceCustomSettings';

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
  nameKey: 'Heading.Thumbnails',
  path: '/thumbnails',
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
placeFeatureManager.addFeature(placeAccessFeature);
placeFeatureManager.addFeature(versionHistoryFeature);
placeFeatureManager.addFeature(placePermissionsFeature);
placeFeatureManager.addFeature(editInStudioLink);

export default placeFeatureManager;
