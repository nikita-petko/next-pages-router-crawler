// Edits and validates a revenue share percentage while preserving exact basis-point precision and accessible error feedback.
import {
  useCallback,
  useEffect,
  useId,
  type ChangeEvent,
  type FocusEvent,
  type FunctionComponent,
  type KeyboardEvent,
} from 'react';
import { useController, useForm } from 'react-hook-form';
import { VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  BASIS_POINTS_PER_PERCENT,
  REV_SHARE_TOTAL_BASIS_POINTS,
} from '../interface/RevShareViewModel';
import { formatBasisPoints, PERCENT_FRACTION_DIGITS } from '../utils/revShareUtils';

const parsePercentToBasisPoints = (percent: string): number | null => {
  const trimmedPercent = percent.trim();
  const match = /^(\d{1,3})(?:\.(\d{1,2}))?$/.exec(trimmedPercent);
  if (!match) {
    return null;
  }

  const wholePercent = Number.parseInt(match[1], 10);
  const fractionalPercent = Number.parseInt(
    (match[2] ?? '').padEnd(PERCENT_FRACTION_DIGITS, '0') || '0',
    10,
  );
  const basisPoints = wholePercent * BASIS_POINTS_PER_PERCENT + fractionalPercent;

  if (basisPoints > REV_SHARE_TOTAL_BASIS_POINTS) {
    return null;
  }

  return basisPoints;
};

type PercentInputForm = {
  percent: string;
};

type RevSharePercentInputProps = {
  basisPoints: number;
  onChange?: (newBasisPoints: number) => void;
  onValidityChange?: (isValid: boolean) => void;
  disabled?: boolean;
  recipientName?: string;
  fieldInvalid?: boolean;
  fieldErrorMessage?: string;
};

const RevSharePercentInput: FunctionComponent<RevSharePercentInputProps> = ({
  basisPoints,
  onChange,
  onValidityChange,
  disabled = false,
  recipientName,
  fieldInvalid,
  fieldErrorMessage,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const formatted = formatBasisPoints(basisPoints);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const accessibleLabel = recipientName
    ? tPendingTranslation(
        'Percent share for {name}',
        'Accessible label for a recipient revenue share percentage input; {name} is the recipient name.',
        translationKey(
          'Label.PercentShareForRecipient',
          TranslationNamespace.RevenueShareAgreements,
        ),
        { name: recipientName },
      )
    : tPendingTranslation(
        'Percent share',
        'Accessible label for a revenue share percentage input.',
        translationKey('Label.PercentShare', TranslationNamespace.RevenueShareAgreements),
      );
  const invalidPercentMessage = tPendingTranslation(
    'Enter a percentage from 0 to 100 with at most two decimal places.',
    'Validation error for an invalid revenue share percentage.',
    translationKey('Error.InvalidPercentShare', TranslationNamespace.RevenueShareAgreements),
  );
  const { control, reset, setValue, setError, clearErrors } = useForm<PercentInputForm>({
    defaultValues: { percent: formatted },
    mode: 'onBlur',
  });
  const {
    field: { value, onChange: onFieldChange, onBlur: onFieldBlur, ref },
    fieldState: { error },
  } = useController({
    name: 'percent',
    control,
    rules: {
      validate: (percent) => parsePercentToBasisPoints(percent) !== null || invalidPercentMessage,
    },
  });

  useEffect(() => {
    reset({ percent: formatted });
    onValidityChange?.(true);
  }, [formatted, onValidityChange, reset]);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onFieldChange(event);
      const isValid = parsePercentToBasisPoints(event.currentTarget.value) !== null;
      onValidityChange?.(isValid);
      if (isValid) {
        clearErrors('percent');
      }
    },
    [clearErrors, onFieldChange, onValidityChange],
  );
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      onFieldBlur();
      const parsedBasisPoints = parsePercentToBasisPoints(event.currentTarget.value);
      if (parsedBasisPoints === null) {
        setError('percent', { type: 'validate', message: invalidPercentMessage });
        onValidityChange?.(false);
        return;
      }
      clearErrors('percent');
      onValidityChange?.(true);
      setValue('percent', formatBasisPoints(parsedBasisPoints));
      onChange?.(parsedBasisPoints);
    },
    [
      clearErrors,
      invalidPercentMessage,
      onChange,
      onFieldBlur,
      onValidityChange,
      setError,
      setValue,
    ],
  );
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.currentTarget.blur();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        clearErrors('percent');
        onValidityChange?.(true);
        setValue('percent', formatted);
      }
    },
    [clearErrors, formatted, onValidityChange, setValue],
  );
  const isInvalid = error != null || fieldInvalid === true;
  const descriptionText = error?.message ?? fieldErrorMessage;

  return (
    <>
      <label
        htmlFor={inputId}
        className={`flex items-center justify-end radius-small padding-y-xxsmall padding-x-small [white-space:nowrap] [width:80px] ${disabled ? '' : 'bg-surface-300 [cursor:text]'} ${isInvalid ? 'stroke-system-alert stroke-standard' : ''}`}>
        <input
          ref={ref}
          id={inputId}
          type='text'
          inputMode='decimal'
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`text-body-medium content-emphasis [font-weight:600] [background:none] stroke-none [outline:none] [width:5ch] [text-align:right] padding-none margin-none [font-family:inherit] [font-size:inherit] [appearance:none] ${disabled ? '[cursor:default]' : ''}`}
          aria-label={accessibleLabel}
          aria-invalid={isInvalid}
          aria-describedby={descriptionText ? errorId : undefined}
        />
        <span
          aria-hidden
          className={`text-body-medium content-emphasis [font-weight:600] ${disabled ? '' : '[cursor:text]'}`}>
          %
        </span>
      </label>
      {descriptionText && (
        <VisuallyHidden id={errorId} role='alert'>
          {descriptionText}
        </VisuallyHidden>
      )}
    </>
  );
};

export default RevSharePercentInput;
