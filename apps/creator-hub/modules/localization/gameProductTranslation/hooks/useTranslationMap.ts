import { useReducer } from 'react';
import TranslationMapEvents from '../enums/TranslationMapEvents';
import type { TranslationActions } from '../types';

type TranslationState<T> = {
  translations: Map<string, T>;
};

function reducers<T>(state: TranslationState<T>, action: TranslationActions<T>) {
  switch (action.type) {
    case TranslationMapEvents.SetTranslationMap:
      return {
        translations: action.translations,
      };
    case TranslationMapEvents.SetTranslation:
      if (action.translation === null) {
        state.translations.delete(action.languageCode);
      } else {
        state.translations.set(action.languageCode, action.translation);
      }
      return {
        translations: new Map(state.translations),
      };
    default:
      throw new Error(`Unexpected action type: ${JSON.stringify(action)}`);
  }
}

function useTranslationMap<T>() {
  const [state, dispatch] = useReducer(reducers, {
    translations: new Map<string, T>(),
  });
  return {
    setTranslationMap: (translations: Map<string, T>) =>
      dispatch({
        type: TranslationMapEvents.SetTranslationMap,
        translations,
      }),
    setTranslation: (languageCode: string, translation: T | null) =>
      dispatch({
        type: TranslationMapEvents.SetTranslation,
        languageCode,
        translation,
      }),
    translationMap: state.translations,
  };
}

export default useTranslationMap;
