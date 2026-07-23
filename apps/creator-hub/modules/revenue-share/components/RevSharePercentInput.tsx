// Edits and validates a revenue share percentage while preserving exact basis-point precision and accessible error feedback.
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
  type FunctionComponent,
  type InputEvent as ReactInputEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from 'react';
import { useController, useForm } from 'react-hook-form';
import { TextInput, VisuallyHidden } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  asSafeBasisPoints,
  formatBasisPoints,
  formatPreviousSplitDisplay,
} from '../utils/revShareUtils';
import {
  acceptRevSharePercentEdit,
  commitRevSharePercentDraft,
  isTransientRevSharePercent,
  stripRevSharePercentNoise,
} from '../utils/revShareValidation';

const PERCENT_INPUT_SHELL_CLASS = 'items-end gap-xxsmall width-1900';
const PERCENT_INPUT_CONTAINER_BASE_CLASS =
  'radius-small [white-space:nowrap] padding-y-xxsmall padding-left-none padding-right-small !gap-x-none justify-end opacity-100 [&_input]:text-body-medium [&_input]:content-emphasis [&_input]:[font-weight:600] [&_input]:[width:6ch] [&_input]:[text-align:right]';
const PERCENT_INPUT_CONTAINER_EDITABLE_CLASS = `${PERCENT_INPUT_CONTAINER_BASE_CLASS} [cursor:text] [&_input]:[cursor:text]`;

const RevSharePercentSuffix: FunctionComponent = () => (
  <span
    aria-hidden
    data-rev-share-percent-suffix
    className='text-body-medium content-emphasis [font-weight:600]'>
    %
  </span>
);

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
  isCalculatedDisplay?: boolean;
};

type RevShareCalculatedPercentDisplayProps = {
  basisPoints: number;
};

const RevShareCalculatedPercentDisplay: FunctionComponent<
  RevShareCalculatedPercentDisplayProps
> = ({ basisPoints }) => {
  const safeBasisPoints = asSafeBasisPoints(basisPoints);
  const displayValue = formatBasisPoints(safeBasisPoints);
  const accessibleValue = formatPreviousSplitDisplay(safeBasisPoints);

  return (
    <span
      aria-label={accessibleValue}
      className='flex items-center justify-end !gap-x-none width-1900 padding-right-small text-align-x-right content-emphasis stroke-standard [border-color:var(--color-none)]'>
      <span aria-hidden className='text-body-medium content-emphasis [font-weight:600]'>
        {displayValue}
      </span>
      <RevSharePercentSuffix />
    </span>
  );
};

type RevShareEditablePercentInputProps = Omit<RevSharePercentInputProps, 'isCalculatedDisplay'>;

const RevShareEditablePercentInput: FunctionComponent<RevShareEditablePercentInputProps> = ({
  basisPoints,
  onChange,
  onValidityChange,
  disabled = false,
  recipientName,
  fieldInvalid,
  fieldErrorMessage,
}) => {
  const { tPendingTranslation } = useTranslationWrapper(useTranslation());
  const safeBasisPoints = asSafeBasisPoints(basisPoints);
  const formatted = formatBasisPoints(safeBasisPoints);
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
  const isFocusedRef = useRef(false);
  const latestSafeBasisPointsRef = useRef(safeBasisPoints);
  // eslint-disable-next-line react-compiler/react-compiler -- event callbacks need the latest rendered value without a synchronization effect
  latestSafeBasisPointsRef.current = safeBasisPoints;
  const focusBasisPointsRef = useRef(safeBasisPoints);
  const inputElementRef = useRef<HTMLInputElement | null>(null);
  const pendingCaretRef = useRef<{ start: number; end: number } | null>(null);
  const selectionBeforeEditRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  const [caretEpoch, setCaretEpoch] = useState(0);
  const { control, reset, setValue, clearErrors } = useForm<PercentInputForm>({
    defaultValues: { percent: formatted },
    mode: 'onBlur',
  });
  const {
    field: { value, onChange: onFieldChange, onBlur: onFieldBlur, ref: fieldRef },
  } = useController({
    name: 'percent',
    control,
  });

  const setInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      inputElementRef.current = element;
      fieldRef(element);
    },
    [fieldRef],
  );

  useEffect(() => {
    if (isFocusedRef.current) {
      return;
    }
    reset({ percent: formatted });
    onValidityChange?.(true);
  }, [formatted, onValidityChange, reset]);

  const queueCaretRestore = useCallback((start: number, end: number = start) => {
    pendingCaretRef.current = { start, end };
    setCaretEpoch((epoch) => epoch + 1);
  }, []);

  // Restore selection after rejected edits / strip rewrites, including when value is unchanged.
  useLayoutEffect(() => {
    const caret = pendingCaretRef.current;
    const inputElement = inputElementRef.current;
    if (caret == null || inputElement == null) {
      return;
    }
    inputElement.setSelectionRange(caret.start, caret.end);
    pendingCaretRef.current = null;
  }, [caretEpoch, value]);

  const restoreRejectedEdit = useCallback(
    (inputElement: HTMLInputElement) => {
      const { start, end } = selectionBeforeEditRef.current;
      const domDiverged = inputElement.value !== value;
      // Sync DOM immediately so React does not need a value-prop round-trip that moves the caret.
      inputElement.value = value;
      inputElement.setSelectionRange(start, end);
      queueCaretRestore(start, end);
      if (domDiverged) {
        onFieldChange(value);
      }
    },
    [onFieldChange, queueCaretRestore, value],
  );

  const handleBeforeInput = useCallback(
    (event: ReactInputEvent<HTMLInputElement>) => {
      const nativeEvent = event.nativeEvent;
      const inputType = nativeEvent.inputType ?? '';
      if (
        inputType === 'insertCompositionText' ||
        inputType === 'insertFromComposition' ||
        inputType === 'deleteCompositionText'
      ) {
        return;
      }

      const selectionStart = event.currentTarget.selectionStart ?? value.length;
      const selectionEnd = event.currentTarget.selectionEnd ?? value.length;
      selectionBeforeEditRef.current = { start: selectionStart, end: selectionEnd };
      const data = event.data ?? nativeEvent.data ?? null;
      const result = acceptRevSharePercentEdit({
        value,
        selectionStart,
        selectionEnd,
        data,
        inputType,
      });

      // Reject only: leave the DOM alone so the caret does not move.
      if (!result.accepted) {
        event.preventDefault();
        nativeEvent.preventDefault();
        queueCaretRestore(selectionStart, selectionEnd);
        return;
      }

      // Valid edit with no junk: let the browser mutate; onChange syncs React state.
      if (result.nextDraft === result.rawNext) {
        return;
      }

      // Valid after stripping junk: apply the cleaned draft ourselves.
      event.preventDefault();
      nativeEvent.preventDefault();
      const nextCaret = Math.max(
        0,
        Math.min(
          result.nextDraft.length,
          selectionStart +
            (result.nextDraft.length - value.length) +
            (selectionEnd - selectionStart),
        ),
      );
      queueCaretRestore(nextCaret);
      onFieldChange(result.nextDraft);
      clearErrors('percent');
      onValidityChange?.(true);
    },
    [clearErrors, onFieldChange, onValidityChange, queueCaretRestore, value],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextDraft = stripRevSharePercentNoise(event.target.value);
      if (!isTransientRevSharePercent(nextDraft)) {
        // beforeinput should have blocked this; restore value + pre-edit caret in place.
        restoreRejectedEdit(event.target);
        return;
      }
      // Avoid controlled re-renders that reset the caret when the draft did not change.
      if (nextDraft === value) {
        return;
      }
      onFieldChange(nextDraft);
      clearErrors('percent');
      onValidityChange?.(true);
    },
    [clearErrors, onFieldChange, onValidityChange, restoreRejectedEdit, value],
  );

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
    focusBasisPointsRef.current = latestSafeBasisPointsRef.current;
  }, []);

  const handleSelect = useCallback((event: SyntheticEvent<HTMLInputElement>) => {
    selectionBeforeEditRef.current = {
      start: event.currentTarget.selectionStart ?? 0,
      end: event.currentTarget.selectionEnd ?? 0,
    };
  }, []);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      onFieldBlur();
      const committedBasisPoints = asSafeBasisPoints(
        commitRevSharePercentDraft(event.currentTarget.value),
      );
      setValue('percent', formatBasisPoints(committedBasisPoints));
      onChange?.(committedBasisPoints);
      onValidityChange?.(true);
      clearErrors('percent');
    },
    [clearErrors, onChange, onFieldBlur, onValidityChange, setValue],
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
        const revertBasisPoints = asSafeBasisPoints(focusBasisPointsRef.current);
        clearErrors('percent');
        onValidityChange?.(true);
        setValue('percent', formatBasisPoints(revertBasisPoints));
        onChange?.(revertBasisPoints);
      }
    },
    [clearErrors, onChange, onValidityChange, setValue],
  );

  const isInvalid = fieldInvalid === true;
  const descriptionText = fieldErrorMessage;
  const inputContainerClassName = disabled
    ? `${PERCENT_INPUT_CONTAINER_BASE_CLASS} [&_input]:[cursor:default]`
    : PERCENT_INPUT_CONTAINER_EDITABLE_CLASS;

  return (
    <>
      <TextInput
        ref={setInputRef}
        id={inputId}
        type='text'
        inputMode='decimal'
        size='XSmall'
        variant='Standard'
        isDisabled={disabled}
        value={value}
        onChange={handleChange}
        onBeforeInput={handleBeforeInput}
        onFocus={handleFocus}
        onSelect={handleSelect}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        aria-label={accessibleLabel}
        aria-invalid={isInvalid}
        aria-describedby={descriptionText ? errorId : undefined}
        hasError={isInvalid}
        className={PERCENT_INPUT_SHELL_CLASS}
        inputContainerClassName={inputContainerClassName}
        trailingIconNode={<RevSharePercentSuffix />}
      />
      {descriptionText && (
        <VisuallyHidden id={errorId} role='alert'>
          {descriptionText}
        </VisuallyHidden>
      )}
    </>
  );
};

const RevSharePercentInput: FunctionComponent<RevSharePercentInputProps> = ({
  isCalculatedDisplay = false,
  basisPoints,
  ...editableProps
}) => {
  if (isCalculatedDisplay) {
    return <RevShareCalculatedPercentDisplay basisPoints={basisPoints} />;
  }

  return <RevShareEditablePercentInput basisPoints={basisPoints} {...editableProps} />;
};

export default RevSharePercentInput;
