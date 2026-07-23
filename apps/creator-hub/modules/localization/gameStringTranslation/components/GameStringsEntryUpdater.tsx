import React, { Fragment, FunctionComponent, useCallback, useEffect, useState } from 'react';
import {
  ChangeAgentType,
  extractStringValueFromError,
  localizationTableClient,
} from '@modules/clients';
import { useMetricsMonitoring } from '@modules/miscellaneous/metricsMonitoring';
import { useSettings } from '@modules/settings';
import { useTranslation } from '@rbx/intl';
import { DeleteOutlinedIcon, Divider, Grid, IconButton } from '@rbx/ui';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import SaveTranslationChangeAgent from '../../common/components/SaveTranslationChangeAgent';
import useGameStringsEntryManagementContainerStyles from '../containers/GameStringsEntryManagementContainer.styles';
import useTranslationHistory from '../hooks/useTranslationHistory';
import { GameStringTranslationInfo, TranslationInfo } from '../types';
import DeleteEntry from './DeleteEntry';
import ManualFeedback from './ManualFeedback';
import MoreInformation from './MoreInformation';
import SaveGameStringTranslation from './SaveGameStringTranslation';
import TranslationHistory from './TranslationHistory';
import useTranslationFeedback from '../hooks/useTranslationFeedback';
import { placeHolderTableName } from '../constants';

export interface GameStringsEntryUpdaterProps {
  isFullTableLoading: boolean;
  entryInfo: GameStringTranslationInfo;
  onClickEntry: (entryKey: string | null) => void;
  onModifyEntry: (translationInfo: TranslationInfo) => Promise<void>;
  onDeleteEntry: () => void;
}

const GameStringsEntryUpdater: FunctionComponent<
  React.PropsWithChildren<GameStringsEntryUpdaterProps>
> = ({ entryInfo, isFullTableLoading, onClickEntry, onModifyEntry, onDeleteEntry }) => {
  const { isRoleAdmin, gameId, entryTableId, currentLanguageOrLocaleCode, sourceLanguageCode } =
    useEntryManagementMetadata();
  const {
    translationHistory,
    isTranslationHistoryLoading,
    translationHistoryFetchingError,
    getFullTranslationHistory,
  } = useTranslationHistory();
  const {
    isFeedbackLoading,
    feedbackFetchingError,
    translationFeedback,
    getEntryTranslationFeedback,
  } = useTranslationFeedback();
  const { translate } = useTranslation();
  const { error } = useMetricsMonitoring();
  const { settings } = useSettings();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const {
    classes: { deleteIconGrid, deleteIconButton },
  } = useGameStringsEntryManagementContainerStyles();
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const getTranslationHistory = useCallback(
    async (entry: GameStringTranslationInfo) => {
      if (gameId && currentLanguageOrLocaleCode) {
        await getFullTranslationHistory(entryTableId, gameId, currentLanguageOrLocaleCode, entry);
        if (settings.enableManualTranslationFeedback) {
          await getEntryTranslationFeedback(sourceLanguageCode, currentLanguageOrLocaleCode, entry);
        }
      }
    },
    [
      sourceLanguageCode,
      currentLanguageOrLocaleCode,
      settings.enableManualTranslationFeedback,
      entryTableId,
      gameId,
      getEntryTranslationFeedback,
      getFullTranslationHistory,
    ],
  );

  useEffect(() => {
    let isMounted = true;
    if (entryInfo && isMounted && !isFullTableLoading) {
      getTranslationHistory(entryInfo);
    }
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TODO: decouple getTranslationHistory from useEffect
  }, [entryInfo]);

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleSaveGameStringTranslation = useCallback(
    async (currentTranslation: string | null, isTranslationManual: boolean) => {
      try {
        if (!gameId) {
          throw new Error('Game Id is null');
        }
        if (!currentLanguageOrLocaleCode) {
          throw new Error('Current language code is undefined');
        }
        setIsSaving(true);
        const updatedTranslation = currentTranslation?.trim() ?? '';
        const changeAgentType = isTranslationManual
          ? ChangeAgentType.User
          : ChangeAgentType.Automation;
        const response = await localizationTableClient.modifyEntry({
          gameId,
          tableId: entryTableId,
          request: {
            entries: [
              {
                identifier: {
                  source: entryInfo?.sourceText,
                  context: entryInfo?.context ?? '',
                  key: entryInfo?.key ?? '',
                },
                metadata: {
                  gameLocations: entryInfo?.gameLocationsForRequest ?? [],
                  example: entryInfo?.example ?? '',
                },
                translations: [
                  {
                    locale: currentLanguageOrLocaleCode,
                    translationText: updatedTranslation,
                    changeAgent: {
                      changeAgentType,
                    },
                  },
                ],
              },
            ],
            name: placeHolderTableName,
          },
        });
        if ((response.failedEntriesAndTranslations?.length ?? 0) > 0) {
          throw new Error('Failed to save translation');
        }
        const successfulTranslation = {
          languageCode: currentLanguageOrLocaleCode,
          translation: {
            translationText: updatedTranslation,
            createdTime: new Date(),
          },
          changeAgent: {
            changeAgentType,
          },
        };
        await onModifyEntry(successfulTranslation);
        showSuccessToast(translate('Message.TranslationSaved'));
      } catch (e) {
        error(extractStringValueFromError(e, 'message', ''));
        showFailureToast(translate('Message.FailedToSaveTranslation'));
      } finally {
        setIsSaving(false);
      }
    },
    [
      gameId,
      currentLanguageOrLocaleCode,
      entryTableId,
      entryInfo,
      onModifyEntry,
      showSuccessToast,
      translate,
      error,
      showFailureToast,
    ],
  );

  return (
    <Fragment>
      <SaveGameStringTranslation
        entryInfo={entryInfo}
        isLoading={isFullTableLoading}
        isSaving={isSaving}
        onSave={handleSaveGameStringTranslation}
      />
      {isRoleAdmin && (
        <Grid item className={deleteIconGrid}>
          <IconButton aria-label='delete' className={deleteIconButton} onClick={handleOpenDialog}>
            <DeleteOutlinedIcon color='secondary' />
          </IconButton>
          <DeleteEntry
            isDialogOpen={isDialogOpen}
            entryInfo={entryInfo}
            onSelectEntry={onClickEntry}
            onClose={handleCloseDialog}
            onDeleteSuccess={onDeleteEntry}
          />
        </Grid>
      )}
      {settings.enableAutomaticTranslationUpdates && (
        <SaveTranslationChangeAgent
          entryInfo={entryInfo}
          isLoading={isFullTableLoading || isSaving}
          onSave={handleSaveGameStringTranslation}
        />
      )}
      <Divider />
      {settings.enableManualTranslationFeedback && translationFeedback.length > 0 && (
        <ManualFeedback
          error={feedbackFetchingError}
          isLoading={isFeedbackLoading}
          translationFeedback={translationFeedback}
          onSave={handleSaveGameStringTranslation}
        />
      )}
      <Divider />
      <MoreInformation
        translationContext={entryInfo.context}
        translationExample={entryInfo.example}
        translationKey={entryInfo.key}
        translationLocation={entryInfo.gameLocationsForDisplay}
      />
      <Divider />
      <TranslationHistory
        error={translationHistoryFetchingError}
        isLoading={isFullTableLoading || isTranslationHistoryLoading}
        entries={translationHistory ?? []}
      />
    </Fragment>
  );
};

export default GameStringsEntryUpdater;
