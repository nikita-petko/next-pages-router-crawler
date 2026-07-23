import { useRouter } from 'next/router';
import type { FunctionComponent, PropsWithChildren } from 'react';
import { Fragment, useMemo } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { ArrowBackIcon, Divider, Grid, Button, Typography } from '@rbx/ui';
import { Item, itemTypeToSingularNameKeys } from '@modules/miscellaneous/common';
import { Link } from '@modules/miscellaneous/components';
import { useStudioEditPlaceLauncher } from '@modules/miscellaneous/hooks';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type Feature from '@modules/navigation/feature/interfaces/Feature';
import Features from '@modules/navigation/leftNavigation/components/Features';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import type { PlaceFeatureSettings } from './placeFeatureManager';
import placeFeatureManager, { PlaceLeftNavigationSectionTitleKeys } from './placeFeatureManager';
import PlaceStatus from './PlaceStatus';

const PlaceLeftNavigation: FunctionComponent<PropsWithChildren> = () => {
  const { translate } = useTranslation();
  const router = useRouter();
  const { settings, isFetched } = useSettings();
  const { id, placeId } = router.query;
  const { gameDetails, isLoadingGame } = useCurrentGame();
  const { classes: styles } = useLeftNavigationStyles();
  const { open, dialog } = useStudio();
  const { launch } = useStudioEditPlaceLauncher();

  const isRootPlace = useMemo(() => {
    const routerPlaceId = Number.parseInt(router.query.placeId as string, 10);
    return { isRootPlace: !isLoadingGame && gameDetails?.rootPlaceId === routerPlaceId };
  }, [isLoadingGame, gameDetails, router]);

  const enabledFeatures = useMemo(() => {
    const mergedSettings = !isFetched ? undefined : { ...settings, ...isRootPlace };
    return placeFeatureManager.getAllFeatures().reduce((features, currentFeature) => {
      if (currentFeature.isEnabledOnSettings?.(mergedSettings) ?? true) {
        let feature = currentFeature;
        if (currentFeature.key === 'editInStudio') {
          if (settings.enableUseStudioEditPlaceLauncherWithPrelaunch) {
            feature = {
              ...currentFeature,
              onSelectFeature: () => () =>
                launch(Number(id?.toString() || ''), Number(placeId?.toString() || '')),
            };
          } else {
            feature = {
              ...currentFeature,
              onSelectFeature: () =>
                open({
                  task: EStudioTaskType.EditPlace,
                  universeId: id?.toString() || '',
                  placeId: placeId?.toString() || '',
                }),
            };
          }
        }
        features.push(feature);
      }
      return features;
    }, [] as Feature<PlaceFeatureSettings>[]);
  }, [settings, isFetched, isRootPlace, id, placeId, open, launch]);

  const activeFeature = useMemo(
    () => enabledFeatures.find((feature) => feature.path && router.pathname.endsWith(feature.path)),
    [router.pathname, enabledFeatures],
  );

  return (
    <>
      <Grid item container direction='column'>
        <Link className={styles.backButton} href={`/dashboard/creations/experiences/${id}/places`}>
          <Button color='primary' size='small' startIcon={<ArrowBackIcon />}>
            {translate('Action.BackToPlaces')}
          </Button>
        </Link>
        <Typography className={styles.sidebarHeaderText} variant='overline'>
          {translate(itemTypeToSingularNameKeys[Item.Places])}
        </Typography>
        <PlaceStatus />
        <Divider className={styles.divider} />
      </Grid>
      {[PlaceLeftNavigationSectionTitleKeys[0]].map(
        (titleKey) =>
          enabledFeatures.some((feature) => feature.sectionTitleKey === titleKey) && (
            <Grid key={`navigation-section-${titleKey}`} item container direction='column'>
              <Features
                key={`feature-${titleKey}`}
                features={enabledFeatures.filter((feature) => feature.sectionTitleKey === titleKey)}
                activeFeature={activeFeature}
                title=''
                name='places'
              />
            </Grid>
          ),
      )}
      {dialog}
    </>
  );
};

export default withTranslation(PlaceLeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.VersionHistory,
  TranslationNamespace.Navigation,
]);
