import { SupportedLanguagesDataResponse } from '@modules/clients';
import { TranslationLanguage } from '../types/TranslationLanguage';
import TranslationTarget from '../types/TranslationTarget';
import { chineseSimplifiedLanguageCode } from '../constants';

export function parseTranslationTargets(
  areChildLocalesSupported: boolean,
  languageWithLocales: SupportedLanguagesDataResponse,
): {
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
    areChildLocalesSupported &&
    languageWithLocales.childLocales &&
    languageWithLocales.childLocales.length > 1 &&
    languageCode !== chineseSimplifiedLanguageCode
  ) {
    childTargets = languageWithLocales.childLocales?.map(
      (locale) =>
        ({
          isDefaultTarget: false,
          languageCode: locale.language?.languageCode ?? '',
          translationKey: locale.localeCode,
          displayName: locale.name,
        }) as TranslationTarget,
    );
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

export function parseSupportedLanguageList(
  areChildLocalesSupported: boolean,
  responseData: Array<SupportedLanguagesDataResponse>,
): {
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
      throw Error('Missing or incomplete language response.');
    }
    const { defaultTarget, childTargets } = parseTranslationTargets(areChildLocalesSupported, item);

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
