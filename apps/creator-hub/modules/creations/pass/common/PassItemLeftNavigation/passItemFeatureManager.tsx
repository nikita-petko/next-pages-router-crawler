import { OpenInNewIcon } from '@rbx/ui';
import { Item } from '@modules/miscellaneous/common';
import { getUrlForItemType } from '@modules/miscellaneous/urls';
import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import type Feature from '@modules/navigation/feature/interfaces/Feature';

const passItemFeatureManager = new NavigationFeatureManager(
  '/dashboard/creations/experiences/[id]/passes',
);

export const basicSettings: Feature = {
  key: 'basicSettings',
  nameKey: 'Heading.BasicSettings',
  path: '/[passId]/configure',
  sectionTitleKey: 'Heading.Details',
};

const sales: Feature = {
  key: 'sales',
  nameKey: 'Heading.Sales',
  path: '/[passId]/sales',
  sectionTitleKey: 'Heading.Details',
};

const promotions: Feature = {
  key: 'promotions',
  nameKey: 'Heading.Promotions',
  path: '/[passId]/promotions',
  sectionTitleKey: 'Heading.Details',
  isEnabledOnSettings: () => process.env.buildTarget !== 'luobu',
};

const myInventory: Feature = {
  adornment: <OpenInNewIcon fontSize='small' />,
  getExternalPath: (passId: number) => getUrlForItemType(Item.GamePass, passId) ?? '',
  key: 'myInventory',
  nameKey: 'Heading.MyInventory',
  path: '',
  sectionTitleKey: 'Heading.RelatedLinks',
  isEnabledOnSettings: () => process.env.buildTarget !== 'luobu',
};

passItemFeatureManager.addFeature(basicSettings);
passItemFeatureManager.addFeature(sales);
passItemFeatureManager.addFeature(promotions);
passItemFeatureManager.addFeature(myInventory);

export const PassItemNavigationSectionTitleKeys = ['Heading.Details', 'Heading.RelatedLinks'];
export default passItemFeatureManager;
