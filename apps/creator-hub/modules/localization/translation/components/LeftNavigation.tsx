import React, { Fragment, FunctionComponent, useCallback, useMemo } from 'react';
import { GameStatus } from '@modules/creations/game';
import LeftNavigationMenu from '@modules/navigation/leftNavigation/components/LeftNavigationMenu';
import { MenuItem as LeftNavigationMenuItem } from '@modules/navigation/leftNavigation/interface/menuItem';
import useLeftNavigationStyles from '@modules/navigation/leftNavigation/components/LeftNavigation.styles';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CircularProgress, Divider, Grid, Typography } from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useRouter } from 'next/router';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { languageTabSelectedRequestEventModel } from '@modules/eventStream/constants/eventConstants';
import TranslationTarget from '../types/TranslationTarget';
import GoBackButton from './GoBackButton';
import useTranslationLogic from '../hooks/useTranslationLogic';
import { contributionReportFeatureKey } from '../constants';

const LeftNavigation: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { trackerClient } = useEventTrackerProvider();
  const router = useRouter();
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();
  const {
    userRoles,
    roleLoading,
    sourceTranslationLanguage,
    activeTranslationTarget,
    setActiveTranslationTarget,
    supportedLanguages,
    supportedLanguageLoading,
    sourceLanguageCodeLoading,
  } = useTranslationLogic();
  const { classes: styles } = useLeftNavigationStyles();

  const activeLeftNavigationKey = useMemo(() => {
    if (router.pathname.endsWith(contributionReportFeatureKey)) {
      return contributionReportFeatureKey;
    }
    return activeTranslationTarget?.translationKey;
  }, [router, activeTranslationTarget]);

  const sourceLanguageFeatures: Array<LeftNavigationMenuItem> = useMemo(() => {
    const menuItem = {
      key: sourceTranslationLanguage?.defaultLocalizationTarget.translationKey.toString() ?? '',
      title: sourceTranslationLanguage?.displayName ?? '',
      content: sourceTranslationLanguage?.defaultLocalizationTarget,
      subItems:
        sourceTranslationLanguage?.childLocalizationTargets &&
        sourceTranslationLanguage?.childLocalizationTargets.length > 0
          ? sourceTranslationLanguage.childLocalizationTargets.map((localizationTarget) => ({
              key: localizationTarget.translationKey.toString(),
              title: localizationTarget.isDefaultTarget
                ? translate('Title.Global')
                : localizationTarget.displayName.toString(),
              content: localizationTarget,
            }))
          : [],
    };
    return [menuItem];
  }, [sourceTranslationLanguage, translate]);

  const languageFeatures: Array<LeftNavigationMenuItem> = useMemo(() => {
    return supportedLanguages.map((language) => {
      return {
        key: language.defaultLocalizationTarget.translationKey.toString(),
        title: language.displayName,
        content: language.defaultLocalizationTarget,
        subItems:
          language.childLocalizationTargets.length > 0
            ? [language.defaultLocalizationTarget, ...language.childLocalizationTargets].map(
                (localizationTarget) => ({
                  key: localizationTarget.translationKey.toString(),
                  title: localizationTarget.isDefaultTarget
                    ? translate('Title.Global')
                    : localizationTarget.displayName.toString(),
                  content: localizationTarget,
                }),
              )
            : [],
      };
    });
  }, [supportedLanguages, translate]);

  const fileFeatures: Array<LeftNavigationMenuItem> = [
    {
      key: contributionReportFeatureKey,
      title: translate('Title.ContributionReports'),
      content: null,
    },
  ];

  const gameId = gameDetails?.id;

  const handleLanguageMenuClick = useCallback(
    (item: LeftNavigationMenuItem) => {
      const newTranslationTarget = item.content as TranslationTarget;
      trackerClient.sendEvent(
        languageTabSelectedRequestEventModel(
          gameId ?? null,
          activeTranslationTarget?.translationKey ?? null,
          newTranslationTarget.translationKey,
        ),
      );
      setActiveTranslationTarget(newTranslationTarget);
    },
    [activeTranslationTarget?.translationKey, gameId, setActiveTranslationTarget, trackerClient],
  );

  const handleFileFeatureClick = useCallback(
    async (item: LeftNavigationMenuItem) => {
      if (!gameId) {
        return;
      }
      await router.push({
        pathname: `/dashboard/creations/experiences/[id]/localization/${item.key}`,
        query: {
          id: gameId,
        },
      });
    },
    [gameId, router],
  );

  const defaultExpandedKey = useMemo(() => {
    const selectedSubitem = languageFeatures.find(
      (item) =>
        typeof item.subItems !== 'undefined' &&
        item.subItems.find((subitem) => subitem.key === activeLeftNavigationKey),
    );
    if (typeof selectedSubitem !== 'undefined') {
      return selectedSubitem.title;
    }
    return undefined;
  }, [languageFeatures, activeLeftNavigationKey]);

  return (
    <Fragment>
      <Grid item container direction='column'>
        {roleLoading && gameId ? (
          <CircularProgress color='secondary' />
        ) : (
          <GoBackButton userRoles={userRoles} gameId={gameId || null} />
        )}
        <Typography className={styles.sidebarHeaderText} variant='overline'>
          {translate('Heading.Experience')}
        </Typography>
        <GameStatus />
        <Divider className={styles.divider} />
      </Grid>
      <Grid item container direction='column'>
        {supportedLanguageLoading || sourceLanguageCodeLoading ? (
          <Grid className={styles.loader}>
            <CircularProgress color='secondary' />
          </Grid>
        ) : (
          <Fragment>
            {sourceTranslationLanguage?.childLocalizationTargets &&
              sourceTranslationLanguage?.childLocalizationTargets.length > 1 && (
                <LeftNavigationMenu
                  header={translate('Title.SourceLanguage')}
                  onSelectItem={handleLanguageMenuClick}
                  activeKey={activeLeftNavigationKey}
                  items={sourceLanguageFeatures}
                  defaultExpanded={defaultExpandedKey ? [defaultExpandedKey] : undefined}
                />
              )}

            <LeftNavigationMenu
              header={translate('Title.TargetLanguages')}
              onSelectItem={handleLanguageMenuClick}
              activeKey={activeLeftNavigationKey}
              items={languageFeatures}
              defaultExpanded={defaultExpandedKey ? [defaultExpandedKey] : undefined}
            />
            <LeftNavigationMenu
              header={translate('Title.Files')}
              onSelectItem={handleFileFeatureClick}
              items={fileFeatures}
              activeKey={activeLeftNavigationKey}
              defaultExpanded={defaultExpandedKey ? [defaultExpandedKey] : undefined}
            />
          </Fragment>
        )}
      </Grid>
    </Fragment>
  );
};

export default withTranslation(LeftNavigation, [
  TranslationNamespace.Creations,
  TranslationNamespace.GameTranslation,
  TranslationNamespace.Navigation,
  TranslationNamespace.GameStringTranslation,
]);
