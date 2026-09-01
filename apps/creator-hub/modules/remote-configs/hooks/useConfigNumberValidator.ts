import { useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
// Import shared types
import type { Validator } from './validatorTypes';
import { ValidationError } from './validatorTypes';

const useConfigNumberValidator = () => {
  const { translate } = useTranslationWrapper(useTranslation());

  const validateConfigNumberValue: Validator<
    string,
    ValidationError.InvalidNumber | ValidationError.EmptyValue
  > = useCallback(
    ({ value, errorMessageOverrides }) => {
      // Trim whitespace
      const numberString = value.trim();
      if (numberString.length === 0) {
        const error = ValidationError.EmptyValue;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverrides?.[error] ??
              translationKey(
                'Message.ExperimentCreation.VariantNumberValueRequired',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
          ),
        };
      }

      function isDigit(char: string): boolean {
        return char >= '0' && char <= '9';
      }

      function isExponentMarker(char: string): boolean {
        return char === 'e' || char === 'E';
      }

      const enum State {
        START,
        SIGN,
        LEADING_ZERO,
        INTEGER,
        DECIMAL_POINT,
        FRACTION,
        EXPONENT_MARKER,
        EXPONENT_SIGN,
        EXPONENT_DIGITS,
        DONE,
        ERROR,
      }

      const numberValue = parseFloat(value);
      let isValidNumber: boolean;
      // Handle special values
      if (numberString === 'Infinity' || numberString === '-Infinity') {
        isValidNumber = false;
      } else if (Number.isNaN(numberValue)) {
        isValidNumber = false;
      } else {
        // Initialize state machine
        let state = State.START;
        let i = 0;
        let hasDigits = false;

        while (i < numberString.length && state !== State.ERROR) {
          const char = numberString[i];

          switch (state) {
            case State.START:
              if (char === '+' || char === '-') {
                state = State.SIGN;
              } else if (char === '0') {
                state = State.LEADING_ZERO;
                hasDigits = true;
              } else if (char === '.') {
                state = State.DECIMAL_POINT;
              } else if (isDigit(char)) {
                state = State.INTEGER;
                hasDigits = true;
              } else {
                state = State.ERROR;
              }
              break;

            case State.SIGN:
              if (char === '0') {
                state = State.LEADING_ZERO;
                hasDigits = true;
              } else if (char === '.') {
                state = State.DECIMAL_POINT;
              } else if (isDigit(char)) {
                state = State.INTEGER;
                hasDigits = true;
              } else {
                state = State.ERROR;
              }
              break;

            case State.LEADING_ZERO:
              if (char === '.') {
                state = State.DECIMAL_POINT;
              } else if (isExponentMarker(char)) {
                state = State.EXPONENT_MARKER;
              } else if (isDigit(char)) {
                // No additional leading digits allowed after 0
                state = State.ERROR;
              } else {
                state = State.ERROR;
              }
              break;

            case State.INTEGER:
              if (char === '.') {
                state = State.DECIMAL_POINT;
              } else if (isExponentMarker(char)) {
                state = State.EXPONENT_MARKER;
              } else if (isDigit(char)) {
                // Stay in INTEGER state
              } else {
                state = State.ERROR;
              }
              break;

            case State.DECIMAL_POINT:
              if (isDigit(char)) {
                state = State.FRACTION;
                hasDigits = true;
              } else if (isExponentMarker(char) && hasDigits) {
                state = State.EXPONENT_MARKER;
              } else if (i === numberString.length - 1 && hasDigits) {
                // Allow trailing decimal point if we've seen digits
                state = State.DONE;
              } else {
                state = State.ERROR;
              }
              break;

            case State.FRACTION:
              if (isExponentMarker(char)) {
                state = State.EXPONENT_MARKER;
              } else if (isDigit(char)) {
                // Stay in FRACTION state
              } else {
                state = State.ERROR;
              }
              break;

            case State.EXPONENT_MARKER:
              if (char === '+' || char === '-') {
                state = State.EXPONENT_SIGN;
              } else if (isDigit(char)) {
                state = State.EXPONENT_DIGITS;
              } else {
                state = State.ERROR;
              }
              break;

            case State.EXPONENT_SIGN:
              if (isDigit(char)) {
                state = State.EXPONENT_DIGITS;
              } else {
                state = State.ERROR;
              }
              break;

            case State.EXPONENT_DIGITS:
              if (!isDigit(char)) {
                state = State.ERROR;
              }
              break;

            default:
              state = State.ERROR;
              break;
          }

          i += 1;
        }

        // Check if we ended in a valid state and had at least one digit
        const isValidState =
          state === State.LEADING_ZERO ||
          state === State.INTEGER ||
          state === State.FRACTION ||
          state === State.EXPONENT_DIGITS ||
          state === State.DONE ||
          (state === State.DECIMAL_POINT && hasDigits);

        isValidNumber = isValidState && hasDigits;
      }

      if (!isValidNumber) {
        const error = ValidationError.InvalidNumber;
        return {
          isValid: false,
          error,
          message: translate(
            errorMessageOverrides?.[error] ??
              translationKey(
                'Dialog.CreateOrEdit.Error.InvalidNumber',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
          ),
        };
      }

      return {
        isValid: true,
      };
    },
    [translate],
  );

  return validateConfigNumberValue;
};

export default useConfigNumberValidator;
