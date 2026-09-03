import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d } from '@rbx/thumbnails';
import type { TTextFieldProps } from '@rbx/ui';
import { TextField, CircularProgress, CancelIcon, FormHelperText, Button } from '@rbx/ui';
import { useSalesAvenueProductInput } from '../hooks/useSalesAvenueProductInput';
import {
  getSalesAvenueThumbnailSize,
  getSalesAvenueThumbnailTarget,
  type SalesAvenueProductType,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';
import SalesAvenueResolvedEntry from './SalesAvenueResolvedEntry';
import useSalesAvenueTextFieldStyles, {
  foundationInputRootClass,
} from './SalesAvenueTextField.styles';

export type SalesAvenueInputStatus = 'empty' | 'dirty' | 'resolving' | 'invalid' | 'resolved';

export type SalesAvenueTextFieldProps = Omit<TTextFieldProps, 'onChange' | 'value' | 'label'> & {
  label?: TTextFieldProps['label'];
  universeId: number | null;
  productType: SalesAvenueProductType;
  value?: SalesAvenueSelection | null;
  onChange?: (value: SalesAvenueSelection | undefined) => void;
  onInputStatusChange?: (status: SalesAvenueInputStatus) => void;
  /** Resets parent-managed duplicate errors when this field is edited, cleared, or submitted. */
  onDuplicateErrorReset?: () => void;
  showRequiredError?: boolean;
  requiredErrorMessage?: string;
  showUnsubmittedError?: boolean;
  unsubmittedErrorMessage?: string;
};

export const SalesAvenueTextField = React.forwardRef<HTMLDivElement, SalesAvenueTextFieldProps>(
  function SalesAvenueTextField(props, ref) {
    const { translate } = useTranslation();
    const { classes } = useSalesAvenueTextFieldStyles();

    const {
      universeId,
      productType,
      value,
      onChange,
      onInputStatusChange,
      onDuplicateErrorReset,
      showRequiredError = false,
      requiredErrorMessage,
      showUnsubmittedError = false,
      unsubmittedErrorMessage,
      onBlur,
      onFocus,
      name,
      disabled,
      className,
      fullWidth,
      id,
      label,
      placeholder,
      error = false,
      helperText: helperTextProp,
      ...rest
    } = props;

    const placeholderText =
      placeholder ??
      (productType === 'GamePass'
        ? translate('Label.GamePassId')
        : translate('Label.DeveloperProductId'));

    const [validationErrorCode, setValidationErrorCode] = useState<string | undefined>(undefined);

    const setValidationError = useCallback(
      (code: string | undefined) => {
        setValidationErrorCode(code);
        if (code) {
          onInputStatusChange?.('invalid');
        }
      },
      [onInputStatusChange],
    );

    const handleResolved = useCallback(
      (selection: SalesAvenueSelection | undefined) => {
        if (selection) {
          onInputStatusChange?.('resolved');
        }
        if (selection === undefined && value === undefined) {
          return;
        }
        onChange?.(selection);
      },
      [onChange, onInputStatusChange, value],
    );

    const handlePendingChange = useCallback(
      (isPending: boolean) => {
        if (isPending) {
          onInputStatusChange?.('resolving');
        }
      },
      [onInputStatusChange],
    );

    const { inputValue, handleChange, handleSubmit, isLoading } = useSalesAvenueProductInput({
      universeId,
      productType,
      resolvedId: value?.id,
      onResolved: handleResolved,
      onError: setValidationError,
      onPendingChange: handlePendingChange,
    });

    const validationErrorMessage = useMemo(() => {
      if (showRequiredError && !value && !validationErrorCode && inputValue.trim().length === 0) {
        return requiredErrorMessage ?? translate('Label.FieldIsRequired');
      }
      if (validationErrorCode === 'empty-product-id') {
        return productType === 'GamePass'
          ? translate('Error.GamePassIdRequired')
          : translate('Error.DeveloperProductIdRequired');
      }
      if (validationErrorCode === 'invalid-product-id') {
        return productType === 'GamePass'
          ? translate('Error.InvalidGamePass')
          : translate('Error.InvalidDeveloperProduct');
      }
      if (validationErrorCode === 'product-not-found') {
        return productType === 'GamePass'
          ? translate('Error.NoMatchingGamePass')
          : translate('Error.NoMatchingDeveloperProduct');
      }
      return undefined;
    }, [
      inputValue,
      productType,
      requiredErrorMessage,
      showRequiredError,
      translate,
      validationErrorCode,
      value,
    ]);

    const handleClear = useCallback(() => {
      onDuplicateErrorReset?.();
      handleChange('');
      onChange?.(undefined);
      setValidationError(undefined);
      onInputStatusChange?.('empty');
    }, [handleChange, onChange, onDuplicateErrorReset, onInputStatusChange, setValidationError]);

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onDuplicateErrorReset?.();
        setValidationError(undefined);
        handleChange(event.target.value);
        onInputStatusChange?.(event.target.value.trim().length > 0 ? 'dirty' : 'empty');
      },
      [handleChange, onDuplicateErrorReset, onInputStatusChange, setValidationError],
    );

    const handleAddClick = useCallback(() => {
      onDuplicateErrorReset?.();
      handleSubmit();
    }, [handleSubmit, onDuplicateErrorReset]);

    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (event.key !== 'Enter') {
          return;
        }
        event.preventDefault();
        if (
          !disabled &&
          universeId != null &&
          !isLoading &&
          inputValue.trim().length > 0 &&
          validationErrorCode === undefined
        ) {
          handleAddClick();
        }
      },
      [disabled, handleAddClick, inputValue, isLoading, universeId, validationErrorCode],
    );

    const showFormRequiredError =
      showRequiredError && !value && !validationErrorCode && inputValue.trim().length === 0;
    const showUnsubmittedInputError =
      showUnsubmittedError && inputValue.trim().length > 0 && !validationErrorCode;
    const showError =
      !!validationErrorCode || error || showFormRequiredError || showUnsubmittedInputError;
    const unsubmittedHelperText = showUnsubmittedInputError ? (
      <>
        {showRequiredError && (
          <>
            <span>{requiredErrorMessage ?? translate('Label.FieldIsRequired')}</span>
            <br />
          </>
        )}
        <span>{unsubmittedErrorMessage}</span>
      </>
    ) : undefined;
    const helperText = unsubmittedHelperText ?? validationErrorMessage ?? helperTextProp;
    const helperTextId = helperText && id ? `${id}-helper-text` : undefined;
    const isResolved = !!value?.name;
    const isFieldDisabled = (disabled ?? false) || isLoading || universeId == null;
    const isAddDisabled =
      isFieldDisabled || inputValue.trim().length === 0 || validationErrorCode !== undefined;
    const showClearAffordance =
      !isFieldDisabled && (isResolved || isLoading || inputValue.length > 0);

    const textFieldInputProps = useMemo(
      () => ({
        'aria-label': placeholderText,
        'aria-describedby': helperTextId,
        'aria-invalid': showError || undefined,
        onKeyDown: handleKeyDown,
      }),
      [handleKeyDown, helperTextId, placeholderText, showError],
    );

    const textFieldInputClasses = useMemo(
      () => ({ classes: { root: foundationInputRootClass(showError) } }),
      [showError],
    );

    const clearAffordance = showClearAffordance ? (
      <div className={classes.clearButtonAbsolute}>
        {isLoading && !isResolved ? (
          <CircularProgress color='secondary' size={20} />
        ) : (
          <CancelIcon fontSize='small' onClick={handleClear} className={classes.clearIcon} />
        )}
      </div>
    ) : null;

    const addButton = (
      <Button
        variant='contained'
        color='primaryBrand'
        size='large'
        className={classes.addButton}
        data-testid={id ? `${id}-add-button` : 'sales-avenue-add-button'}
        disabled={isAddDisabled}
        loading={isLoading}
        onClick={handleAddClick}>
        {translate('Action.Add')}
      </Button>
    );

    if (isResolved) {
      const thumbnail = getSalesAvenueThumbnailTarget(value);
      const thumbnailSize = getSalesAvenueThumbnailSize(value);

      return (
        <div ref={ref} className={className}>
          <div className={classes.fieldShell}>
            <div
              className={`${classes.resolvedRoot} ${foundationInputRootClass(showError)} ${
                showError ? classes.resolvedRootError : ''
              }`}
              data-testid='sales-avenue-resolved'>
              <div className={classes.thumbnailContainer}>
                <Thumbnail2d
                  key={`${thumbnail.type}-${thumbnail.targetId}`}
                  alt={value.name}
                  targetId={thumbnail.targetId}
                  size={thumbnailSize}
                  skeletonVariant='square'
                  containerClass={classes.thumbnailContainer}
                  type={thumbnail.type}
                />
              </div>
              <SalesAvenueResolvedEntry entry={value} />
            </div>
            {clearAffordance}
          </div>
          {helperText ? (
            <FormHelperText id={helperTextId} error={showError}>
              {helperText}
            </FormHelperText>
          ) : null}
        </div>
      );
    }

    return (
      <div ref={ref} className={className}>
        <div className={classes.inputRowShell}>
          <div className={classes.inputRow}>
            <div className={classes.inputFieldGrow}>
              <div className={classes.fieldShell}>
                <TextField
                  {...rest}
                  className={`${classes.textFieldRoot} ${classes.textFieldInput}`}
                  fullWidth={fullWidth}
                  id={id ?? ''}
                  name={name}
                  label={label ?? ''}
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  placeholder={placeholderText}
                  disabled={isFieldDisabled}
                  error={showError}
                  inputProps={textFieldInputProps}
                  InputProps={textFieldInputClasses}
                />
                {clearAffordance}
              </div>
            </div>
            {addButton}
          </div>
          {helperText ? (
            <FormHelperText id={helperTextId} error={showError}>
              {helperText}
            </FormHelperText>
          ) : null}
        </div>
      </div>
    );
  },
);

SalesAvenueTextField.displayName = 'SalesAvenueTextField';

export default SalesAvenueTextField;
