import type { TranslationKeyToFormattedText } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isValidMoneyString, MAX_MONEY_BUDGET_USD } from './formatters';

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
      if (parsedNumber < 1 || parsedNumber > MAX_MONEY_BUDGET_USD) {
        return translate(
          translationKey('Error.InvalidNumberOutsideOfBounds', TranslationNamespace.CloudServices),
        );
      }
      return true;
    },
  };
}
