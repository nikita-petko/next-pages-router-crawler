import { gameInternationalizationClient, GameNameAndDescriptionData } from '@modules/clients';
import { useTranslation } from '@rbx/intl';
import React, {
  Fragment,
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { updateUniverseInformationEventModel } from '@modules/eventStream/constants/eventConstants';
import { Divider } from '@rbx/ui';
import { RobloxGameInternationalizationApiNameDescriptionUpdateTypeEnum } from '@rbx/clients/gameinternationalization/v1';
import { failedToSaveTranslationMessage, textFilterErrorMessage } from '../../common/constants';
import TranslationDetails from '../../translation/components/TranslationDetails';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import { getUniverseTranslationType } from '../../common/utils/translationTypeUtils';
import { maxDescriptionTranslationCharacters, maxNameTranslationCharacters } from '../constants';
import GameInfoField from '../enums/GameInfoField';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { GameInfoTranslationInfo } from '../types';
import errorParser from '../utils/errorParser';
import TranslationHistory from '../../gameStringTranslation/components/TranslationHistory';
import useTranslationHistory from '../../gameStringTranslation/hooks/useTranslationHistory';

export interface SaveGameInfoTranslationProps {
  entryInfo: GameInfoTranslationInfo;
  isLoading: boolean;
  onSaveSuccess: () => void;
}

const SaveGameInfoTranslation: FunctionComponent<
  React.PropsWithChildren<SaveGameInfoTranslationProps>
> = ({ entryInfo, isLoading, onSaveSuccess }) => {
  const { trackerClient } = useEventTrackerProvider();
  const { translate } = useTranslation();
  const { gameId, currentLanguageOrLocaleCode, activeTranslationTarget, sourceLanguageCode } =
    useEntryManagementMetadata();
  const { showSuccessToast, showFailureToast } = useShowToastMessage();
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const {
    gameContentTranslationHistory,
    gameContentTranslationHistoryFetchingError,
    isGameContentTranslationHistoryLoading,
    getGameContentTranslationHistory,
  } = useTranslationHistory();

  const getTranslationHistory = useCallback(
    (entry: GameInfoTranslationInfo, universeId: number) => {
      const translationProductType = getUniverseTranslationType(entry);
      getGameContentTranslationHistory(
        translationProductType,
        universeId,
        currentLanguageOrLocaleCode ?? 'en',
      );
    },
    [getGameContentTranslationHistory, currentLanguageOrLocaleCode],
  );

  useEffect(() => {
    let isMounted = true;
    if (entryInfo && gameId && isMounted) {
      getTranslationHistory(entryInfo, gameId);
    }
    return () => {
      isMounted = false;
    };
  }, [entryInfo, gameId, activeTranslationTarget, getTranslationHistory]);

  const identifier = useMemo(() => {
    return entryInfo.fieldType + currentLanguageOrLocaleCode;
  }, [entryInfo, currentLanguageOrLocaleCode]);

  const handleSaveGameInfoTranslation = useCallback(
    async (currentTranslation: string | null) => {
      const translationToSave = currentTranslation?.trim() ?? '';
      trackerClient.sendEvent(
        updateUniverseInformationEventModel(
          entryInfo.fieldType,
          entryInfo.sourceText,
          translationToSave,
          gameId ?? null,
          currentLanguageOrLocaleCode ?? '',
        ),
      );
      try {
        if (!gameId) {
          throw new Error('Game Id is null');
        }
        if (!currentLanguageOrLocaleCode) {
          throw new Error('Current language code is null');
        }
        setIsSaving(true);
        const requestData =
          entryInfo.fieldType === GameInfoField.Name
            ? ([
                {
                  name: translationToSave,
                  updateType: RobloxGameInternationalizationApiNameDescriptionUpdateTypeEnum.Name,
                  languageCode: currentLanguageOrLocaleCode,
                },
              ] as GameNameAndDescriptionData[])
            : ([
                {
                  description: translationToSave,
                  updateType:
                    RobloxGameInternationalizationApiNameDescriptionUpdateTypeEnum.Description,
                  languageCode: currentLanguageOrLocaleCode,
                },
              ] as GameNameAndDescriptionData[]);
        const response = await gameInternationalizationClient.updateGameNameAndDescription({
          gameId,
          request: { data: requestData },
        });

        const { failedOperations } = response;
        if (Array.isArray(failedOperations) && failedOperations.length > 0) {
          throw errorParser(failedOperations);
        }
        getTranslationHistory(entryInfo, gameId);
        showSuccessToast(translate('Message.TranslationSaved'));
        onSaveSuccess();
      } catch (e) {
        const catchedError = e as Error;
        const errorMsg =
          catchedError.message === textFilterErrorMessage
            ? textFilterErrorMessage
            : failedToSaveTranslationMessage;
        showFailureToast(translate(errorMsg));
      } finally {
        setIsSaving(false);
      }
    },
    [
      entryInfo,
      currentLanguageOrLocaleCode,
      gameId,
      trackerClient,
      getTranslationHistory,
      onSaveSuccess,
      showSuccessToast,
      showFailureToast,
      translate,
    ],
  );

  return gameId && currentLanguageOrLocaleCode ? (
    <Fragment>
      <TranslationDetails
        entryInfo={entryInfo}
        identifier={identifier}
        sourceLanguageCode={sourceLanguageCode}
        isLoading={isSaving || isLoading}
        maxCharacters={
          entryInfo.fieldType === GameInfoField.Name
            ? maxNameTranslationCharacters
            : maxDescriptionTranslationCharacters
        }
        onSave={handleSaveGameInfoTranslation}
      />
      <Divider />
      <TranslationHistory
        error={gameContentTranslationHistoryFetchingError}
        isLoading={isGameContentTranslationHistoryLoading}
        entries={gameContentTranslationHistory ?? []}
      />
    </Fragment>
  ) : null;
};

export default SaveGameInfoTranslation;
