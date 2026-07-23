import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React, { Fragment, useEffect, useMemo } from 'react';
import {
  RobloxItemConfigurationApiBundleDetailsBundleTypeEnum,
  RobloxItemConfigurationApiMarketplaceItemCannotBePublishedReasonEnum,
} from '@rbx/client-itemconfiguration/v1';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ArrowBackIcon, Divider, Grid, Button } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import type { TSettings } from '@modules/settings/SettingsProvider/settingsHelpers';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import getRouteToAvatarItemCreationsPage from '../../avatarItem/utils/avatarMenuNavigationUtils';
import useCurrentItem from '../../itemConfiguration/hooks/useCurrentItem';
import {
  getValidTimedOptionsTypes,
  getValidWearTimeTypes,
  mapBundleTypeToString,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import { getIsDurableType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import bundleFeatureManager, { BundleNavigationSectionTitleKeys } from './bundleFeatureManager';

const BundleLeftNavigation: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { marketplaceItemDetails } = useCurrentItem();

  useEffect(() => {
    getValidWearTimeTypes();
    getValidTimedOptionsTypes();
  }, []);

  const allFeatures = bundleFeatureManager.getAllFeatures();
  const bundleTypeEnum =
    marketplaceItemDetails?.item?.marketplaceItemDetails?.bundleDetails?.bundleType;

  const features = allFeatures.reduce((enabledFeatures, currentFeature) => {
    if (currentFeature.isEnabledOnSettings?.(settings) ?? true) {
      let feature = currentFeature;
      if (currentFeature.getExternalPath) {
        feature = {
          ...currentFeature,
          getExternalPath: () =>
            currentFeature.getExternalPath
              ? currentFeature.getExternalPath(parseInt(router.query.id as string, 10))
              : '',
        };
      }

      // Don't show variants tab in left menu if the bundle type is not valid
      if (currentFeature.key === 'variants') {
        if (getIsDurableType(undefined, bundleTypeEnum)) {
          enabledFeatures.push(feature);
        }
      }
      // Don't show analytics tab if the item is IEC
      else if (currentFeature.key === 'analytics') {
        if (
          marketplaceItemDetails?.item?.cannotBePublishedReason !==
          RobloxItemConfigurationApiMarketplaceItemCannotBePublishedReasonEnum.NUMBER_2
        ) {
          enabledFeatures.push(feature);
        }
      } else {
        enabledFeatures.push(feature);
      }
    }
    return enabledFeatures;
  }, [] as Feature[]);

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );
  const { classes: styles } = useLeftNavigationStyles();

  const backToCreationsPageLink = useMemo(() => {
    const groupId = marketplaceItemDetails?.item?.creator?.group?.groupId;
    const bundleType = mapBundleTypeToString(
      marketplaceItemDetails?.item?.marketplaceItemDetails?.bundleDetails?.bundleType ??
        RobloxItemConfigurationApiBundleDetailsBundleTypeEnum.NUMBER_0,
    );
    return getRouteToAvatarItemCreationsPage(bundleType, groupId);
  }, [marketplaceItemDetails]);

  return (
    <>
      <Grid item container direction='column'>
        <Link className={styles.backButton} href={backToCreationsPageLink}>
          <Button color='primary' size='small' startIcon={<ArrowBackIcon />}>
            {translate('Action.BackToAvatarItems')}
          </Button>
        </Link>
        <Divider className={styles.divider} />
      </Grid>
      {BundleNavigationSectionTitleKeys.map(
        (titleKey) =>
          features.some((feature) => feature.sectionTitleKey === titleKey) && (
            <Grid key={`bundle-navigation-section-${titleKey}`} item container direction='column'>
              <Features
                key={`feature-${titleKey}`}
                features={features.filter((feature) => feature.sectionTitleKey === titleKey)}
                activeFeature={activeFeature}
                title={translate(titleKey)}
              />
            </Grid>
          ),
      )}
    </>
  );
};

export default withTranslation(BundleLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.Variants,
]);
