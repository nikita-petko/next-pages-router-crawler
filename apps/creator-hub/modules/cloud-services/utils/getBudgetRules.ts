import { translationKey, TranslationKeyToFormattedText } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidMoneyString } from './formatters';

type TranslateFunction = TranslationKeyToFormattedText;

export default function getBudgetRules(isUnlocked: boolean, translate: TranslateFunction) {
  return {
    validate: (input: string) => {
      if (!isUnlocked) {
        return true;
      }
      if (input === '') {
        return translate(
          translationKey('Error.BudgetLimitIsRequired', TranslationNamespace.CloudServices),
        );
      }
      if (!isValidMoneyString(input)) {
        return translate(translationKey('Error.InvalidNumber', TranslationNamespace.CloudServices));
      }
      const parsedNumber = Number(input);
      if (parsedNumber < 1) {
        return translate(
          translationKey('Error.InvalidNumberOutsideOfBounds', TranslationNamespace.CloudServices),
        );
      }
      if (parsedNumber > 99999.99) {
        return translate(
          translationKey('Error.InvalidNumberOutsideOfBounds', TranslationNamespace.CloudServices),
        );
      }
      return true;
    },
  };
}
