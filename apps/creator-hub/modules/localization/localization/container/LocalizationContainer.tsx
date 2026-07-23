import React, { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react';

import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ErrorPage } from '@modules/miscellaneous/error';
import { withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { gameInternationalizationClient, TranslationFeatureStatusResponse } from '@modules/clients';
import { StatusCodes } from '@rbx/core';
import { Grid } from '@rbx/ui';
import ReportDownloader from '../../reports/components/ReportDownloader';
import ReportType from '../../reports/enums/ReportType';
import EntryManagementMetadataProvider from '../../translation/providers/EntryManagementMetadataProvider';
import useTranslationLogic from '../../translation/hooks/useTranslationLogic';
import LocalizationTableEntriesProvider from '../../gameStringTranslation/providers/LocalizationTableEntriesProvider';
import LocalizationTitle from '../components/LocalizationTitle';
import useLocalizationLayoutStyles from '../../common/components/LocalizationLayout.styles';
import LocalizationNavigation from '../components/LocalizationNavigation';
import QuotaContainer from './QuotaContainer';
import LocalizationFeatureOptions from '../enums/LocalizationFeatureOptions';
import LanguageManagementContainer from './LanguageManagementContainer';
import LocalizationSettingsContainer from './LocalizationSettingsContainer';
import LocalizationTranslatorsContainer from './LocalizationTranslatorsContainer';
import TranslatorManagementProvider from '../providers/TranslatorManagementProvider';
import LanguageManagementProvider from '../providers/LanguageManagementProvider';
import LocalizationTableManagementContainer from './LocalizationTableManagementContainer';

const LocalizationContainer: FunctionComponent<React.PropsWithChildren<unknown>> = () => {
  const { isLoadingGame, canConfigure, gameDetails } = useCurrentGame();
  const {
    classes: { body, hidden },
  } = useLocalizationLayoutStyles();
  const { userRoles, activeTranslationTarget, supportedLanguages, sourceLanguageCode } =
    useTranslationLogic();
  const [autoTranslationfeatureStatus, setAutoTranslationFeatureStatus] =
    useState<TranslationFeatureStatusResponse>();
  const [tabValue, setTabValue] = useState<LocalizationFeatureOptions>(
    LocalizationFeatureOptions.LanguageTab,
  );
  const [isATEnabledForAnyLanguage, setIsATEnabledForAnyLanguage] = useState<boolean>(false);

  const getFeatureStatus = useCallback(async (gameId: number) => {
    try {
      const featureStatus = await gameInternationalizationClient.getTranslationFeatureStatus({
        gameId,
      });
      setAutoTranslationFeatureStatus(featureStatus);
    } catch {
      setAutoTranslationFeatureStatus(undefined);
    }
  }, []);

  const fetchIsATEnabledForAnyLanguage = useCallback(async (gameId: number) => {
    // check if any languages are AT enabled for string
    const autoTranslationStringResponse =
      await gameInternationalizationClient.getAutoTranslationStatus({
        gameId,
      });
    const isATStringsEnabledForAnyLanguage = autoTranslationStringResponse.data?.some(
      (language) => language.isAutomaticTranslationEnabled,
    );
    if (isATStringsEnabledForAnyLanguage) {
      setIsATEnabledForAnyLanguage(isATStringsEnabledForAnyLanguage);
      return;
    }
    // else check if any languages are AT enabled for game info
    const autoTranslationInfoResponse =
      await gameInternationalizationClient.getDisplayInfoAutomaticTranslationSettings({
        gameId,
      });
    const isATInfoEnabledForAnyLanguage = autoTranslationInfoResponse.data?.some(
      (language) => language.isUniverseDisplayInfoAutomaticTranslationEnabled,
    );
    if (isATInfoEnabledForAnyLanguage) {
      setIsATEnabledForAnyLanguage(isATInfoEnabledForAnyLanguage);
      return;
    }
    setIsATEnabledForAnyLanguage(false);
  }, []);

  useEffect(() => {
    const gameId = gameDetails?.id;
    if (gameId) {
      getFeatureStatus(gameId);
      fetchIsATEnabledForAnyLanguage(gameId);
    }
  }, [fetchIsATEnabledForAnyLanguage, gameDetails, getFeatureStatus]);

  const handleSelectTab = (value: LocalizationFeatureOptions) => {
    setTabValue(value);
  };

  if (canConfigure === false) {
    return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
  }

  return (
    <section>
      <Grid>
        <LocalizationTitle />
        <LocalizationNavigation onSelectTab={handleSelectTab} currentTab={tabValue} />
      </Grid>
      {isLoadingGame && (
        <Grid>
          <PageLoading />
        </Grid>
      )}
      {gameDetails && gameDetails.id && (
        <Fragment>
          <Grid className={tabValue === LocalizationFeatureOptions.LanguageTab ? body : hidden}>
            {autoTranslationfeatureStatus?.isAutomaticTranslationAllowed &&
              isATEnabledForAnyLanguage && <QuotaContainer gameId={gameDetails.id} />}
            <LanguageManagementProvider>
              <LanguageManagementContainer
                isAutoTranslationAllowed={
                  !!autoTranslationfeatureStatus?.isAutomaticTranslationAllowed
                }
              />
            </LanguageManagementProvider>
          </Grid>
          <Grid className={tabValue === LocalizationFeatureOptions.TranslatorTab ? body : hidden}>
            <TranslatorManagementProvider>
              <LocalizationTranslatorsContainer />
            </TranslatorManagementProvider>
          </Grid>
          <Grid className={tabValue === LocalizationFeatureOptions.ReportTab ? body : hidden}>
            <ReportDownloader
              gameId={gameDetails.id}
              reportType={ReportType.GameTranslationStatus}
              reportTypeTargetId={gameDetails.id}
            />
          </Grid>
        </Fragment>
      )}
      {gameDetails && gameDetails.id && (
        <Grid className={tabValue === LocalizationFeatureOptions.SettingTab ? body : hidden}>
          <LocalizationSettingsContainer universeId={gameDetails.id} />
        </Grid>
      )}
      {gameDetails && gameDetails.id && (
        <LanguageManagementProvider>
          <EntryManagementMetadataProvider
            gameId={gameDetails.id}
            userRoles={userRoles}
            sourceLanguageCode={sourceLanguageCode ?? 'en'}
            activeTranslationTarget={activeTranslationTarget}
            supportedLanguages={supportedLanguages}
            shouldLoadTranslationHistory={false}>
            <LocalizationTableEntriesProvider gameId={gameDetails.id}>
              <Grid
                className={
                  tabValue === LocalizationFeatureOptions.TableManagementTab ? body : hidden
                }>
                <LocalizationTableManagementContainer />
              </Grid>
            </LocalizationTableEntriesProvider>
          </EntryManagementMetadataProvider>
        </LanguageManagementProvider>
      )}
    </section>
  );
};

export default withTranslation(LocalizationContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.GameLocalization,
  TranslationNamespace.GameLocalizationLanguages,
  TranslationNamespace.GameLocalizationReports,
  TranslationNamespace.GameLocalizationSettings,
  TranslationNamespace.GameLocalizationTranslators,
  TranslationNamespace.GameLocalizationTableManagement,
]);
