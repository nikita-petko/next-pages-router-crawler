import React, { useState } from 'react';
import { TextField, TTextFieldProps } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

interface BaseProps extends TTextFieldProps {
  value?: string;
  // If true, the explicit helper text will be shown only when the field is focused or in error state
  showHelperTextOnlyOnFocusOrError?: boolean;
}

type ShowCharacterCountEnabledOptions = {
  maxLength: number;
  showCharacterCount: true;
  showCharacterCountOnlyOnFocusOrError?: boolean;
};

type ShowCharacterCountDisabledOptions = {
  showCharacterCount?: false;
};
type Props = BaseProps & (ShowCharacterCountEnabledOptions | ShowCharacterCountDisabledOptions);

/**
 * A TextField wrapper provides additional helper text functionality.
 */
export const TextFieldWithEnhancedHelperText = React.forwardRef<HTMLInputElement, Props>(
  (props, ref) => {
    const { showHelperTextOnlyOnFocusOrError, ...textFieldProps } = props;
    const { value, showCharacterCount, helperText, error } = textFieldProps;
    const { translate } = useTranslation();
    const characterCount = value?.length || 0;
    const [isFocused, setIsFocused] = useState(false);
    const getCharacterCountHelperText = (maxLength: number) => {
      return characterCount === 0
        ? translate('Label.UpToLengthChars', { maxLength: maxLength.toString() })
        : translate('Label.CurrentAndMaxCharacters', {
            characterCount: characterCount.toString(),
            maxLength: maxLength.toString(),
          });
    };
    let displayHelperText: React.ReactNode | undefined;
    // See if we have an explicit helper text
    if (helperText) {
      if (!showHelperTextOnlyOnFocusOrError) {
        displayHelperText = helperText;
      } else if (showHelperTextOnlyOnFocusOrError && (isFocused || error)) {
        displayHelperText = helperText;
      }
    }

    // If no explicit helper text and showCharacterCount is enabled, check to see if we should show the character count helper text only on focus or error
    if (!displayHelperText && showCharacterCount) {
      if (textFieldProps.showCharacterCountOnlyOnFocusOrError && (isFocused || error)) {
        displayHelperText = getCharacterCountHelperText(textFieldProps.maxLength);
      } else if (!textFieldProps.showCharacterCountOnlyOnFocusOrError) {
        displayHelperText = getCharacterCountHelperText(textFieldProps.maxLength);
      }
    }

    return (
      <TextField
        {...textFieldProps}
        ref={ref}
        value={value}
        helperText={displayHelperText}
        onFocus={(event) => {
          props.onFocus?.(event);
          setIsFocused(true);
        }}
        onBlur={(event) => {
          props.onBlur?.(event);
          setIsFocused(false);
        }}
      />
    );
  },
);

TextFieldWithEnhancedHelperText.displayName = 'TextFieldWithEnhancedHelperText';

export const getMaxLengthValidationRule = (
  maxLength: number,
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
) => {
  return (value: string) => {
    const characterCount = value?.length || 0;
    if (value.length > maxLength) {
      return translate('Label.CurrentAndMaxCharacters', {
        characterCount: characterCount.toString(),
        maxLength: maxLength.toString(),
      });
    }
    return true;
  };
};

export const getMinMaxLengthValidationRule = (
  minLength: number,
  maxLength: number,
  translate: (
    key: string,
    args?: {
      [key: string]: string;
    },
  ) => string,
) => {
  return (value: string) => {
    const characterCount = value?.length || 0;
    if (value.length > maxLength) {
      return translate('Label.CurrentAndMaxCharacters', {
        characterCount: characterCount.toString(),
        maxLength: maxLength.toString(),
      });
    }
    if (value.length < minLength) {
      return translate('Label.CurrentAndMinCharacters', {
        characterCount: characterCount.toString(),
        minLength: minLength.toString(),
      });
    }
    return true;
  };
};
