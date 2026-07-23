import React, { Fragment, FunctionComponent, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Feature } from '@modules/navigation/feature';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ArrowBackIcon, Divider, Grid, Button } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import { TSettings, useSettings } from '@modules/settings';
import {
  RobloxItemConfigurationApiAssetDetailsAssetTypeEnum,
  RobloxItemConfigurationApiMarketplaceItemCannotBePublishedReasonEnum,
} from '@rbx/client-itemconfiguration/v1';
import { getIsDurableType } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemHelper';
import {
  getValidTimedOptionsTypes,
  getValidWearTimeTypes,
  mapAssetTypeToString,
} from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';
import getRouteToAvatarItemCreationsPage from '../../avatarItem/utils/avatarMenuNavigationUtils';
import assetFeatureManager, { AssetNavigationSectionTitleKeys } from './assetFeatureManager';
import AssetStatus from './AssetStatus';
import useCurrentItem from '../../itemConfiguration/hooks/useCurrentItem';

const AssetLeftNavigation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { marketplaceItemDetails } = useCurrentItem();

  useEffect(() => {
    getValidWearTimeTypes();
    getValidTimedOptionsTypes();
  }, []);

  const allFeatures = assetFeatureManager.getAllFeatures();
  const assetTypeEnum =
    marketplaceItemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType;

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

      // Don't show variants tab in left menu if the asset type is not valid
      if (currentFeature.key === 'variants') {
        if (getIsDurableType(assetTypeEnum, undefined)) {
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
  }, [] as Feature<TSettings>[]);

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );
  const { classes: styles } = useLeftNavigationStyles();
  const backToCreationsPageLink = useMemo(() => {
    const groupId = marketplaceItemDetails?.item?.creator?.group?.groupId;
    const assetType = mapAssetTypeToString(
      marketplaceItemDetails?.item?.marketplaceItemDetails?.assetDetails?.assetType ??
        RobloxItemConfigurationApiAssetDetailsAssetTypeEnum.NUMBER_0,
    );
    return getRouteToAvatarItemCreationsPage(assetType, groupId);
  }, [marketplaceItemDetails]);

  return (
    <Fragment>
      <Grid item container direction='column'>
        <Link className={styles.backButton} href={backToCreationsPageLink}>
          <Button color='primary' size='small' startIcon={<ArrowBackIcon />}>
            {translate('Action.BackToAvatarItems')}
          </Button>
        </Link>
        <AssetStatus />
        <Divider className={styles.divider} />
      </Grid>
      {[AssetNavigationSectionTitleKeys[0]].map(
        (titleKey) =>
          features.some((feature) => feature.sectionTitleKey === titleKey) && (
            <Grid key={`asset-navigation-section-${titleKey}`} item container direction='column'>
              <Features
                key={`feature-${titleKey}`}
                features={features.filter((feature) => feature.sectionTitleKey === titleKey)}
                activeFeature={activeFeature}
                title=''
                name='assets'
              />
            </Grid>
          ),
      )}
    </Fragment>
  );
};

export default withTranslation(AssetLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Variants,
]);
