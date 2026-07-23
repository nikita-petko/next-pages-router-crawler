import { Feature, NavigationFeatureManager } from '@modules/navigation/feature';

const lookFeatureManager = new NavigationFeatureManager('/dashboard/creations/look/[id]');

const configureFeature: Feature = {
  key: 'configure',
  nameKey: 'Heading.Configure',
  path: '/configure',
  sectionTitleKey: 'Heading.Details',
};

lookFeatureManager.addFeature(configureFeature);

export const LookNavigationSectionTitleKeys = ['Heading.Details', 'Heading.RelatedLinks'];
export default lookFeatureManager;
