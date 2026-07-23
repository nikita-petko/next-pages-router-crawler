import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ArrowBackIcon, Divider, Grid, Button } from '@rbx/ui';
import Look from '@modules/miscellaneous/common/enums/Look';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import getRouteToAvatarItemCreationsPage from '../../avatarItem/utils/avatarMenuNavigationUtils';
import useCurrentLook from '../hooks/useCurrentLook';
import lookFeatureManager, { LookNavigationSectionTitleKeys } from './lookFeatureManager';
import LookLeftNavigationMenu from './LookLeftNavigationMenu';

const LookLeftNavigation: FunctionComponent<React.PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings } = useSettings();
  const { lookDetail } = useCurrentLook();

  const allFeatures = lookFeatureManager.getAllFeatures();

  const features = allFeatures.reduce((enabledFeatures, currentFeature) => {
    if (currentFeature.isEnabledOnSettings?.(settings) ?? true) {
      let feature = currentFeature;
      if (currentFeature.getExternalPath) {
        feature = {
          ...currentFeature,
          getExternalPath: () => {
            if (!currentFeature.getExternalPath) {
              return '';
            }
            const rawId = router.query.id;
            const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
            const parsed = typeof idStr === 'string' ? parseInt(idStr, 10) : NaN;
            return currentFeature.getExternalPath(Number.isNaN(parsed) ? 0 : parsed);
          },
        };
      }

      enabledFeatures.push(feature);
    }
    return enabledFeatures;
  }, [] as Feature[]);

  const activeFeature = useMemo(
    () => features.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [features, router],
  );
  const { classes: styles } = useLeftNavigationStyles();
  const backToCreationsPageLink = useMemo(() => {
    return getRouteToAvatarItemCreationsPage(lookDetail?.lookType ?? Look.Makeup);
  }, [lookDetail?.lookType]);

  return (
    <>
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
    </>
  );
};

export default withTranslation(LookLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.AssetTypes,
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Variants,
]);
