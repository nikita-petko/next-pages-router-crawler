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

export type SalesAvenueTextFieldProps = Omit<TTextFieldProps, 'onChange' | 'value' | 'label'> & {
  label?: TTextFieldProps['label'];
  universeId: number | null;
  productType: SalesAvenueProductType;
  value?: SalesAvenueSelection | null;
  onChange?: (value: SalesAvenueSelection | undefined) => void;
  onPendingChange?: (isPending: boolean) => void;
  onValidationErrorChange?: (hasValidationError: boolean) => void;
  /** Resets parent-managed duplicate errors when this field is edited, cleared, or submitted. */
  onDuplicateErrorReset?: () => void;
  showRequiredError?: boolean;
  requiredErrorMessage?: string;
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
      onPendingChange,
      onValidationErrorChange,
      onDuplicateErrorReset,
      showRequiredError = false,
      requiredErrorMessage,
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
        onValidationErrorChange?.(!!code);
      },
      [onValidationErrorChange],
    );

    const validationErrorMessage = useMemo(() => {
      if (showRequiredError && !value && !validationErrorCode) {
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
      productType,
      requiredErrorMessage,
      showRequiredError,
      translate,
      validationErrorCode,
      value,
    ]);

    const handleResolved = useCallback(
      (selection: SalesAvenueSelection | undefined) => {
        if (selection === undefined && value === undefined) {
          return;
        }
        onChange?.(selection);
      },
      [onChange, value],
    );

    const { inputValue, handleChange, handleSubmit, isLoading } = useSalesAvenueProductInput({
      universeId,
      productType,
      resolvedId: value?.id,
      onResolved: handleResolved,
      onError: setValidationError,
      onPendingChange,
    });

    const handleClear = useCallback(() => {
      onDuplicateErrorReset?.();
      handleChange('');
      onChange?.(undefined);
      setValidationError(undefined);
    }, [handleChange, onChange, onDuplicateErrorReset, setValidationError]);

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onDuplicateErrorReset?.();
        handleChange(event.target.value);
      },
      [handleChange, onDuplicateErrorReset],
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
        if (!disabled && !isLoading) {
          handleAddClick();
        }
      },
      [disabled, handleAddClick, isLoading],
    );

    const showFormRequiredError = showRequiredError && !value && !validationErrorCode;
    const showError = !!validationErrorCode || error || showFormRequiredError;
    const helperText = validationErrorMessage ?? helperTextProp;
    const isResolved = !!value?.name;
    const isFieldDisabled = (disabled ?? false) || isLoading;
    const showClearAffordance =
      !isFieldDisabled && (isResolved || isLoading || inputValue.length > 0);

    const textFieldInputProps = useMemo(
      () => ({
        'aria-label': placeholderText,
        onKeyDown: handleKeyDown,
      }),
      [handleKeyDown, placeholderText],
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
        color='secondary'
        size='large'
        className={classes.addButton}
        data-testid={id ? `${id}-add-button` : 'sales-avenue-add-button'}
        disabled={isFieldDisabled}
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
          {helperText ? <FormHelperText error={showError}>{helperText}</FormHelperText> : null}
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
          {helperText ? <FormHelperText error={showError}>{helperText}</FormHelperText> : null}
        </div>
      </div>
    );
  },
);

SalesAvenueTextField.displayName = 'SalesAvenueTextField';

export default SalesAvenueTextField;
