import React, { Fragment, FunctionComponent, useMemo } from 'react';
import { useRouter } from 'next/router';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ArrowBackIcon, Button, Divider, Grid } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import { useSettings } from '@modules/settings';
import Creator from '@modules/miscellaneous/common/enums/Creator';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import developerItemFeatureManager, {
  DeveloperItemNavigationSectionTitleKeys,
  openInExperience,
  permissionsFeature,
  versionHistoryFeature,
} from './developerItemFeatureManager';
import DeveloperItemStatus from './DeveloperItemStatus';
import { useCurrentDeveloperItem } from '../DeveloperItemProvider';
import VERSION_HISTORY_ASSETS, {
  PERMISSION_ASSETS_WITH_ANIMATION,
  PERMISSION_ASSETS,
} from '../../constants';
import {
  publishAttribtuionEnabledAssetTypes,
  useCurrentDeveloperItemPublishAttribution,
} from '../DeveloperItemPublishAttributionProvider';
import DeveloperItemAttributionText from './DeveloperItemAttributionText';

const DeveloperItemLeftNavigation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { developerItemDetails } = useCurrentDeveloperItem();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const enableAnimationPermissionPage =
    frontendFlags[FrontendFlagName.FrontendFlagEnableAnimationPermissionPage];
  const enabledPermissionAssets = enableAnimationPermissionPage
    ? PERMISSION_ASSETS_WITH_ANIMATION
    : PERMISSION_ASSETS;

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
          } else if (filter && feature.key === openInExperience.key) {
            filter = !!(
              developerItemDetails?.type &&
              publishAttribtuionEnabledAssetTypes.includes(developerItemDetails.type) &&
              creatingUniverse
            );
          } else if (filter && feature.key === permissionsFeature.key) {
            filter = !!(
              developerItemDetails?.type &&
              enabledPermissionAssets.includes(developerItemDetails.type)
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
                    adornment: <DeveloperItemAttributionText name={creatingUniverse?.name || ''} />,
                  }
                : {};
            return {
              ...feature,
              ...overrideFeature,
              getExternalPath: () =>
                feature.getExternalPath?.(
                  parseInt(router.query.id as string, 10),
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
      enabledPermissionAssets,
      router.query.id,
      settings,
    ],
  );

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );
  const { classes: styles } = useLeftNavigationStyles();
  const backToCreationsPageLink = useMemo(() => {
    let url = '/dashboard/creations';
    if (developerItemDetails?.type) {
      if (developerItemDetails?.creator.type === Creator.Group) {
        url += `?activeTab=${developerItemDetails.type}&groupId=${developerItemDetails.creator.id}`;
      } else {
        url += `?activeTab=${developerItemDetails.type}`;
      }
    }
    return url;
  }, [developerItemDetails]);

  return (
    <Fragment>
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
    </Fragment>
  );
};

export default withTranslation(DeveloperItemLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.AssetTypes,
]);
