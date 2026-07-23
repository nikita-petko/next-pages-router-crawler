import React, { FunctionComponent, useMemo } from 'react';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ErrorPage } from '@modules/miscellaneous/error';
import { PageLoading } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { StatusCodes } from '@rbx/core';
import { Grid, Typography } from '@rbx/ui';
import { useRouter } from 'next/router';
import { UserRoleType } from '@modules/clients';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { buildTitle, HubMeta } from '@rbx/creator-hub-history';
import EntriesMetadataProvider from '../../gameStringTranslation/providers/EntriesMetadataProvider';
import LocalizationTableEntriesProvider from '../../gameStringTranslation/providers/LocalizationTableEntriesProvider';
import GameProductsTranslationManagementContainer from '../../gameProductTranslation/container/GameProductsTranslationManagementContainer';
import GameInfoTranslationManagementContainer from '../../gameInfoTranslation/containers/GameInfoTranslationManagementContainer';
import GameStringsEntryManagementContainer from '../../gameStringTranslation/containers/GameStringsEntryManagementContainer';
import TranslationFeatureOptions from '../enums/TranslationFeatureOptions';
import TranslationTitle from '../components/TranslationTitle';
import useLocalizationLayoutStyles from '../../common/components/LocalizationLayout.styles';
import HeaderTab from '../components/HeaderTab';
import EntryManagementMetadataProvider from '../providers/EntryManagementMetadataProvider';
import useTranslationLogic from '../hooks/useTranslationLogic';
import useTranslationContainerStyles from './TranslationContainer.styles';
import { translationTabMap } from '../constants';
import TranslationLogicProvider from '../providers/TranslationLogicProvider';

const tabLabelKeys: Record<string, string> = {
  [translationTabMap[TranslationFeatureOptions.GameInfo]]: 'Label.GameInfo',
  [translationTabMap[TranslationFeatureOptions.GameStrings]]: 'Label.GameStrings',
  [translationTabMap[TranslationFeatureOptions.GameProducts]]: 'Label.GameProducts',
};

const TranslationContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { translate } = useTranslation();
  const { isLoadingGame, canConfigure, gameDetails } = useCurrentGame();
  const {
    userRoles,
    roleLoading,
    activeTranslationTarget,
    supportedLanguages,
    supportedLanguageLoading,
    sourceLanguageCode,
    sourceLanguageCodeLoading,
  } = useTranslationLogic();
  const {
    classes: { errorText, errorTextGrid },
    cx,
  } = useTranslationContainerStyles();
  const router = useRouter();
  const {
    classes: { hidden },
  } = useLocalizationLayoutStyles();

  const tabValue = useMemo(() => {
    const { activeTab } = router.query;
    if (!activeTab) {
      return translationTabMap[TranslationFeatureOptions.GameInfo];
    }
    return activeTab as string;
  }, [router]);

  const {
    params: { enableIAM2 },
  } = useIXPParameters(IXPLayers.CreatorHubNavigationUser);

  if (
    !isLoadingGame &&
    canConfigure === false &&
    !roleLoading &&
    !userRoles.includes(UserRoleType.translator) &&
    !userRoles.includes(UserRoleType.owner)
  ) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  const handleTabChange = async (event: React.ChangeEvent, newValue: unknown) => {
    await router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          activeTab: newValue as string,
        },
      },
      undefined,
      { shallow: true },
    );
  };

  let content = null;
  if (supportedLanguageLoading || sourceLanguageCodeLoading || isLoadingGame || roleLoading) {
    content = <PageLoading />;
  } else if (supportedLanguages.length === 0) {
    content = (
      <Grid className={errorTextGrid} container justifyContent='center' alignItems='center'>
        <Typography className={errorText} variant='largeLabel2'>
          {translate('Message.TranslationLanguageNotExists')}
        </Typography>
      </Grid>
    );
  } else if (gameDetails) {
    content = (
      <section>
        <Grid
          className={cx({
            [hidden]: tabValue !== translationTabMap[TranslationFeatureOptions.GameStrings],
          })}>
          <GameStringsEntryManagementContainer />
        </Grid>
        <Grid
          className={cx({
            [hidden]: tabValue !== translationTabMap[TranslationFeatureOptions.GameProducts],
          })}>
          <GameProductsTranslationManagementContainer />
        </Grid>
        <Grid
          className={cx({
            [hidden]: tabValue !== translationTabMap[TranslationFeatureOptions.GameInfo],
          })}>
          <GameInfoTranslationManagementContainer />
        </Grid>
      </section>
    );
  }

  const activeTabLabel = tabLabelKeys[tabValue];

  if (gameDetails?.id) {
    return (
      <TranslationLogicProvider>
        <EntryManagementMetadataProvider
          gameId={gameDetails.id}
          userRoles={userRoles}
          sourceLanguageCode={sourceLanguageCode ?? 'en'}
          activeTranslationTarget={activeTranslationTarget}
          supportedLanguages={supportedLanguages}
          shouldLoadTranslationHistory>
          <LocalizationTableEntriesProvider gameId={gameDetails.id}>
            <EntriesMetadataProvider>
              <section>
                <HubMeta
                  title={buildTitle(
                    activeTabLabel ? translate(activeTabLabel) : translate('Heading.Translation'),
                  )}
                  seoTitle={buildTitle(
                    gameDetails.name,
                    translate('Heading.Localization'),
                    translate('Heading.Translation'),
                  )}
                />
                {!enableIAM2 && <TranslationTitle />}
                <HeaderTab selectedTab={tabValue} onTabChange={handleTabChange} />
              </section>
              {content}
            </EntriesMetadataProvider>
          </LocalizationTableEntriesProvider>
        </EntryManagementMetadataProvider>
      </TranslationLogicProvider>
    );
  }

  return <PageLoading />;
};

export default withTranslation(TranslationContainer, [
  TranslationNamespace.GameLocalization,
  TranslationNamespace.GameTranslation,
  TranslationNamespace.GameInfoTranslation,
  TranslationNamespace.GameStringTranslation,
  TranslationNamespace.GameProductTranslation,
  TranslationNamespace.Error,
]);
