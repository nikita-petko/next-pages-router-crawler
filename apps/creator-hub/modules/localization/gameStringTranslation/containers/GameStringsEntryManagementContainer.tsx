import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Divider, Typography, ReportProblemOutlinedIcon } from '@rbx/ui';
import {
  addEntryEventModel,
  type TrackerClientRequest,
} from '@modules/eventStream/constants/eventConstants';
import CreatorDashboardContext from '@modules/eventStream/enum/CreatorDashboardContext';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import CreatorDashboardSource from '@modules/eventStream/enum/CreatorDashboardSource';
import CreatorDashboardUserResponse from '@modules/eventStream/enum/CreatorDashboardUserResponse';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import getIdentifier from '../../translation/utils/getIdentifier';
import EntryAdder from '../components/EntryAdder';
import GameStringsEntryUpdater from '../components/GameStringsEntryUpdater';
import useEntryInformation from '../hooks/useEntryInformation';
import useEntryManagement from '../hooks/useEntryManagement';
import useTranslationHistory from '../hooks/useTranslationHistory';
import type { TranslationInfo, TranslationEntry } from '../types';
import GameStringsEntryListContainer from './GameStringsEntryListContainer';
import useGameStringsEntryManagementContainerStyles from './GameStringsEntryManagementContainer.styles';

const GameStringsManagementContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const { trackerClient } = useEventTrackerProvider();
  const {
    classes: { verticalDivider, operationSide, errorText, errorTextGrid },
  } = useGameStringsEntryManagementContainerStyles();
  const { getUpdatedTranslation } = useTranslationHistory();
  const { fullEntryInfoMap, fullEntryKeySet, fullEntryList, addEntry, modifyEntry, deleteEntry } =
    useEntryManagement();
  const {
    gameId,
    entryTableId,
    currentLanguageOrLocaleCode,
    fetchEntryTableIdError,
    tableIdLoading,
  } = useEntryManagementMetadata();
  const { isFullTableLoadingNotStarted, isFetchingFullEntryTable } = useEntryInformation();
  const { translate } = useTranslation();
  const [activeEntryKey, setActiveEntryKey] = useState<string | null>(null);
  const [lastActiveEntryKey, setLastActiveEntryKey] = useState<string | null>(null);
  const [showAddEntryPanel, setShowAddEntryPanel] = useState<boolean>(false);

  const entryInfo = useMemo(() => {
    if (activeEntryKey) {
      const currInfo = fullEntryInfoMap.get(activeEntryKey);
      if (currInfo !== undefined) {
        return currInfo;
      }
    }
    return null;
  }, [activeEntryKey, fullEntryInfoMap]);

  const handleClickEntry = useCallback(
    async (entryKey: string | null) => {
      setActiveEntryKey(entryKey);
      if (entryInfo && gameId && currentLanguageOrLocaleCode && activeEntryKey) {
        const translation = await getUpdatedTranslation(
          entryTableId,
          gameId,
          currentLanguageOrLocaleCode,
          entryInfo,
        );
        if (
          translation !== null &&
          translation.translation.translationText !== entryInfo.currentTranslation
        ) {
          modifyEntry(activeEntryKey, translation);
        }
      }
    },
    [
      entryInfo,
      gameId,
      currentLanguageOrLocaleCode,
      entryTableId,
      activeEntryKey,
      modifyEntry,
      getUpdatedTranslation,
    ],
  );

  const handleClickAddEntry = () => {
    setShowAddEntryPanel(true);
    if (activeEntryKey !== null) {
      setLastActiveEntryKey(activeEntryKey);
    }
    setActiveEntryKey(null);
  };

  const handleCancelAddEntry = () => {
    setShowAddEntryPanel(false);
    setActiveEntryKey(lastActiveEntryKey);
    trackerClient.sendEvent(
      addEntryEventModel(null, null, null, null, gameId, CreatorDashboardUserResponse.Cancel),
    );
  };

  const handleEntryAddOperationSuccess = (translationEntry: TranslationEntry) => {
    addEntry(translationEntry);
    setActiveEntryKey(
      getIdentifier(
        translationEntry?.identifier?.source ?? null,
        translationEntry.identifier?.context ?? null,
      ),
    );
    const addEntryTrackerClientRequest: TrackerClientRequest = {
      eventType: CreatorDashboardEventType.SelectAddTranslationEntry,
      context: CreatorDashboardContext.Click,
      additionalProperties: {
        Source: CreatorDashboardSource.TranslationStringsTab,
      },
    };
    trackerClient.sendEvent(addEntryTrackerClientRequest);
  };

  const handleEntryModifyOperationSuccess = async (translationInfo: TranslationInfo) => {
    if (entryInfo && gameId && currentLanguageOrLocaleCode && activeEntryKey) {
      const translation = await getUpdatedTranslation(
        entryTableId,
        gameId,
        currentLanguageOrLocaleCode,
        entryInfo,
      );
      // there could be a discrepency when Roblox Translate updates the translation
      // after a translation becomes Automatic
      // so we use latest translation history as the source of truth
      let latestTranslationInfo = translationInfo;
      if (translation && translation.translation !== translationInfo.translation) {
        latestTranslationInfo = translation;
      }
      modifyEntry(activeEntryKey, latestTranslationInfo);
    }
  };

  const handleEntryDeleteOperationSuccess = () => {
    if (entryInfo) {
      deleteEntry(entryInfo);
    }
  };

  const isLoading = useMemo(() => {
    return tableIdLoading || isFullTableLoadingNotStarted;
  }, [tableIdLoading, isFullTableLoadingNotStarted]);

  if (fetchEntryTableIdError) {
    return (
      <Grid className={errorTextGrid} container justifyContent='center' alignItems='center'>
        <ReportProblemOutlinedIcon />
        <Typography className={errorText} variant='alertTitle'>
          {translate('Message.FailedToFetchEntryData')}
        </Typography>
      </Grid>
    );
  }
  return (
    <Grid container wrap='nowrap'>
      <GameStringsEntryListContainer
        fullList={fullEntryList}
        isLoadingEntryList={isLoading}
        activeEntryKey={activeEntryKey}
        onSelectEntry={handleClickEntry}
        toggleAddEntryPanel={setShowAddEntryPanel}
        onAddEntryClick={handleClickAddEntry}
      />
      <Divider orientation='vertical' className={verticalDivider} />
      <Grid className={operationSide}>
        {showAddEntryPanel && (
          <EntryAdder
            entryIdentifierSet={new Set(fullEntryInfoMap.keys())}
            entryKeySet={fullEntryKeySet}
            onSelectEntry={handleClickEntry}
            toggleAddEntryPanel={setShowAddEntryPanel}
            onCancel={handleCancelAddEntry}
            onAddSuccess={handleEntryAddOperationSuccess}
          />
        )}
        {!showAddEntryPanel && activeEntryKey !== null && entryInfo && (
          <GameStringsEntryUpdater
            isFullTableLoading={isFetchingFullEntryTable}
            entryInfo={entryInfo}
            onClickEntry={handleClickEntry}
            onDeleteEntry={handleEntryDeleteOperationSuccess}
            onModifyEntry={handleEntryModifyOperationSuccess}
          />
        )}
      </Grid>
    </Grid>
  );
};

export default GameStringsManagementContainer;
