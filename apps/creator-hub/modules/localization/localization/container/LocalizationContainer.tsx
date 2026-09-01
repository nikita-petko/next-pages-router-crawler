import type { FunctionComponent } from 'react';
import React, { Fragment, useCallback, useEffect, useState } from 'react';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import type { TranslationFeatureStatusResponse } from '@modules/clients/gameInternationalization';
import gameInternationalizationClient from '@modules/clients/gameInternationalization';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import useLocalizationLayoutStyles from '../../common/components/LocalizationLayout.styles';
import LocalizationTableEntriesProvider from '../../gameStringTranslation/providers/LocalizationTableEntriesProvider';
import ReportDownloader from '../../reports/components/ReportDownloader';
import ReportType from '../../reports/enums/ReportType';
import useTranslationLogic from '../../translation/hooks/useTranslationLogic';
import EntryManagementMetadataProvider from '../../translation/providers/EntryManagementMetadataProvider';
import LocalizationNavigation from '../components/LocalizationNavigation';
import LocalizationTitle from '../components/LocalizationTitle';
import LocalizationFeatureOptions from '../enums/LocalizationFeatureOptions';
import LanguageManagementProvider from '../providers/LanguageManagementProvider';
import TranslatorManagementProvider from '../providers/TranslatorManagementProvider';
import LanguageManagementContainer from './LanguageManagementContainer';
import LocalizationSettingsContainer from './LocalizationSettingsContainer';
import LocalizationTableManagementContainer from './LocalizationTableManagementContainer';
import LocalizationTranslatorsContainer from './LocalizationTranslatorsContainer';
import QuotaContainer from './QuotaContainer';

const LocalizationContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { isLoadingGame, canConfigure, gameDetails } = useCurrentGame();
  const { settings, isFetched } = useSettings();
  const enableImageTranslationEnrollment = !!settings?.enableImageTranslationEnrollment;
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

  const fetchIsATEnabledForAnyLanguage = useCallback(
    async (gameId: number) => {
      // check if any languages are AT enabled for string
      const autoTranslationStringResponse =
        await gameInternationalizationClient.getAutoTranslationStatus({
          gameId,
        });
      const isATStringsOrImagesEnabledForAnyLanguage = autoTranslationStringResponse.data?.some(
        (language) =>
          language.isAutomaticTranslationEnabled ||
          (enableImageTranslationEnrollment && language.isImageTranslationEnabled),
      );
      if (isATStringsOrImagesEnabledForAnyLanguage) {
        setIsATEnabledForAnyLanguage(isATStringsOrImagesEnabledForAnyLanguage);
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
    },
    [enableImageTranslationEnrollment],
  );

  useEffect(() => {
    const gameId = gameDetails?.id;
    if (!gameId || !isFetched) {
      return;
    }
    getFeatureStatus(gameId);
    fetchIsATEnabledForAnyLanguage(gameId);
  }, [fetchIsATEnabledForAnyLanguage, gameDetails, getFeatureStatus, isFetched]);

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
        <>
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
        </>
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
