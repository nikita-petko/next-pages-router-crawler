import React, { useId, useMemo, useState, type CSSProperties } from 'react';
import type { TTextAreaSize, TTextInputSize } from '@rbx/foundation-ui';
import { clsx, TextArea, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';

const HELPER_TEXT_BODY_CLASS_BY_TEXT_AREA_SIZE: Record<TTextAreaSize, string> = {
  XSmall: 'text-body-small',
  Small: 'text-body-small',
  Medium: 'text-body-medium',
  Large: 'text-body-large',
};

/** Approximate line-height per row for `maxRows` overflow height on multiline fields. */
const ROW_HEIGHT_REM = 1.5;

const HELPER_TEXT_BODY_CLASS_BY_TEXT_INPUT_SIZE: Record<TTextInputSize, string> = {
  XSmall: 'text-body-small',
  Small: 'text-body-small',
  Medium: 'text-body-medium',
  Large: 'text-body-large',
};

export {
  getMaxLengthValidationRule,
  getMinMaxLengthValidationRule,
} from './TextFieldWithEnhancedHelperText';

type SharedProps = {
  value?: string;
  label?: string;
  'aria-label'?: string;
  placeholder?: string;
  /** Webblox-style disabled prop; maps to Foundation `isDisabled`. */
  disabled?: boolean;
  /** Foundation-style disabled prop. */
  isDisabled?: boolean;
  /** Webblox-style error flag; maps to Foundation `hasError`. */
  error?: boolean;
  /** Foundation-style error flag. */
  hasError?: boolean;
  helperText?: string;
  className?: string;
  id?: string;
  name?: string;
  /** When true, applies full-width layout classes. */
  fullWidth?: boolean;
  /** If true, explicit helper text is shown only when focused or in error state. */
  showHelperTextOnlyOnFocusOrError?: boolean;
  /** If true, character count helper text is shown only when focused or in error state. */
  showCharacterCountOnlyOnFocusOrError?: boolean;
  multiline?: boolean;
  minRows?: number;
  maxRows?: number;
  rows?: number;
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

type ShowCharacterCountEnabledOptions = {
  maxLength: number;
  showCharacterCount: true;
};

type ShowCharacterCountDisabledOptions = {
  showCharacterCount?: false;
  maxLength?: number;
};

type TFieldSize = TTextAreaSize;

export type TextFieldWithEnhancedHelperTextV2Props = SharedProps &
  (ShowCharacterCountEnabledOptions | ShowCharacterCountDisabledOptions) & {
    size?: TFieldSize;
  };

function setForwardedRef<T extends HTMLInputElement | HTMLTextAreaElement>(
  ref: React.ForwardedRef<HTMLInputElement | HTMLTextAreaElement>,
  node: T | null,
) {
  if (typeof ref === 'function') {
    ref(node);
  } else if (ref) {
    ref.current = node;
  }
}

/**
 * Foundation UI variant of {@link TextFieldWithEnhancedHelperText}.
 * Uses `TextArea` / `TextInput` from `@rbx/foundation-ui` so placeholder, label, and helper
 * text match Dialog typography (`text-body-medium`, `content-muted` placeholders, etc.).
 */
export const TextFieldWithEnhancedHelperTextV2 = React.forwardRef<
  HTMLTextAreaElement | HTMLInputElement,
  TextFieldWithEnhancedHelperTextV2Props
>((props, ref) => {
  const {
    showHelperTextOnlyOnFocusOrError,
    multiline,
    minRows,
    maxRows,
    rows,
    fullWidth,
    disabled,
    isDisabled: isDisabledProp,
    error,
    hasError: hasErrorProp,
    helperText,
    showCharacterCount,
    showCharacterCountOnlyOnFocusOrError,
    maxLength,
    value,
    label,
    placeholder,
    size = 'Medium',
    className,
    id,
    name,
    onFocus,
    onBlur,
    onChange,
    ...rest
  } = props;

  const { translate } = useTranslation();
  const characterCount = value?.length ?? 0;
  const [isFocused, setIsFocused] = useState(false);
  const isDisabled = isDisabledProp ?? disabled ?? false;
  const hasError = hasErrorProp ?? error ?? false;

  const getCharacterCountHelperText = (characterLimit: number) => {
    return characterCount === 0
      ? translate('Label.UpToLengthChars', { maxLength: characterLimit.toString() })
      : translate('Label.CurrentAndMaxCharacters', {
          characterCount: characterCount.toString(),
          maxLength: characterLimit.toString(),
        });
  };

  let displayHelperText: string | undefined;

  if (helperText) {
    if (!showHelperTextOnlyOnFocusOrError) {
      displayHelperText = helperText;
    } else if (isFocused || hasError) {
      displayHelperText = helperText;
    }
  }

  if (!displayHelperText && showCharacterCount && maxLength != null) {
    if (showCharacterCountOnlyOnFocusOrError && (isFocused || hasError)) {
      displayHelperText = getCharacterCountHelperText(maxLength);
    } else if (!showCharacterCountOnlyOnFocusOrError) {
      displayHelperText = getCharacterCountHelperText(maxLength);
    }
  }

  const wrapperClassName = clsx(
    'flex flex-col width-full gap-small',
    fullWidth && 'fill',
    className,
  );

  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const helperId = `${fieldId}-description`;

  const handleFocus: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
    onFocus?.(event);
    setIsFocused(true);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = (event) => {
    onBlur?.(event);
    setIsFocused(false);
  };

  const renderHelperText = (bodySizeClass: string) => {
    if (!displayHelperText) {
      return null;
    }

    return (
      <span
        id={helperId}
        className={clsx(
          'margin-none',
          bodySizeClass,
          hasError ? 'content-system-alert' : 'content-muted',
        )}>
        {displayHelperText}
      </span>
    );
  };

  const helperTextBodyClass = multiline
    ? HELPER_TEXT_BODY_CLASS_BY_TEXT_AREA_SIZE[size]
    : HELPER_TEXT_BODY_CLASS_BY_TEXT_INPUT_SIZE[size];

  const textareaStyle = useMemo((): CSSProperties | undefined => {
    if (maxRows == null) {
      return undefined;
    }

    return { maxHeight: `${maxRows * ROW_HEIGHT_REM}rem`, overflowY: 'auto' };
  }, [maxRows]);

  const fieldControl = multiline ? (
    <TextArea
      {...rest}
      ref={(node: HTMLTextAreaElement | null) => {
        setForwardedRef(ref, node);
      }}
      id={fieldId}
      name={name}
      label={label}
      value={value}
      placeholder={placeholder}
      size={size}
      isDisabled={isDisabled}
      hasError={hasError}
      rows={rows ?? minRows ?? 3}
      className='width-full fill'
      textareaStyle={textareaStyle}
      aria-describedby={displayHelperText ? helperId : undefined}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={onChange}
    />
  ) : (
    <TextInput
      {...rest}
      ref={(node: HTMLInputElement | null) => {
        setForwardedRef(ref, node);
      }}
      id={fieldId}
      name={name}
      label={label}
      value={value}
      placeholder={placeholder}
      size={size}
      isDisabled={isDisabled}
      hasError={hasError}
      className='width-full fill'
      aria-describedby={displayHelperText ? helperId : undefined}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={onChange}
    />
  );

  return React.createElement(
    'div',
    { className: wrapperClassName },
    fieldControl,
    renderHelperText(helperTextBodyClass),
  );
});

TextFieldWithEnhancedHelperTextV2.displayName = 'TextFieldWithEnhancedHelperTextV2';
