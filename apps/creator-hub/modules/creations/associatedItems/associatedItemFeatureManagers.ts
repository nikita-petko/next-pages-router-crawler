import NavigationFeatureManager from '@modules/navigation/feature/implementations/NavigationFeatureManager';
import type Feature from '@modules/navigation/feature/interfaces/Feature';

export const badgeItemFeatureManager = new NavigationFeatureManager(
  '/dashboard/creations/experiences/[id]/badges/[badgeId]',
);

export const developerProductItemFeatureManager = new NavigationFeatureManager(
  '/dashboard/creations/experiences/[id]/developer-products/[productId]',
);

export const experienceSubscriptionFeatureManager = new NavigationFeatureManager(
  '/dashboard/creations/experiences/[id]/experience-subscriptions/[subscriptionId]',
);

const overviewFeature: Feature = {
  key: 'overview',
  nameKey: 'Heading.Overview',
  path: '/overview',
};

const badgesConfigureFeature: Feature = {
  key: 'badgeBasisSettings',
  nameKey: 'Heading.BasicSettings',
  path: '/configure',
};

const developerProductsConfigureFeature: Feature = {
  key: 'developerProductBasisSettings',
  nameKey: 'Heading.BasicSettings',
  path: '/configure',
};

const experienceSubscriptionsConfigureFeature: Feature = {
  key: 'experienceSubscriptionUpdateSubscription',
  nameKey: 'Heading.UpdateSubscription',
  path: '/configure',
};

badgeItemFeatureManager.addFeature(overviewFeature);
badgeItemFeatureManager.addFeature(badgesConfigureFeature);

developerProductItemFeatureManager.addFeature(developerProductsConfigureFeature);

experienceSubscriptionFeatureManager.addFeature(experienceSubscriptionsConfigureFeature);
