import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ArrowBackIcon, Button, Divider, Grid } from '@rbx/ui';
import { isAssetDependenciesViewerEnabled } from '@generated/flags/contentAccessAndInventory';
import Creator from '@modules/miscellaneous/common/enums/Creator';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  getPublishingConsolidationReturnTo,
  PUBLISHING_CONSOLIDATION_RETURN_TO_QUERY_KEY,
} from '../../../common/utils/publishingConsolidationNavigation';
import VERSION_HISTORY_ASSETS, {
  ASSET_ACCESS_FORM_ASSETS,
  DEPENDENCIES_ASSETS,
  MARKETPLACE_LINK_EXCLUDED_ASSETS,
} from '../../constants';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';
import {
  publishAttribtuionEnabledAssetTypes,
  useCurrentDeveloperItemPublishAttribution,
} from '../DeveloperItemPublishAttributionProvider';
import DeveloperItemAttributionText from './DeveloperItemAttributionText';
import developerItemFeatureManager, {
  DeveloperItemNavigationSectionTitleKeys,
  dependenciesFeature,
  openInExperience,
  openInMarketplace,
  permissionsFeature,
  versionHistoryFeature,
} from './developerItemFeatureManager';
import DeveloperItemStatus from './DeveloperItemStatus';

const DeveloperItemLeftNavigation: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { value: isDependenciesViewerEnabled } = useFlag(isAssetDependenciesViewerEnabled);
  const { developerItemDetails } = useCurrentDeveloperItem();
  const { creatingUniverse } = useCurrentDeveloperItemPublishAttribution();
  const allFeatures = developerItemFeatureManager.getAllFeatures();
  const features = useMemo(
    () =>
      allFeatures
        .filter((feature) => {
          let filter = feature.isEnabledOnSettings?.(settings) ?? true;
          if (filter && feature.key === versionHistoryFeature.key) {
            filter = !!(
              developerItemDetails?.type &&
              VERSION_HISTORY_ASSETS.includes(developerItemDetails.type)
            );
          } else if (filter && feature.key === dependenciesFeature.key) {
            filter = !!(
              isDependenciesViewerEnabled &&
              developerItemDetails?.type &&
              DEPENDENCIES_ASSETS.includes(developerItemDetails.type)
            );
          } else if (filter && feature.key === openInExperience.key) {
            filter = !!(
              developerItemDetails?.type &&
              publishAttribtuionEnabledAssetTypes.includes(developerItemDetails.type) &&
              creatingUniverse
            );
          } else if (filter && feature.key === permissionsFeature.key) {
            filter = !!(
              developerItemDetails?.type &&
              ASSET_ACCESS_FORM_ASSETS.includes(developerItemDetails.type)
            );
          } else if (filter && feature.key === openInMarketplace.key) {
            filter = !!(
              developerItemDetails?.type &&
              !MARKETPLACE_LINK_EXCLUDED_ASSETS.includes(developerItemDetails.type)
            );
          }
          return filter;
        })
        .map((feature) => {
          if (feature.getExternalPath) {
            // TODO(yanzhuang @ 20230535): CRF-3056, support rich text format in Features.tsx for sidebar
            // render formatted text with adornment for now
            const overrideFeature =
              feature.key === openInExperience.key
                ? {
                    nameKey: '',
                    adornment: <DeveloperItemAttributionText name={creatingUniverse?.name ?? ''} />,
                  }
                : {};
            return {
              ...feature,
              ...overrideFeature,
              getExternalPath: () =>
                feature.getExternalPath?.(
                  parseInt(typeof router.query.id === 'string' ? router.query.id : '0', 10),
                  creatingUniverse?.rootPlaceId ?? 0,
                ) ?? '',
            };
          }
          return feature;
        }),
    [
      allFeatures,
      creatingUniverse,
      developerItemDetails,
      isDependenciesViewerEnabled,
      router.query.id,
      settings,
    ],
  );

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );
  const { classes: styles } = useLeftNavigationStyles();
  const publishingConsolidationReturnTo =
    router.query[PUBLISHING_CONSOLIDATION_RETURN_TO_QUERY_KEY];
  const backToCreationsPageLink = useMemo(() => {
    const preservedReturnUrl = getPublishingConsolidationReturnTo(publishingConsolidationReturnTo);
    if (preservedReturnUrl != null) {
      return preservedReturnUrl;
    }

    let url = '/dashboard/creations';
    if (developerItemDetails?.type) {
      if (developerItemDetails.creator.type === Creator.Group) {
        url += `?activeTab=${developerItemDetails.type}&groupId=${developerItemDetails.creator.id}`;
      } else {
        url += `?activeTab=${developerItemDetails.type}`;
      }
    }
    return url;
  }, [developerItemDetails, publishingConsolidationReturnTo]);

  return (
    <>
      <Grid item container direction='column'>
        <Link className={styles.backButton} href={backToCreationsPageLink}>
          <Button color='primary' size='small' startIcon={<ArrowBackIcon />}>
            {translate('Action.Back')}
          </Button>
        </Link>
        <DeveloperItemStatus />
        <Divider className={styles.divider} />
      </Grid>
      {[DeveloperItemNavigationSectionTitleKeys[0]].map(
        (titleKey) =>
          features.some((feature) => feature.sectionTitleKey === titleKey) && (
            <Grid key={`navigation-section-${titleKey}`} item container direction='column'>
              <Features
                key={`feature-${titleKey}`}
                features={features.filter((feature) => feature.sectionTitleKey === titleKey)}
                activeFeature={activeFeature}
                title=''
                name='developerItems'
              />
            </Grid>
          ),
      )}
    </>
  );
};

export default withTranslation(DeveloperItemLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.AssetTypes,
]);
