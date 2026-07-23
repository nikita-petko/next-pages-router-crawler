import { useMemo } from 'react';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ArrowBackIcon, Divider, Grid, Typography, Button } from '@rbx/ui';
import { FROM_MANAGED_PRICING } from '@modules/managed-pricing/constants/links';
import { Item, itemTypeToSingularNameKeys } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { usePassId } from '@modules/monetization-shared/route/usePassId';
import { useUniverseId } from '@modules/monetization-shared/route/useUniverseId';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FROM_SHOP } from '@modules/shops/constants';
import AssociatedItemStatus from '../../../associatedItems/components/AssociatedItemStatus';
import { useCurrentPass } from '../../contexts/PassContext';
import passItemFeatureManager, {
  PassItemNavigationSectionTitleKeys,
} from './passItemFeatureManager';

const getReturnToManagedPricingLink = (universeId: number) =>
  dashboard.getManagedPricingUrl(universeId, 'manage-items');

const getReturnToShopLink = (universeId: number) =>
  dashboard.getPersonalizedShopsUrl(universeId, 'item-catalog');

const PassItemLeftNavigation = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { classes: styles } = useLeftNavigationStyles();
  const { passPromotionsStatus } = useCurrentPass();

  const { universeId } = useUniverseId();

  const { passId } = usePassId();

  const getCurrentFeatures = useMemo(() => {
    return passItemFeatureManager.getAllFeatures();
  }, []);

  const features = useMemo(
    () =>
      getCurrentFeatures
        .filter((feature) => feature.isEnabledOnSettings?.(settings) ?? true)
        .map((feature) => {
          if (feature.getExternalPath) {
            return {
              ...feature,
              getExternalPath: () => feature.getExternalPath?.(passId ?? 0) ?? '',
            };
          }
          return feature;
        }),
    [getCurrentFeatures, passId, settings],
  );

  const passFeatures = useMemo(
    () =>
      features.filter((feature) => {
        const isPromotion = feature.key === 'promotions';
        return !isPromotion || (isPromotion && passPromotionsStatus?.isEligible);
      }),
    [features, passPromotionsStatus],
  );

  const activeFeature = useMemo(
    () => passFeatures.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [passFeatures, router],
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
    return dashboard.getMonetizationPassesUrl(universeId ?? 0);
  }, [fromManagedPricing, fromShop, universeId]);

  const backLinkText = useMemo(() => {
    if (fromManagedPricing) {
      return translate('Action.BackToManagedPricing');
    }
    if (fromShop) {
      return translate('Action.BackToShop');
    }
    return translate('Action.BackToItemType', {
      itemType: translate('Label.GamePasses'),
    });
  }, [fromManagedPricing, fromShop, translate]);

  return (
    <div data-testid='pass-item-left-navigation'>
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
          {translate(itemTypeToSingularNameKeys[Item.GamePass])}
        </Typography>
        <AssociatedItemStatus currentItemType={Item.GamePass} />
        <Divider className={styles.divider} />
      </Grid>
      {[PassItemNavigationSectionTitleKeys[0]].map(
        (titleKey) =>
          passFeatures.some((feature) => feature.sectionTitleKey === titleKey) && (
            <Grid key={`navigation-section-${titleKey}`} item container direction='column'>
              <Features
                key={`feature-${titleKey}`}
                features={passFeatures.filter((feature) => feature.sectionTitleKey === titleKey)}
                activeFeature={activeFeature}
                title=''
                name='passes'
              />
            </Grid>
          ),
      )}
    </div>
  );
};

export default withTranslation(PassItemLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
]);
