import React, { Fragment, FunctionComponent, useMemo } from 'react';
import { useRouter } from 'next/router';
import { Feature } from '@modules/navigation/feature';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ArrowBackIcon, Divider, Grid, Button } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/common';
import { TSettings, useSettings } from '@modules/settings';
import Look from '@modules/miscellaneous/common/enums/Look';
import getRouteToAvatarItemCreationsPage from '../../avatarItem/utils/avatarMenuNavigationUtils';
import lookFeatureManager, { LookNavigationSectionTitleKeys } from './lookFeatureManager';
import LookLeftNavigationMenu from './LookLeftNavigationMenu';

const LookLeftNavigation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();

  const allFeatures = lookFeatureManager.getAllFeatures();

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

      enabledFeatures.push(feature);
    }
    return enabledFeatures;
  }, [] as Feature<TSettings>[]);

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );
  const { classes: styles } = useLeftNavigationStyles();
  const backToCreationsPageLink = useMemo(() => {
    return getRouteToAvatarItemCreationsPage(Look.Makeup);
  }, []);

  return (
    <Fragment>
      <Grid item container direction='column'>
        <Link className={styles.backButton} href={backToCreationsPageLink}>
          <Button color='primary' size='small' startIcon={<ArrowBackIcon />}>
            {translate('Action.BackToAvatarItems')}
          </Button>
        </Link>
        <LookLeftNavigationMenu />
        <Divider className={styles.divider} />
      </Grid>
      {[LookNavigationSectionTitleKeys[0]].map(
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

export default withTranslation(LookLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Variants,
]);
