import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import type { TTextFieldProps } from '@rbx/ui';
import {
  TextField,
  CircularProgress,
  InputAdornment,
  CancelIcon,
  makeStyles,
  Typography,
  FormHelperText,
  Skeleton,
} from '@rbx/ui';
import gamesClient from '@modules/clients/games';
import { useExperienceUrlInput, useExperiencePrivacyCheck } from '../../utils/experienceUrl';

// eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
const ASSET_THUMBNAIL_SIZE = AssetThumbnailSize._50x50;

export interface ExperienceUrlTextFieldProps extends Omit<TTextFieldProps, 'onChange'> {
  onChange?: (value: string) => void;
  onExperienceDetailsPendingChange?: (isPending: boolean) => void;
  /** Fired when internal URL/privacy validation shows or clears an error (e.g. invalid or private experience). */
  onValidationErrorChange?: (hasValidationError: boolean) => void;
}

function isResolvedUniverseId(value: string | undefined): value is string {
  if (!value || value.trim() === '') {
    return false;
  }
  const n = Number(value);
  return Number.isInteger(n) && n > 0 && String(n) === value.trim();
}

/**
 * True while async work for the experience URL field is still in flight. Parents use this to
 * avoid showing downstream UI (e.g. license) until the experience is fully resolved.
 *
 * Stages:
 * 1. Debounced URL / place ID → universe id (`useExperienceUrlInput`)
 * 2. Once a universe id exists: universe privacy and Develop details (`useExperiencePrivacyCheck`)
 * 3. If the experience is public: game details for name/thumbnail (`gamesClient.getDetails`)
 */
function isExperienceResolutionPending(args: {
  isUrlResolutionLoading: boolean;
  isUniverseResolved: boolean;
  isCheckingUniversePrivacy: boolean;
  isNotPermittedDelayPending: boolean;
  isPublicExperience: boolean;
  isGameDetailsPending: boolean;
}): boolean {
  const {
    isUrlResolutionLoading,
    isUniverseResolved,
    isCheckingUniversePrivacy,
    isNotPermittedDelayPending,
    isPublicExperience,
    isGameDetailsPending,
  } = args;

  if (isUrlResolutionLoading) {
    return true;
  }
  if (!isUniverseResolved) {
    return false;
  }

  return (
    isCheckingUniversePrivacy ||
    isNotPermittedDelayPending ||
    (isPublicExperience && isGameDetailsPending)
  );
}

const foundationInputRootClass = (hasError: boolean) =>
  [
    'foundation-web-input',
    'stroke-standard',
    hasError ? 'stroke-system-alert' : 'stroke-contrast-alpha',
  ].join(' ');

const useStyles = makeStyles()((theme) => ({
  clearIcon: {
    cursor: 'pointer',
    color: theme.palette.content.muted,
  },
  /** Input and placeholder font size match resolved experience name (`Typography variant='body2'`). */
  textFieldInput: {
    '& .MuiInputBase-input': {
      fontSize: theme.typography.body2.fontSize,
    },
    // Border on root via Foundation classes; MUI fieldset border is hidden.
    '& .MuiOutlinedInput-root fieldset': {
      border: 'none',
    },
    // Hover: background tint only (Foundation StateLayer), inactive border unchanged.
    '& .MuiOutlinedInput-root:hover:not(.Mui-disabled):not(.Mui-error):not(.Mui-focused)': {
      backgroundColor: 'var(--color-state-hover)',
    },
    // Focused (incl. dialog auto-focus): brand blue ring, not MUI default white.
    '& .MuiOutlinedInput-root.Mui-focused:not(.Mui-error)': {
      borderColor: `${theme.palette.actionV2.primaryBrand.fill} !important`,
      boxShadow: `inset 0 0 0 1px ${theme.palette.actionV2.primaryBrand.fill} !important`,
    },
    // Error border: 1px unfocused, 2px focused (color matches Foundation stroke-system-alert).
    '& .MuiOutlinedInput-root.Mui-error:not(.Mui-focused)': {
      borderColor: `${theme.palette.actionV2.important.fill} !important`,
      boxShadow: 'none !important',
    },
    '& .MuiOutlinedInput-root.Mui-error.Mui-focused': {
      borderColor: `${theme.palette.actionV2.important.fill} !important`,
      boxShadow: `inset 0 0 0 1px ${theme.palette.actionV2.important.fill} !important`,
    },
  },
  resolvedRootError: {
    borderColor: `${theme.palette.actionV2.important.fill} !important`,
    boxShadow: 'none !important',
  },
  /** Match resolved state height so the UI does not shift when URL becomes valid */
  textFieldRoot: {
    '& .MuiInputBase-root': {
      minHeight: 58,
    },
  },
  resolvedRoot: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    minHeight: 56,
    width: '100%',
    padding: theme.spacing(1, 1),
    borderRadius: theme.border.radius.medium.borderRadius,
    boxSizing: 'border-box',
  },
  /** Hover tint matches Foundation dropdown / text input StateLayer. */
  resolvedRootInteractive: {
    '&:hover': {
      backgroundColor: 'var(--color-state-hover)',
    },
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
    flexShrink: 0,
    display: 'block',
    padding: 0,
    borderRadius: 4,
    overflow: 'hidden',
  },
  experienceName: {
    flex: 1,
    minWidth: 0,
  },
}));

/**
 * Text field that accepts a Roblox experience URL or bare root place ID.
 * Validates via universes API (debounced) and on success calls onChange with the universe ID string.
 */
export const ExperienceUrlTextField = React.forwardRef<HTMLDivElement, ExperienceUrlTextFieldProps>(
  function ExperienceUrlTextField(props, ref) {
    const { translate } = useTranslation();

    const {
      value = '',
      onChange,
      onExperienceDetailsPendingChange,
      onValidationErrorChange,
      onBlur,
      onFocus,
      name,
      error = false,
      disabled,
      className,
      helperText: helperTextProp,
      label,
      fullWidth,
      id,
      placeholder = translate('Label.ExperienceUrlPlaceholder'),
      ...rest
    } = props;

    const { classes } = useStyles();
    const [validationError, setValidationError] = useState<string | undefined>(undefined);
    const [rawInputAtResolve, setRawInputAtResolve] = useState<string | undefined>(undefined);
    const lastResolvedRef = useRef(false);
    const isResolved = isResolvedUniverseId(typeof value === 'string' ? value : '');
    const universeId = isResolved ? Number(value) : undefined;

    const setValidationErrorAndNotify = useCallback(
      (err: string | undefined) => {
        setValidationError(err);
        onValidationErrorChange?.(!!err);
      },
      [onValidationErrorChange],
    );

    const {
      isPublic: isPublicExperience,
      isNotPermitted: isNotPermittedExperience,
      isCheckingPrivacy,
      isNotPermittedPending,
    } = useExperiencePrivacyCheck({
      universeId,
      isResolved,
      onNotPermitted: useCallback(() => {
        setValidationErrorAndNotify(translate('Label.PrivateExperienceCannotBeRequested'));
        onChange?.('');
      }, [onChange, setValidationErrorAndNotify, translate]),
      onPublic: useCallback(
        () => setValidationErrorAndNotify(undefined),
        [setValidationErrorAndNotify],
      ),
    });

    const gameDetailsQuery = useQuery({
      queryKey: ['game', universeId],
      queryFn: async () => {
        if (universeId == null) {
          return null;
        }
        const res = await gamesClient.getDetails([universeId]);
        return res.data?.[0] ?? null;
      },
      enabled: universeId != null && isPublicExperience,
    });

    const { inputValue, handleChange, isLoading } = useExperienceUrlInput({
      value: typeof value === 'string' ? value : '',
      onResolved: (resolvedUniverseId, rawInput) => {
        setRawInputAtResolve(rawInput || undefined);
        onChange?.(resolvedUniverseId ? resolvedUniverseId.toString() : '');
        setValidationErrorAndNotify(undefined);
      },
      onError: (message) => {
        setValidationErrorAndNotify(
          message === undefined ? undefined : message || translate('Label.InvalidExperience'),
        );
      },
    });

    const isExperienceDetailsPending = useMemo(
      () =>
        isExperienceResolutionPending({
          isUrlResolutionLoading: isLoading,
          isUniverseResolved: isResolved,
          isCheckingUniversePrivacy: isCheckingPrivacy,
          isNotPermittedDelayPending: isNotPermittedPending,
          isPublicExperience,
          isGameDetailsPending: gameDetailsQuery.isPending,
        }),
      [
        isLoading,
        isResolved,
        isCheckingPrivacy,
        isNotPermittedPending,
        isPublicExperience,
        gameDetailsQuery.isPending,
      ],
    );

    useEffect(() => {
      onExperienceDetailsPendingChange?.(isExperienceDetailsPending);
    }, [isExperienceDetailsPending, onExperienceDetailsPendingChange]);

    const handleChangeWithClear = useCallback(
      (newValue: string) => {
        setValidationErrorAndNotify(undefined);
        setRawInputAtResolve(undefined);
        handleChange(newValue);
      },
      [handleChange, setValidationErrorAndNotify],
    );

    const showError = error || !!validationError;
    const helperText = helperTextProp ?? validationError;

    // Universe is not permitted (private, archived, or draft): show raw input + error + X input button
    if (isResolved && isNotPermittedExperience && !isNotPermittedPending) {
      lastResolvedRef.current = true;
      return (
        <TextField
          {...rest}
          ref={ref}
          className={className ? `${classes.textFieldInput} ${className}` : classes.textFieldInput}
          fullWidth={fullWidth}
          id={id ?? ''}
          name={name}
          label={label ?? ''}
          value={rawInputAtResolve ?? ''}
          onChange={(e) => handleChangeWithClear(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          error={showError}
          helperText={helperText}
          placeholder={placeholder ?? translate('Label.ExperienceUrlPlaceholder')}
          disabled={disabled}
          InputProps={{
            classes: { root: foundationInputRootClass(showError) },
            endAdornment: (
              <InputAdornment position='end'>
                {rawInputAtResolve && rawInputAtResolve.length > 0 && (
                  <CancelIcon
                    fontSize='small'
                    onClick={() => handleChangeWithClear('')}
                    className={classes.clearIcon}
                    aria-label='Clear'
                  />
                )}
              </InputAdornment>
            ),
          }}
        />
      );
    }

    // Universe ID resolved but details unknown: show raw input + spinner + disabled
    if (isResolved && (isCheckingPrivacy || isNotPermittedPending)) {
      lastResolvedRef.current = true;
      return (
        <TextField
          {...rest}
          ref={ref}
          className={className ? `${classes.textFieldInput} ${className}` : classes.textFieldInput}
          fullWidth={fullWidth}
          id={id ?? ''}
          name={name}
          label={label ?? ''}
          value={rawInputAtResolve ?? ''}
          onChange={(e) => handleChangeWithClear(e.target.value)}
          onBlur={onBlur}
          onFocus={onFocus}
          error={false}
          helperText={undefined}
          placeholder={placeholder ?? translate('Label.ExperienceUrlPlaceholder')}
          disabled
          InputProps={{
            classes: { root: foundationInputRootClass(false) },
            endAdornment: (
              <InputAdornment position='end'>
                <CircularProgress color='secondary' size={20} aria-label='Loading' />
              </InputAdornment>
            ),
          }}
        />
      );
    }

    // Universe is public: show game icon and name
    if (isResolved && isPublicExperience && universeId != null) {
      lastResolvedRef.current = true;
      const { data: game, isPending: isGameLoading } = gameDetailsQuery;
      const gameName = game?.name ?? '';
      const resolvedUniverseId = universeId;
      const resolvedRootClassName = [
        classes.resolvedRoot,
        foundationInputRootClass(showError),
        showError && classes.resolvedRootError,
        !disabled && classes.resolvedRootInteractive,
      ]
        .filter(Boolean)
        .join(' ');

      return (
        <div ref={ref} className={className}>
          {label ? (
            <Typography component='label' variant='body2' color='secondary' htmlFor={id}>
              {label}
            </Typography>
          ) : null}
          <div className={resolvedRootClassName} data-testid='experience-url-resolved'>
            <div className={classes.thumbnailContainer}>
              {isGameLoading ? (
                <Skeleton variant='rectangular' width={40} height={40} />
              ) : (
                <Thumbnail2d
                  key={resolvedUniverseId}
                  alt={gameName}
                  targetId={resolvedUniverseId}
                  size={ASSET_THUMBNAIL_SIZE}
                  skeletonVariant='square'
                  containerClass={classes.thumbnailContainer}
                  type={ThumbnailTypes.gameIcon}
                />
              )}
            </div>
            <Typography variant='body2' className={classes.experienceName} noWrap>
              {isGameLoading ? <Skeleton variant='text' width={120} /> : gameName}
            </Typography>
            {!disabled && (
              <CancelIcon
                fontSize='small'
                onClick={() => onChange?.('')}
                className={classes.clearIcon}
                aria-label='Clear'
              />
            )}
          </div>
          {helperText ? <FormHelperText error={showError}>{helperText}</FormHelperText> : null}
        </div>
      );
    }

    let textFieldValue = inputValue;
    if (value === '' && lastResolvedRef.current) {
      lastResolvedRef.current = false;
      textFieldValue = '';
    }
    if (rawInputAtResolve && validationError) {
      textFieldValue = rawInputAtResolve;
    }

    // Never show spinner when validation error is visible (error must appear only after loading clears).
    const showSpinner = isLoading && !validationError;
    const isPrivateErrorState = !!(rawInputAtResolve && validationError);
    const isDisabled = isPrivateErrorState ? disabled : Boolean(disabled) || isLoading;

    return (
      <TextField
        {...rest}
        ref={ref}
        className={
          className
            ? `${classes.textFieldRoot} ${classes.textFieldInput} ${className}`
            : `${classes.textFieldRoot} ${classes.textFieldInput}`
        }
        fullWidth={fullWidth}
        id={id ?? ''}
        name={name}
        label={label ?? ''}
        value={textFieldValue}
        onChange={(e) => handleChangeWithClear(e.target.value)}
        onBlur={onBlur}
        onFocus={onFocus}
        error={showError}
        helperText={helperText}
        placeholder={placeholder ?? translate('Label.ExperienceUrlPlaceholder')}
        disabled={isDisabled}
        InputProps={{
          classes: { root: foundationInputRootClass(showError) },
          endAdornment: (
            <InputAdornment position='end'>
              {showSpinner ? (
                <CircularProgress color='secondary' size={20} aria-label='Loading' />
              ) : null}
              {!showSpinner &&
                (inputValue.length > 0 ||
                  (rawInputAtResolve != null &&
                    rawInputAtResolve.length > 0 &&
                    !!validationError)) && (
                  <CancelIcon
                    fontSize='small'
                    onClick={() => handleChangeWithClear('')}
                    className={classes.clearIcon}
                    aria-label='Clear'
                  />
                )}
            </InputAdornment>
          ),
        }}
      />
    );
  },
);

ExperienceUrlTextField.displayName = 'ExperienceUrlTextField';

export default ExperienceUrlTextField;
