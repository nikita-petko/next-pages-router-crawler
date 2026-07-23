import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import type { TranslationEntryTable } from '@modules/clients/localizationTables';
import { ChangeAgentType } from '@modules/clients/localizationTables';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import getIdentifier from '../../translation/utils/getIdentifier';
import type { EntryManagementActionTypes, EntryTableState } from '../entryManagementActionTypes';
import EntryManagementAction from '../enums/EntryManagementAction';
import useEntryInformation from '../hooks/useEntryInformation';
import type {
  EntryBriefInfo,
  GameStringTranslationInfo,
  TranslationInfo,
  TranslationEntry,
} from '../types';
import type { EntriesMetadataValue } from './EntriesMetadataContext';
import EntriesMetadataContext from './EntriesMetadataContext';

const EntriesMetadataProvider: FunctionComponent<React.PropsWithChildren> = ({ children }) => {
  const { batchedEntries } = useEntryInformation();
  const { currentLanguageOrLocaleCode, activeTranslationTarget } = useEntryManagementMetadata();

  const getEntryKeySet = useCallback((entryTable: TranslationEntryTable) => {
    const innerEntryKeySet = new Set<string>();
    entryTable?.forEach((entry) => {
      if (entry.identifier?.key) {
        innerEntryKeySet.add(entry.identifier.key);
      }
    });
    return innerEntryKeySet;
  }, []);

  const getEntryListAndFeedbackTuple = useCallback(
    (entryTable: TranslationEntryTable): [EntryBriefInfo[], boolean] => {
      const innerEntryList: EntryBriefInfo[] = [];
      let doesTranslationFeedbackExist = false;
      entryTable?.forEach((entry) => {
        const currTranslation = entry.translations?.find(
          (translation) => translation.locale === currentLanguageOrLocaleCode,
        );
        const isTranslated = !!currTranslation;
        const shouldShowFeedback = (currTranslation?.feedbackCount ?? 0) > 0;
        if (!doesTranslationFeedbackExist && shouldShowFeedback) {
          doesTranslationFeedbackExist = shouldShowFeedback;
        }
        const identifier = getIdentifier(
          entry.identifier?.source ?? null,
          entry.identifier?.context ?? null,
        );
        innerEntryList.push({
          identifier,
          sourceText: entry.identifier?.source ?? '',
          isTranslated,
          changeAgentType: currTranslation?.translator?.agentType ?? null,
          shouldShowFeedback,
          entryCreatedTime: entry.createdTime ?? null,
          translationUpdatedTime: currTranslation?.updatedTime ?? null,
        });
      });
      return [innerEntryList, doesTranslationFeedbackExist];
    },
    [currentLanguageOrLocaleCode],
  );

  const getEntryInfoMap = useCallback(
    (entryTable: TranslationEntryTable) => {
      const innerEntryInfoMap: Map<string, GameStringTranslationInfo> = new Map();
      entryTable?.forEach((entry) => {
        const globalTranslation = entry.translations?.find(
          (translation) => translation.locale === activeTranslationTarget?.languageCode,
        )?.translationText;
        const innerCurrentTranslation = entry.translations?.find(
          (translation) => translation.locale === currentLanguageOrLocaleCode,
        )?.translationText;
        const identifier = getIdentifier(
          entry.identifier?.source ?? null,
          entry.identifier?.context ?? null,
        );
        innerEntryInfoMap.set(identifier, {
          sourceText: entry.identifier?.source ?? '',
          context: entry.identifier?.context ?? null,
          key: entry.identifier?.key ?? null,
          example: entry.metadata?.example ?? null,
          gameLocationsForRequest: entry.metadata?.gameLocations ?? null,
          gameLocationsForDisplay:
            entry.metadata?.gameLocations
              ?.filter((location) => location?.path)
              .map((location) => location.path)
              .join(', ') ?? null,
          globalTranslation: globalTranslation ?? null,
          currentTranslation: innerCurrentTranslation ?? null,
          translations:
            entry.translations?.map((translation) => {
              return {
                languageCode: translation.locale ?? 'en',
                translation: {
                  translationText: translation.translationText?.replaceAll(/\n/g, ' ') ?? '',
                  createdTime: translation.updatedTime ?? new Date(),
                },
                changeAgent: {
                  changeAgentType: translation.translator?.agentType ?? ChangeAgentType.Automation,
                  changeAgentId: translation.translator?.id,
                },
              };
            }) ?? [],
        });
      });
      return innerEntryInfoMap;
    },
    [activeTranslationTarget, currentLanguageOrLocaleCode],
  );

  const reducer = (state: EntryTableState, action: EntryManagementActionTypes): EntryTableState => {
    switch (action.type) {
      case EntryManagementAction.ModifyEntry: {
        const { translation, entryKey } = action;
        const updatedTable = [...state.entryTable];

        const updatedTranslation = translation.translation.translationText;
        const { languageCode } = translation;
        const changeAgentType = translation.changeAgent?.changeAgentType;
        const { createdTime } = translation.translation;

        const currentEntry = updatedTable.find(
          (entry) =>
            getIdentifier(entry.identifier?.source ?? null, entry.identifier?.context ?? null) ===
            entryKey,
        );
        if (currentEntry?.translations) {
          const currTranslations = currentEntry.translations.find(
            (currTranslation) => currTranslation.locale === languageCode,
          );
          if (currTranslations && currTranslations.translator) {
            currTranslations.translationText = updatedTranslation;
            currTranslations.translator.agentType = changeAgentType;
            // we don't show feedback once the translation is updated
            if (currTranslations.feedbackCount && currTranslations.feedbackCount > 0) {
              currTranslations.feedbackCount = 0;
            }
          } else {
            currentEntry.translations.push({
              locale: languageCode,
              translationText: updatedTranslation,
              translator: {
                id: translation.changeAgent?.changeAgentId,
                agentType: changeAgentType,
              },
              updatedTime: createdTime ?? new Date(),
              feedbackCount: 0,
            });
          }
        }
        const [updatedEntryList, shouldShowFeedback] = getEntryListAndFeedbackTuple(updatedTable);

        return {
          entryTable: updatedTable,
          entryList: updatedEntryList,
          entryInfoMap: getEntryInfoMap(updatedTable),
          entryKeySet: getEntryKeySet(updatedTable),
          doesTranslationFeedbackExist: shouldShowFeedback,
        };
      }
      case EntryManagementAction.AddEntry: {
        const newEntry = { ...action.translationEntry, translations: [] };
        const newTable = [...state.entryTable];
        newTable.unshift(newEntry);
        const [updatedEntryList, shouldShowFeedback] = getEntryListAndFeedbackTuple(newTable);
        return {
          ...state,
          entryTable: newTable,
          entryList: updatedEntryList,
          entryInfoMap: getEntryInfoMap(newTable),
          entryKeySet: getEntryKeySet(newTable),
          doesTranslationFeedbackExist: shouldShowFeedback,
        };
      }
      case EntryManagementAction.DeleteEntry: {
        const { entryInfo } = action;
        const updatedTable = state.entryTable.filter(
          (entry) =>
            entry.identifier?.source !== entryInfo.sourceText ||
            entry.identifier?.context !== entryInfo.context,
        );
        const identifier = getIdentifier(entryInfo.sourceText, entryInfo.context);
        const updatedList = state.entryList.filter((entry) => entry.identifier !== identifier);
        return {
          ...state,
          entryTable: updatedTable,
          entryList: updatedList,
        };
      }
      case EntryManagementAction.UpdateEntryTableAttributes: {
        const newKeySet = getEntryKeySet(action.batchedEntries);
        const updatedKeySet = state.entryKeySet;
        newKeySet.forEach((entryKey) => state.entryKeySet.add(entryKey));
        const newInfoMap = getEntryInfoMap(action.batchedEntries);
        const updatedInfoMap = state.entryInfoMap;
        newInfoMap.forEach((value, key) => updatedInfoMap.set(key, value));
        const entryListTuple = getEntryListAndFeedbackTuple(action.batchedEntries);

        if (state.doesTranslationFeedbackExist && !entryListTuple[1]) {
          entryListTuple[1] = state.doesTranslationFeedbackExist;
        }
        return {
          ...state,
          entryTable: [...state.entryTable, ...action.batchedEntries],
          entryList: [...state.entryList, ...entryListTuple[0]],
          entryInfoMap: updatedInfoMap,
          entryKeySet: updatedKeySet,
          doesTranslationFeedbackExist: entryListTuple[1],
        };
      }
      case EntryManagementAction.UpdateFullEntryTable: {
        const { fullEntryTable } = action;
        const [updatedEntryList, shouldShowFeedback] = getEntryListAndFeedbackTuple(fullEntryTable);

        return {
          ...state,
          entryTable: fullEntryTable,
          entryList: updatedEntryList,
          entryInfoMap: getEntryInfoMap(fullEntryTable),
          entryKeySet: getEntryKeySet(fullEntryTable),
          doesTranslationFeedbackExist: shouldShowFeedback,
        };
      }
      default: {
        return state;
      }
    }
  };

  const [state, dispatch] = useReducer(reducer, {
    entryTable: [],
    entryKeySet: new Set<string>(),
    entryInfoMap: new Map(),
    entryList: [],
    doesTranslationFeedbackExist: false,
  });

  useEffect(() => {
    dispatch({
      type: EntryManagementAction.UpdateEntryTableAttributes,
      batchedEntries,
    });
  }, [batchedEntries]);

  useEffect(() => {
    dispatch({
      type: EntryManagementAction.UpdateFullEntryTable,
      fullEntryTable: state.entryTable,
    });
  }, [activeTranslationTarget, state.entryTable]);

  const metadataValue: EntriesMetadataValue = useMemo(() => {
    return {
      modifyEntry: (entryKey: string, translation: TranslationInfo) =>
        dispatch({
          type: EntryManagementAction.ModifyEntry,
          entryKey,
          translation,
        }),
      addEntry: (translationEntry: TranslationEntry) =>
        dispatch({
          type: EntryManagementAction.AddEntry,
          translationEntry,
        }),
      deleteEntry: (entryInfo: GameStringTranslationInfo) =>
        dispatch({
          type: EntryManagementAction.DeleteEntry,
          entryInfo,
        }),
      fullEntryTable: state.entryTable,
      fullEntryList: state.entryList,
      fullEntryKeySet: state.entryKeySet,
      fullEntryInfoMap: state.entryInfoMap,
      doesTranslationFeedbackExist: state.doesTranslationFeedbackExist,
    };
  }, [
    state.entryTable,
    state.entryList,
    state.entryKeySet,
    state.doesTranslationFeedbackExist,
    state.entryInfoMap,
  ]);

  return (
    <EntriesMetadataContext.Provider value={metadataValue}>
      {children}
    </EntriesMetadataContext.Provider>
  );
};

export default EntriesMetadataProvider;
