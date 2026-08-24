import type { SupportedLanguagesDataResponse } from '@modules/clients/gameInternationalization';
import { chineseSimplifiedLanguageCode } from '../constants';
import type { TranslationLanguage } from '../types/TranslationLanguage';
import type TranslationTarget from '../types/TranslationTarget';

export function parseTranslationTargets(languageWithLocales: SupportedLanguagesDataResponse): {
  defaultTarget: TranslationTarget;
  childTargets: TranslationTarget[];
} {
  const languageCode = languageWithLocales.languageFamily?.languageCode ?? '';
  // parent language
  const defaultTarget: TranslationTarget = {
    isDefaultTarget: true,
    languageCode,
    translationKey: languageWithLocales.languageFamily?.languageCode ?? '',
    displayName: languageWithLocales.languageFamily?.name ?? '',
  };

  // child locales
  let childTargets: TranslationTarget[] = [];
  if (
    languageWithLocales.childLocales &&
    languageWithLocales.childLocales.length > 1 &&
    languageCode !== chineseSimplifiedLanguageCode
  ) {
    childTargets = languageWithLocales.childLocales?.map((locale): TranslationTarget => ({
      isDefaultTarget: false,
      languageCode: locale.language?.languageCode ?? '',
      translationKey: locale.localeCode ?? '',
      displayName: locale.name ?? '',
    }));
  }

  return {
    defaultTarget,
    childTargets,
  };
}

export function parseTranslationLanguage(
  languageCode: string,
  displayName: string,
  defaultTarget: TranslationTarget,
  childTargets: TranslationTarget[],
) {
  return {
    languageCode,
    displayName,
    defaultLocalizationTarget: defaultTarget,
    childLocalizationTargets: childTargets,
  };
}

export function parseSupportedLanguageList(responseData: Array<SupportedLanguagesDataResponse>): {
  languageList: Array<TranslationLanguage>;
  translationTargetMap: Map<string, TranslationTarget>;
} {
  const translationTargetMap = new Map<string, TranslationTarget>();
  const languageList = responseData.map((item) => {
    if (
      !item.languageFamily ||
      !item.childLocales ||
      item.childLocales.length === 0 ||
      !item.childLocales[0].localeCode ||
      !item.languageFamily.languageCode ||
      !item.languageFamily.name
    ) {
      throw new Error('Missing or incomplete language response.');
    }
    const { defaultTarget, childTargets } = parseTranslationTargets(item);

    translationTargetMap.set(defaultTarget.translationKey, defaultTarget);
    childTargets.forEach((target) => translationTargetMap.set(target.translationKey, target));

    return parseTranslationLanguage(
      item.languageFamily.languageCode,
      item.languageFamily.name,
      defaultTarget,
      childTargets,
    );
  });

  return {
    languageList,
    translationTargetMap,
  };
}
