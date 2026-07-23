import type { FunctionComponent } from 'react';
import React, { useCallback, useMemo, useRef } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Radio, RadioGroup } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  AlertTitle,
  Button,
  Divider,
  Grid,
  Link,
  OpenInNewIcon,
  TextField,
  Tooltip,
  Typography,
} from '@rbx/ui';
import type { Asset as AssetType } from '@modules/miscellaneous/common';
import {
  LAUNCH_DATA_LEARN_MORE_URL,
  RELEASE_EXPERIENCE_TO_PUBLIC_URL,
} from '@modules/miscellaneous/common/constants/linkConstants';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import useDebouncedFunction from '@modules/miscellaneous/hooks/useDebouncedFunction';
import useStudio, { EStudioTaskType } from '@modules/miscellaneous/hooks/useStudio';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import { TRY_ASSET_ENABLED_ASSET_TYPES } from '../../../hooks/useSocialLinks';
import type { CreatorStoreConfigurationType } from '../../CreatorStoreConfiguration/types';
import useTryAssetFormStyles from './TryAssetForm.styles';
import {
  TryAssetMode,
  TRY_ASSET_MODE_KEY,
  TRY_ASSET_PLACE_ID_KEY,
  TRY_ASSET_PLACE_ID_ELEMENT_ID,
  LAUNCH_DATA_ASSET_ID_KEY,
  buildTryAssetPreviewUrl,
} from './tryAssetFormHelpers';

const DEBOUNCED_VALIDATION_DELAY_MS = 100;

// Default TBYB experience IDs for opening in Studio (environment-specific)
// NOTE: There are no default TBYB experiences in ST2 or ST3
const isProduction = process.env.targetEnvironment === 'production';
const DEFAULT_TBYB_UNIVERSE_ID = isProduction ? '9565693835' : '6011903108';
const DEFAULT_TBYB_PLACE_ID = isProduction ? '75005559071106' : '98180470232733';

const TRY_ASSET_MODE_OPTIONS: { value: TryAssetMode; label: string; hint: string }[] = [
  {
    value: TryAssetMode.Disabled,
    label: 'Label.TryAssetModeDisabled',
    hint: 'Description.TryAssetModeDisabled',
  },
  {
    value: TryAssetMode.Default,
    label: 'Label.TryAssetModeDefault',
    hint: 'Description.TryAssetModeDefault',
  },
  {
    value: TryAssetMode.Custom,
    label: 'Label.TryAssetModeCustom',
    hint: 'Description.TryAssetModeCustom',
  },
];

export type TryAssetFormProps = {
  assetId: number;
  assetType: AssetType;
  tryAssetExistingPlaceIsPlayable: boolean | null;
  // When false, the Try in Roblox link can be viewed and removed (set to Disabled),
  // but not created or updated (no switching to Default/Custom, no editing the place ID).
  canCreateOrUpdate?: boolean;
};

const TryAssetForm: FunctionComponent<TryAssetFormProps> = ({
  assetId,
  assetType,
  tryAssetExistingPlaceIsPlayable,
  canCreateOrUpdate = true,
}) => {
  const {
    control,
    trigger,
    resetField,
    setValue,
    getValues,
    formState: { dirtyFields },
  } = useFormContext<CreatorStoreConfigurationType>();
  const { translate, translateHTML } = useTranslation();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const { classes } = useTryAssetFormStyles();
  const { unifiedLogger } = useUnifiedLoggerProvider();
  // Studio dialog translations live in the Creations namespace (loaded via ConfigureDeveloperItemContainer)
  // We are using the default translations for all except the start your creation message
  const { open: openStudio, dialog: studioDialog } = useStudio({
    'Action.DownloadStudio': translate('Action.DownloadStudio'),
    'Message.CheckingStudio': translate('Message.CheckingStudio'),
    'Message.OpenStudioError': translate('Message.OpenStudioError'),
    'Message.StartYourCreation': translate('Action.EditDefaultExperienceInStudio'),
  });

  const tryAssetMode = useWatch({ control, name: TRY_ASSET_MODE_KEY });
  const tryAssetPlaceId = useWatch({ control, name: TRY_ASSET_PLACE_ID_KEY });
  // Stash the user-entered placeId so it can be restored when switching back to Custom mode
  const savedPlaceIdRef = useRef<string | null>(null);

  const launchData = `{"${LAUNCH_DATA_ASSET_ID_KEY}": ${assetId}}`;

  // Build the preview URL matching the format used by TryInRobloxButton in creator-marketplace-web
  const previewUrl = useMemo(() => {
    if (tryAssetMode === TryAssetMode.Disabled) {
      return null;
    }

    const placeId = tryAssetMode === TryAssetMode.Default ? DEFAULT_TBYB_PLACE_ID : tryAssetPlaceId;

    if (!placeId) {
      return null;
    }

    return buildTryAssetPreviewUrl(placeId, assetId);
  }, [tryAssetMode, tryAssetPlaceId, assetId]);

  const isTryAssetDirty = !!dirtyFields.tryAsset;
  const isPreviewDisabled = isTryAssetDirty || !previewUrl;

  const [triggerValidationDebounced] = useDebouncedFunction(() => {
    void trigger(TRY_ASSET_PLACE_ID_KEY);
  }, DEBOUNCED_VALIDATION_DELAY_MS);

  const isTryAssetEnabled =
    frontendFlags[FrontendFlagName.FrontendFlagEnableTryAssetSocialLink] &&
    TRY_ASSET_ENABLED_ASSET_TYPES.includes(assetType);

  const isDefaultExperienceEnabled =
    frontendFlags[FrontendFlagName.FrontendFlagEnableTryAssetDefaultExperience];

  const handleOpenDefaultInStudio = useCallback(() => {
    unifiedLogger.logClickEvent({
      eventName: 'assetConfiguration.tryInRobloxEditDefaultInStudio',
      parameters: {
        assetId: assetId.toString(),
      },
    });
    openStudio({
      task: EStudioTaskType.EditPlace,
      universeId: DEFAULT_TBYB_UNIVERSE_ID,
      placeId: DEFAULT_TBYB_PLACE_ID,
    });
  }, [openStudio, unifiedLogger, assetId]);

  const onTryAssetModeChange = useCallback(
    (newMode: string, fieldOnChange: (value: string) => void) => {
      const currentMode = getValues(TRY_ASSET_MODE_KEY);
      const customModeValue = TryAssetMode.Custom as string;
      if (currentMode === TryAssetMode.Custom && newMode !== customModeValue) {
        // Stash the current placeId before resetting so it can be restored later
        savedPlaceIdRef.current = getValues(TRY_ASSET_PLACE_ID_KEY) ?? null;
        // resetField clears both the value and the dirty/touched state
        resetField(TRY_ASSET_PLACE_ID_KEY);
      } else if (newMode === customModeValue && savedPlaceIdRef.current) {
        // Restore the previously entered placeId when switching back to Custom
        setValue(TRY_ASSET_PLACE_ID_KEY, savedPlaceIdRef.current, { shouldDirty: true });
      }
      fieldOnChange(newMode);
    },
    [getValues, resetField, setValue],
  );

  if (!isTryAssetEnabled) {
    return null;
  }

  return (
    <Grid container data-testid='try-asset-form' classes={{ root: classes.formContainer }}>
      <Grid item XSmall={12}>
        <Divider classes={{ root: classes.divider }} />
      </Grid>
      <Grid item XSmall={12}>
        <Typography component='h4' variant='h4' classes={{ root: classes.header }}>
          {translate('Label.TryInRoblox')}
        </Typography>
        <Typography color='secondary' variant='body2'>
          {translate(
            isDefaultExperienceEnabled
              ? 'Description.TryInRobloxWithDefaultOption'
              : 'Description.TryInRobloxWithoutDefaultOption',
          )}
        </Typography>
        {isDefaultExperienceEnabled && (
          <button
            type='button'
            onClick={handleOpenDefaultInStudio}
            className={classes.editDefaultLink}>
            {translate('Action.EditDefaultExperienceInStudio')}
            <OpenInNewIcon fontSize='inherit' />
          </button>
        )}

        {/* TBYB mode selection */}
        <Controller
          control={control}
          name={TRY_ASSET_MODE_KEY}
          render={({ field }) => (
            <div className={classes.radioGroup}>
              <RadioGroup
                value={field.value}
                onValueChange={(value) => onTryAssetModeChange(value, field.onChange)}
                size='Small'>
                {TRY_ASSET_MODE_OPTIONS.filter(
                  (option) => isDefaultExperienceEnabled || option.value !== TryAssetMode.Default,
                ).map((option) => (
                  <Radio
                    key={option.value}
                    value={option.value}
                    label={translate(option.label)}
                    hint={translate(option.hint)}
                    isDisabled={!canCreateOrUpdate && option.value !== TryAssetMode.Disabled}
                  />
                ))}
              </RadioGroup>
            </div>
          )}
        />

        {/* Custom mode content */}
        {tryAssetMode === TryAssetMode.Custom && (
          <div className={classes.customModeContent}>
            <Typography color='secondary' variant='body2' classes={{ root: classes.deepLinkInfo }}>
              {translateHTML('Description.TryInRobloxCustomDeepLink', [
                {
                  opening: 'reqLinkStart',
                  closing: 'reqLinkEnd',
                  content(chunks: React.ReactNode) {
                    return (
                      <Link
                        data-testid='launch-data-learn-more-link'
                        href={LAUNCH_DATA_LEARN_MORE_URL}
                        target='_blank'>
                        {chunks}
                      </Link>
                    );
                  },
                },
              ])}
            </Typography>
            <div>
              <Typography
                color='secondary'
                variant='codeDense'
                classes={{ root: classes.deepLinkCode }}>
                {launchData}
              </Typography>
            </div>

            {/* Warning for existing place that is not playable */}
            {tryAssetExistingPlaceIsPlayable === false && (
              <Alert severity='warning' classes={{ root: classes.existingPlaceNotValidAlert }}>
                <AlertTitle classes={{ root: classes.existingPlaceNotValidAlertTitle }}>
                  {translate('Label.ExistingPlaceNotPlayable')}
                </AlertTitle>
                <Typography variant='body1'>
                  {translate('Description.ExistingPlaceNotPlayable')}&nbsp;
                  <Link
                    data-testid='existing-place-not-playable-learn-more-link'
                    target='_blank'
                    aria-label={`${translate('Description.ExistingPlaceNotPlayable')}${translate(
                      'Label.LearnMore',
                    )}`}
                    href={RELEASE_EXPERIENCE_TO_PUBLIC_URL}>
                    {translate('Label.LearnMore')}
                  </Link>
                </Typography>
              </Alert>
            )}

            {/* Place ID text field */}
            <Controller
              control={control}
              name={TRY_ASSET_PLACE_ID_KEY}
              rules={{
                /*
                 * Note that on typing, we are only validating that the value is a positive number.
                 *
                 * Thorough Place validation is done on save via useSocialLinks > validateTryAssetPlaceId,
                 * called by the CreatorStoreConfiguration form.
                 */
                validate: (value) => {
                  if (value === null || value.length === 0 || parseInt(value, 10) >= 1) {
                    return true;
                  }
                  return translate('Error.InvalidPlaceId');
                },
              }}
              render={({ field, fieldState }) => {
                const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                  // Keep only the first 19 digits, which is the max digits in a C# long
                  const sanitizedInput = e.target.value.replaceAll(/[^0-9]/g, '').slice(0, 19);
                  // Set to null if empty to match the initial value and prevent dirty state issues
                  field.onChange(sanitizedInput === '' ? null : sanitizedInput);
                  triggerValidationDebounced();
                };

                return (
                  <TextField
                    {...field}
                    fullWidth
                    disabled={!canCreateOrUpdate}
                    data-testid='place-id-text-field'
                    margin='dense'
                    size='small'
                    type='text'
                    error={!!fieldState.error}
                    id={TRY_ASSET_PLACE_ID_ELEMENT_ID}
                    helperText={
                      fieldState.error?.message ?? translate('Label.TryInRobloxHelperText')
                    }
                    label={translate('Label.PlaceId')}
                    onChange={handleChange}
                    value={field.value ?? ''} // For the display value only we set null -> '' to keep the field controlled
                    classes={{ root: classes.placeIdField }}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                  />
                );
              }}
            />
          </div>
        )}

        {/* Preview experience button — always last in the section, enabled only when tryAsset config is saved */}
        {tryAssetMode !== TryAssetMode.Disabled && (
          <div className={classes.previewButton}>
            <Tooltip
              title={isPreviewDisabled ? translate('Label.SaveToPreviewTooltip') : ''}
              placement='right'
              arrow>
              <span>
                <Button
                  data-testid='preview-experience-button'
                  variant='outlined'
                  color='primary'
                  size='small'
                  disabled={isPreviewDisabled}
                  startIcon={<OpenInNewIcon />}
                  onClick={() => {
                    if (previewUrl) {
                      const isCustom = tryAssetMode === TryAssetMode.Custom;
                      unifiedLogger.logClickEvent({
                        eventName: 'assetConfiguration.tryInRobloxPreviewExperience',
                        parameters: {
                          assetId: assetId.toString(),
                          previewMode: isCustom ? 'custom' : 'default',
                          ...(isCustom && tryAssetPlaceId ? { placeId: tryAssetPlaceId } : {}),
                        },
                      });
                      window.open(previewUrl, '_blank');
                    }
                  }}>
                  {translate('Action.PreviewExperience')}
                </Button>
              </span>
            </Tooltip>
          </div>
        )}
      </Grid>
      {studioDialog}
    </Grid>
  );
};

export default TryAssetForm;
