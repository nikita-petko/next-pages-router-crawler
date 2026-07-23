import { useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ArrowBackIcon, Divider, Grid, Typography, Button } from '@rbx/ui';
import { FROM_MANAGED_PRICING } from '@modules/managed-pricing/constants/links';
import {
  Item,
  itemFullNameKeys,
  itemTypeToPath,
  itemTypeToSingularNameKeys,
} from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FROM_SHOP } from '@modules/shops/constants';
import {
  badgeItemFeatureManager,
  developerProductItemFeatureManager,
  experienceSubscriptionFeatureManager,
} from '../associatedItemFeatureManagers';
import AssociatedItemStatus from './AssociatedItemStatus';

const getReturnToManagedPricingLink = (universeId: number) =>
  dashboard.getManagedPricingUrl(universeId, 'manage-items');

const getReturnToShopLink = (universeId: number) =>
  dashboard.getPersonalizedShopsUrl(universeId, 'item-catalog');

const AssociatedItemLeftNavigation = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { classes: styles } = useLeftNavigationStyles();

  const { universeId } = useUniverseId();

  const currentItemType = useMemo(() => {
    if (router.pathname.includes(itemTypeToPath[Item.ExperienceSubscription])) {
      return Item.ExperienceSubscription;
    }
    if (router.pathname.includes(itemTypeToPath[Item.Badge])) {
      return Item.Badge;
    }
    if (router.pathname.includes(itemTypeToPath[Item.GamePass])) {
      return Item.GamePass;
    }
    if (router.pathname.includes(itemTypeToPath[Item.DeveloperProduct])) {
      return Item.DeveloperProduct;
    }
    return undefined;
  }, [router.pathname]);

  const getCurrentFeatures = useMemo(() => {
    if (currentItemType === Item.DeveloperProduct) {
      return developerProductItemFeatureManager.getAllFeatures();
    }
    if (currentItemType === Item.ExperienceSubscription) {
      return experienceSubscriptionFeatureManager.getAllFeatures();
    }
    return badgeItemFeatureManager.getAllFeatures();
  }, [currentItemType]);

  const features = getCurrentFeatures.filter(
    (feature) => feature.isEnabledOnSettings?.(settings) ?? true,
  );

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );

  const fromManagedPricing = router.query.from === FROM_MANAGED_PRICING;
  const fromShop = router.query.from === FROM_SHOP;

  const backLinkPath = useMemo(() => {
    if (fromManagedPricing) {
      return getReturnToManagedPricingLink(universeId ?? 0);
    }
    if (fromShop) {
      return getReturnToShopLink(universeId ?? 0);
    }
    if (currentItemType === Item.GamePass) {
      return dashboard.getMonetizationPassesUrl(universeId ?? 0);
    }
    if (currentItemType === Item.DeveloperProduct) {
      return dashboard.getMonetizationDeveloperProductsUrl(universeId ?? 0);
    }

    return `/dashboard/creations/experiences/${universeId ?? 0}/associated-items?activeTab=${currentItemType}`;
  }, [currentItemType, fromManagedPricing, fromShop, universeId]);

  const backLinkText = useMemo(() => {
    if (fromManagedPricing) {
      return translate('Action.BackToManagedPricing');
    }
    if (fromShop) {
      return translate('Action.BackToShop');
    }
    return translate('Action.BackToItemType', {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      itemType: translate(itemFullNameKeys[currentItemType as Item]),
    });
  }, [currentItemType, fromManagedPricing, fromShop, translate]);

  return (
    <>
      <Grid item container direction='column'>
        <Button
          component={NextLink}
          size='small'
          color='primary'
          className={styles.backButton}
          startIcon={<ArrowBackIcon />}
          href={backLinkPath}>
          {backLinkText}
        </Button>
        <Typography className={styles.sidebarHeaderText} variant='overline'>
          {/* oxlint-disable-next-line typescript/no-unsafe-type-assertion */}
          {translate(itemTypeToSingularNameKeys[currentItemType as Item])}
        </Typography>
        <AssociatedItemStatus currentItemType={currentItemType} />
        <Divider className={styles.divider} />
      </Grid>
      <Grid item container direction='column'>
        <Features
          features={features}
          activeFeature={activeFeature}
          title=''
          name={currentItemType}
        />
      </Grid>
    </>
  );
};

export default withTranslation(AssociatedItemLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Navigation,
]);
