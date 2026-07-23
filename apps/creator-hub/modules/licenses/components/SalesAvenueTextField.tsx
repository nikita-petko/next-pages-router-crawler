import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, AssetThumbnailSize } from '@rbx/thumbnails';
import type { TTextFieldProps } from '@rbx/ui';
import { TextField, CircularProgress, CancelIcon, FormHelperText } from '@rbx/ui';
import { useSalesAvenueProductInput } from '../hooks/useSalesAvenueProductInput';
import {
  getSalesAvenueThumbnailTarget,
  type SalesAvenueProductType,
  type SalesAvenueSelection,
} from '../utils/salesAvenue';
import SalesAvenueResolvedEntry from './SalesAvenueResolvedEntry';
import useSalesAvenueTextFieldStyles, {
  foundationInputRootClass,
} from './SalesAvenueTextField.styles';

// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const ASSET_THUMBNAIL_SIZE = AssetThumbnailSize._50x50;

export type SalesAvenueTextFieldProps = Omit<TTextFieldProps, 'onChange' | 'value' | 'label'> & {
  label?: TTextFieldProps['label'];
  universeId: number | null;
  productType: SalesAvenueProductType;
  value?: SalesAvenueSelection | null;
  onChange?: (value: SalesAvenueSelection | undefined) => void;
  onPendingChange?: (isPending: boolean) => void;
  onValidationErrorChange?: (hasValidationError: boolean) => void;
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

    const { inputValue, handleChange, isLoading } = useSalesAvenueProductInput({
      universeId,
      productType,
      resolvedId: value?.id,
      onResolved: handleResolved,
      onError: setValidationError,
      onPendingChange,
    });

    const handleClear = useCallback(() => {
      handleChange('');
      onChange?.(undefined);
      setValidationError(undefined);
    }, [handleChange, onChange, setValidationError]);

    const handleInputChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        handleChange(event.target.value);
      },
      [handleChange],
    );

    const showError = error || !!validationErrorCode || (showRequiredError && !value);
    const helperText = helperTextProp ?? validationErrorMessage;
    const isResolved = !!value?.name;
    const showClearAffordance = !disabled && (isResolved || isLoading || inputValue.length > 0);

    const textFieldInputProps = useMemo(
      () => ({ 'aria-label': placeholderText }),
      [placeholderText],
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

    if (isResolved) {
      const productTypeLabel =
        productType === 'GamePass'
          ? translate('Label.GamePass')
          : translate('Label.DeveloperProduct');
      const idLabel = translate('Label.IdWithInput', { assetId: String(value.id) });
      const thumbnail = getSalesAvenueThumbnailTarget(value);

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
                  size={ASSET_THUMBNAIL_SIZE}
                  skeletonVariant='square'
                  containerClass={classes.thumbnailContainer}
                  type={thumbnail.type}
                />
              </div>
              <SalesAvenueResolvedEntry
                entry={value}
                productTypeLabel={productTypeLabel}
                idLabel={idLabel}
              />
            </div>
            {clearAffordance}
          </div>
          {helperText ? <FormHelperText error={showError}>{helperText}</FormHelperText> : null}
        </div>
      );
    }

    return (
      <div ref={ref} className={className}>
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
            disabled={(disabled ?? false) || isLoading}
            error={showError}
            helperText={helperText}
            inputProps={textFieldInputProps}
            InputProps={textFieldInputClasses}
          />
          {clearAffordance}
        </div>
      </div>
    );
  },
);

SalesAvenueTextField.displayName = 'SalesAvenueTextField';

export default SalesAvenueTextField;
