import React, { useMemo, useCallback, Fragment, useState, useEffect } from 'react';
import type { Validate } from 'react-hook-form';
import { useFormContext, Controller, useWatch } from 'react-hook-form';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  Button,
  FormControl,
  Select,
  MenuItem,
  AddIcon,
  TextField,
  RemoveIcon,
  makeStyles,
  CircularProgress,
  IconButton,
  DeleteIcon,
  Link,
  Typography,
} from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { ExperimentProductType } from '../../api/universeExperimentationClientEnums';
import useVariantsConfigurationProvider from '../context/VariantsConfigurationContext';
import type { ConfigurationStepFormDataMatchmaking } from '../types/FormData';
import {
  MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT,
  ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID,
} from '../utils/getDefaultFormData';
import MatchmakingExperimentConfigurationStepTitle from './MatchmakingExperimentConfigurationStepTitle';

const useStyles = makeStyles()(() => ({
  // Table-like container
  tableContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '16px',
  },
  // variant rows
  tableRow: {
    display: 'flex',
    alignItems: 'flex-start',
    width: '100%',
    gap: '16px',
  },
  // column for data fields
  labelNameColumn: {
    width: '15%',
    display: 'flex',
    alignItems: 'flex-start',
  },
  selectorColumn: {
    width: '20%',
    display: 'flex',
    alignItems: 'flex-start',
  },
  removeIconColumn: {
    width: '5%',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  // Form field styling
  formField: {
    width: '100%',
  },
  loadingMenuItem: {
    textAlign: 'left',
    padding: '8px 16px',
  },
  selectMenu: {
    maxHeight: '400px',
    padding: 0,
    overflow: 'auto',
  },
  variantLabelTextField: {},
  placeSelector: {},
  configSelector: {},
}));

const MatchmakingExperimentConfigurationStep = () => {
  const {
    classes: {
      labelNameColumn,
      selectorColumn,
      removeIconColumn,
      loadingMenuItem,
      selectMenu,
      variantLabelTextField,
      placeSelector,
      configSelector,
      tableContainer,
      tableRow,
      formField,
    },
  } = useStyles();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { getConfigs } = useVariantsConfigurationProvider(ExperimentProductType.Matchmaking);
  const { id: universeId } = useUniverseResource();
  const {
    placesInfoToSelect,
    configurationsToSelect,
    placesToAppliedConfigurationMap,
    isLoadingPlacesWithConfigurations,
    isLoadingConfigurationsForUniverse,
    isPlacesLoading,
  } = useMemo(() => getConfigs().configs, [getConfigs]);

  const isScoringConfigsDataForPlacesLoading =
    isPlacesLoading || isLoadingPlacesWithConfigurations || isLoadingConfigurationsForUniverse;

  // Use loading states for natural deduplication instead of manual ref flags
  const guardedRefreshConfigs = useCallback(() => {
    // Use actual loading states as natural deduplication - if any data is loading,
    // it means a refresh is already in progress, so skip this call
    const isAnyDataLoading =
      isPlacesLoading || isLoadingConfigurationsForUniverse || isLoadingPlacesWithConfigurations;

    if (!isAnyDataLoading) {
      getConfigs().refresh();
    }
  }, [
    isPlacesLoading,
    isLoadingConfigurationsForUniverse,
    isLoadingPlacesWithConfigurations,
    getConfigs,
  ]);

  // refresh configs when user returns to this tab/window from anywhere
  useEffect(() => {
    // Covers switching between browser windows and applications
    window.addEventListener('focus', guardedRefreshConfigs);
    // Covers tab switching within the same window
    document.addEventListener('visibilitychange', guardedRefreshConfigs);

    return () => {
      window.removeEventListener('focus', guardedRefreshConfigs);
      document.removeEventListener('visibilitychange', guardedRefreshConfigs);
    };
  }, [guardedRefreshConfigs]);

  // Variant name validator
  const validateVariantName: Validate<string, ConfigurationStepFormDataMatchmaking> = useCallback(
    (value, formValues) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.VariantNameRequired',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }

      if (trimmedValue.length > 50) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.VariantNameTooLong',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }

      // Must starts with a letter and contains only letters, digits, spaces, underscores, or hyphens,
      if (!/^[a-zA-Z][a-zA-Z0-9 _-]*$/.test(trimmedValue)) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.VariantNameInvalidCharacters',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }

      // Check if this variant name already exists in other variants
      const hasDuplicate = formValues.matchmakingVariants.some(
        (variant, index) =>
          // Skip the current variant being validated
          index !==
            formValues.matchmakingVariants.findIndex((v) => v.label.trim() === trimmedValue) &&
          variant.label.trim() === trimmedValue,
      );

      if (hasDuplicate) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.VariantNameDuplicate',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
      return true;
    },
    [translate],
  );

  const validateVariantPlace: Validate<number | undefined, ConfigurationStepFormDataMatchmaking> =
    useCallback(
      (value, formValues) => {
        if (!value) {
          return translate(
            translationKey(
              'Message.ExperimentCreation.VariantPlaceRequired',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }

        // Check if this place ID is duplicated within any variant arm
        const hasDuplicatePlace = formValues.matchmakingVariants.some((variant) => {
          const placeIds = variant.placeScoringConfigs
            .map((config) => config.placeId)
            .filter((placeId) => placeId !== undefined && placeId !== null);

          // Check if there are any duplicates within this variant
          const uniquePlaceIds = new Set(placeIds);
          return placeIds.length !== uniquePlaceIds.size;
        });

        if (hasDuplicatePlace) {
          return translate(
            translationKey(
              'Message.ExperimentCreation.VariantPlaceDuplicate',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }

        return true;
      },
      [translate],
    );

  // Validation for scoring config id (required only)
  const validateScoringConfig: Validate<string | undefined, ConfigurationStepFormDataMatchmaking> =
    useCallback(
      (configId) => {
        if (configId === undefined || configId === null) {
          return translate(
            translationKey(
              'Message.ExperimentCreation.ScoringConfigRequired',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }
        return true;
      },
      [translate],
    );

  const { control, setValue, getValues, reset, watch } =
    useFormContext<ConfigurationStepFormDataMatchmaking>();

  // Reconcile form data after refresh to handle stale configurations
  const reconcileFormDataAfterRefresh = useCallback(() => {
    const currentFormValues = getValues();
    if (
      !currentFormValues.matchmakingVariants ||
      currentFormValues.matchmakingVariants.length === 0
    ) {
      return;
    }

    let hasChanges = false;
    const updatedVariants = currentFormValues.matchmakingVariants.map((variant, variantIndex) => {
      const updatedPlaceScoringConfigs = variant.placeScoringConfigs.map((placeConfig) => {
        // Get the latest applied configuration for this place
        let latestAppliedConfigId = ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID;
        if (placeConfig.placeId) {
          latestAppliedConfigId =
            placesToAppliedConfigurationMap.get(Number(placeConfig.placeId)) ??
            ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID;
        }

        // Check if the current configuration still exists
        const currentConfigExists = configurationsToSelect.some(
          (config) => config.id === placeConfig.matchmakingScoringConfigId,
        );

        if (variantIndex === 0) {
          // Control variant: Always use the latest applied configuration
          if (placeConfig.matchmakingScoringConfigId !== latestAppliedConfigId) {
            hasChanges = true;
            return {
              ...placeConfig,
              matchmakingScoringConfigId: latestAppliedConfigId,
              usePlatformDefault:
                latestAppliedConfigId === ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID,
            };
          }
        } else if (!currentConfigExists && placeConfig.matchmakingScoringConfigId) {
          // Treatment variants: Handle deleted configurations
          hasChanges = true;
          return {
            ...placeConfig,
            matchmakingScoringConfigId: undefined,
            usePlatformDefault: false, // Back to unselected state
          };
        }

        return placeConfig;
      });

      return {
        ...variant,
        placeScoringConfigs: updatedPlaceScoringConfigs,
      };
    });

    // Update form if there were changes
    if (hasChanges) {
      // Set value with shouldDirty to ensure form state updates
      setValue('matchmakingVariants', updatedVariants, { shouldDirty: true });

      // Reset with updated values to prevent index shifting from causing orphaned field registrations
      const newFormValues = { ...currentFormValues, matchmakingVariants: updatedVariants };
      // Force a reset with the same values to ensure synchronization
      setTimeout(() => {
        reset(newFormValues, { keepDirty: true, keepTouched: true, keepDefaultValues: true });
      }, 0);
    }
  }, [getValues, setValue, reset, placesToAppliedConfigurationMap, configurationsToSelect]);

  // Reconcile form data when fresh configuration data becomes available (initial load or after refresh)
  useEffect(() => {
    // Skip if data is still loading
    if (isScoringConfigsDataForPlacesLoading) {
      return;
    }

    // Always reconcile when data is available - this covers both initial load and after refresh
    reconcileFormDataAfterRefresh();
  }, [
    // Trigger reconciliation when loading completes (initial load or after refresh)
    isScoringConfigsDataForPlacesLoading,
    reconcileFormDataAfterRefresh,
  ]);

  // Watch variants to trigger re-renders when form data changes
  const allVariants = useWatch({
    control,
    name: 'matchmakingVariants',
  });

  // the place scoring configs for the control variant (to conveniently
  // track the selected places)
  const controlVariantPlaceScoringConfigs = useMemo(
    () => allVariants[0]?.placeScoringConfigs || [],
    [allVariants],
  );

  // Local state to track selected places for better performance and reliability
  const [selectedPlaces, setSelectedPlaces] = useState<Set<number>>(new Set());

  // Initialize selected places from form data
  useEffect(() => {
    const currentPlaces =
      allVariants[0]?.placeScoringConfigs
        ?.map((config) => Number(config.placeId))
        .filter(
          (placeId): placeId is number => !Number.isNaN(placeId) && Number.isFinite(placeId),
        ) || [];

    setSelectedPlaces(new Set(currentPlaces));
  }, [allVariants]);

  const addVariant = useCallback(() => {
    const currentValues = getValues();
    const currentVariants = currentValues.matchmakingVariants;

    // Create new place configs with the same structure but empty configuration IDs
    const newPlaceScoringConfigs = controlVariantPlaceScoringConfigs.map((placeConfig) => ({
      placeId: placeConfig.placeId,
      matchmakingScoringConfigId: undefined, // undefined for new selection
      usePlatformDefault: undefined, // undefined for new selection
    }));

    const newVariantLabel = `Variant ${currentVariants.length}`;
    const newVariant = {
      label: newVariantLabel,
      weight: MATCHMAKING_VARIANT_RELATIVE_WEIGHT_UNIT_WEIGHT,
      isBaseline: false,
      placeScoringConfigs: newPlaceScoringConfigs,
    };

    const updatedVariants = [...currentVariants, newVariant];

    // First set the value to trigger form state update
    setValue('matchmakingVariants', updatedVariants, { shouldDirty: true });

    // Then reset to ensure proper field registration with the new structure
    const newFormValues = { ...currentValues, matchmakingVariants: updatedVariants };
    reset(newFormValues, { keepDirty: true, keepTouched: true });
  }, [controlVariantPlaceScoringConfigs, getValues, setValue, reset]);

  // Callback for checking if a place is already selected in other columns
  const isPlaceSelected = useCallback(
    (placeId: number | undefined) => {
      if (placeId === undefined) {
        return false;
      }
      return selectedPlaces.has(placeId);
    },
    [selectedPlaces],
  );

  const updatePlaceForAllVariants = useCallback(
    (placeIndex: number, newPlaceId: number) => {
      // Create new variants array with updated place IDs
      const controlVariantPlaceConfigValue =
        placesToAppliedConfigurationMap.get(newPlaceId) ??
        ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID;
      const usePlatformDefaultValue =
        controlVariantPlaceConfigValue === ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID;

      // Get current form values to avoid stale data
      const currentFormValues = getValues();
      const currentVariants = currentFormValues.matchmakingVariants;

      // Get the old place ID to remove from selected places
      const oldPlaceId = currentVariants[0]?.placeScoringConfigs[placeIndex]?.placeId;

      const updatedVariants = currentVariants.map((variant, variantIndex) => ({
        ...variant,
        placeScoringConfigs: variant.placeScoringConfigs.map((config, configIndex) =>
          configIndex === placeIndex
            ? {
                ...config,
                placeId: newPlaceId,
                matchmakingScoringConfigId:
                  variantIndex === 0
                    ? controlVariantPlaceConfigValue
                    : config.matchmakingScoringConfigId,
                usePlatformDefault:
                  variantIndex === 0 ? usePlatformDefaultValue : config.usePlatformDefault,
              }
            : config,
        ),
      }));

      // Set value with shouldDirty to ensure form state updates
      setValue('matchmakingVariants', updatedVariants, { shouldDirty: true });

      // Reset to ensure all fields are properly re-registered with new values
      const newFormValues = { ...currentFormValues, matchmakingVariants: updatedVariants };
      reset(newFormValues, { keepDirty: true, keepTouched: true });

      // Update selected places state
      setSelectedPlaces((prev) => {
        const newSet = new Set(prev);
        if (oldPlaceId !== undefined && oldPlaceId !== null) {
          newSet.delete(oldPlaceId);
        }
        newSet.add(newPlaceId);
        return newSet;
      });
    },
    [getValues, setValue, reset, placesToAppliedConfigurationMap],
  );

  const addPlaceToAllVariants = useCallback(() => {
    // Get current form values to avoid stale data
    const currentFormValues = getValues();
    const currentVariants = currentFormValues.matchmakingVariants;

    const updatedVariants = currentVariants.map((variant, variantIndex) => ({
      ...variant,
      placeScoringConfigs: [
        ...variant.placeScoringConfigs,
        {
          placeId: undefined,
          matchmakingScoringConfigId:
            variantIndex === 0 ? ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID : undefined,
          usePlatformDefault: variantIndex === 0,
        },
      ],
    }));

    // Set value with shouldDirty to ensure form state updates
    setValue('matchmakingVariants', updatedVariants, { shouldDirty: true });

    // Reset with updated values to ensure proper field registration for new places
    const newFormValues = { ...currentFormValues, matchmakingVariants: updatedVariants };
    reset(newFormValues, { keepDirty: true, keepTouched: true });

    // No need to update selectedPlaces since new place starts as undefined
  }, [getValues, setValue, reset]);

  const removeLastPlaceFromAllVariants = useCallback(() => {
    // Get current form values to avoid stale data
    const currentFormValues = getValues();
    const currentVariants = currentFormValues.matchmakingVariants;

    // Get the place ID that will be removed
    const lastPlaceConfig = currentVariants[0]?.placeScoringConfigs?.slice(-1)[0];
    const removedPlaceId = lastPlaceConfig?.placeId;

    const updatedVariants = currentVariants.map((variant) => ({
      ...variant,
      placeScoringConfigs: variant.placeScoringConfigs.slice(0, -1),
    }));

    // Set value with shouldDirty to ensure form state updates
    setValue('matchmakingVariants', updatedVariants, { shouldDirty: true });

    // Reset with updated values to prevent index shifting from causing orphaned field registrations
    const newFormValues = { ...currentFormValues, matchmakingVariants: updatedVariants };
    // Force a reset with the same values to ensure synchronization
    setTimeout(() => {
      reset(newFormValues, { keepDirty: true, keepTouched: true, keepDefaultValues: true });
    }, 0);

    // Update selected places state
    if (removedPlaceId !== undefined && removedPlaceId !== null) {
      setSelectedPlaces((prev) => {
        const newSet = new Set(prev);
        newSet.delete(removedPlaceId);
        return newSet;
      });
    }
  }, [getValues, setValue, reset]);

  // Clean remove function using getValues/setValue with reset to prevent orphaned fields
  const handleRemoveVariant = useCallback(
    (variantIndex: number) => {
      const currentValues = getValues();
      const updatedVariants = currentValues.matchmakingVariants.filter(
        (_, index) => index !== variantIndex,
      );

      // Then reset with the new structure to ensure all fields are properly re-registered
      // This is critical to prevent stale field registrations from the removed variant
      const newFormValues = { ...currentValues, matchmakingVariants: updatedVariants };

      // First set the value with shouldDirty to ensure form state updates
      setValue('matchmakingVariants', updatedVariants, { shouldDirty: true });
      // Force a reset with the same values to ensure synchronization
      setTimeout(() => {
        reset(newFormValues, { keepDirty: true, keepTouched: true, keepDefaultValues: true });
      }, 0);
    },
    [getValues, setValue, reset],
  );

  const makeGoToCustomMatchmakingLinkUnderlined = useCallback(
    (chunks: React.ReactNode) => {
      return (
        <Link
          href={dashboard.getCustomMatchmakingDashboardUrl(Number(universeId))}
          target='_blank'
          underline='always'
          color='inherit'>
          {chunks}
        </Link>
      );
    },
    [universeId],
  );

  const createAScoringConfigurationText = useMemo(() => {
    return translateHTML(
      translationKey(
        'Message.ExperimentCreation.CreateAScoringConfiguration',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
      [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content: makeGoToCustomMatchmakingLinkUnderlined,
        },
      ],
    );
  }, [makeGoToCustomMatchmakingLinkUnderlined, translateHTML]);

  return (
    <>
      <MatchmakingExperimentConfigurationStepTitle />
      <div className={tableContainer}>
        {/* Header row - place selectors */}
        <div className={tableRow}>
          {/* Empty column for variant labels */}
          <div className={labelNameColumn} />

          {/* Place selector columns */}
          {controlVariantPlaceScoringConfigs.map((placeConfig, placeIndex) => (
            <div
              className={selectorColumn}
              // eslint-disable-next-line react/no-array-index-key -- using index as key
              key={`place-selector-${placeIndex}`}>
              <Controller
                control={control}
                key={`place-controller-${placeConfig.placeId || placeIndex}-${allVariants.length}`}
                name={`matchmakingVariants.0.placeScoringConfigs.${placeIndex}.placeId`}
                rules={{
                  validate: (placeId, formValues) => validateVariantPlace(placeId, formValues),
                }}
                render={({ field, fieldState: { error } }) => (
                  <FormControl fullWidth className={formField}>
                    <Select
                      className={placeSelector}
                      {...field}
                      // eslint-disable-next-line react/no-array-index-key -- using index as key
                      key={`place-select-${placeIndex}`}
                      data-testid={`place-selector-${placeIndex}`}
                      // Use field.value directly since we're registering to placeId field
                      value={field.value || ''}
                      onChange={(e) => {
                        const newPlaceId = Number(e.target.value);
                        field.onChange(newPlaceId);

                        // Update all variants with the new place
                        updatePlaceForAllVariants(placeIndex, newPlaceId);
                      }}
                      // Label source string: Select place
                      label={translate(
                        translationKey(
                          'Label.ExperimentCreation.SelectPlace',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      )}
                      error={!!error}
                      helperText={error?.message}
                      SelectProps={{
                        MenuProps: {
                          PaperProps: {
                            className: selectMenu,
                          },
                        },
                      }}>
                      {placesInfoToSelect.map((place) => {
                        return (
                          <MenuItem
                            key={place.placeId}
                            value={place.placeId}
                            disabled={isPlaceSelected(place.placeId)}
                            data-testid={`place-selector-${placeIndex}-${place.placeId}`}>
                            {place.name}
                          </MenuItem>
                        );
                      })}
                      {/* Loading indicator at bottom if still loading */}
                      {isPlacesLoading && (
                        <div className={loadingMenuItem}>
                          <CircularProgress size={18} />
                        </div>
                      )}
                    </Select>
                  </FormControl>
                )}
              />
            </div>
          ))}

          {/* Empty column for remove buttons */}
          <div className={removeIconColumn} />
        </div>

        {/* Data rows - variant configurations */}
        {allVariants.map((variant, variantIndex) => (
          <div
            // eslint-disable-next-line react/no-array-index-key -- Need index for form field registration
            key={`variant-${variantIndex}-${allVariants.length}`}
            className={tableRow}>
            {/* Variant label column */}
            <div className={labelNameColumn}>
              <Controller
                control={control}
                // eslint-disable-next-line react/no-array-index-key -- Need index for form field registration
                key={`variant-label-${variantIndex}-${allVariants.length}`}
                name={`matchmakingVariants.${variantIndex}.label`}
                rules={{
                  validate: validateVariantName,
                }}
                render={({ field, fieldState: { error } }) => (
                  <TextField
                    className={`${variantLabelTextField} ${formField}`}
                    id={`variant-${variantIndex}-label-name`}
                    data-testid={`variant-label-name-${variantIndex}`}
                    {...field}
                    fullWidth
                    // Label source string: Name
                    label={translate(
                      translationKey(
                        'Label.VariantName',
                        TranslationNamespace.UniverseConfigAndExperimentation,
                      ),
                    )}
                    error={!!error}
                    helperText={error?.message}
                  />
                )}
              />
            </div>

            {/* Config selector columns */}
            {controlVariantPlaceScoringConfigs.map((placeConfig, placeIndex) => (
              <div
                className={selectorColumn}
                // eslint-disable-next-line react/no-array-index-key -- using index as key
                key={`config-${variantIndex}-${placeIndex}-${allVariants.length}-${controlVariantPlaceScoringConfigs.length}`}>
                <Controller
                  control={control}
                  name={`matchmakingVariants.${variantIndex}.placeScoringConfigs.${placeIndex}.matchmakingScoringConfigId`}
                  rules={{
                    validate: validateScoringConfig,
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <FormControl fullWidth className={formField}>
                      <Select
                        {...field}
                        className={configSelector}
                        // Use field.value directly since we're registering to matchmakingScoringConfigId field
                        value={watch(
                          `matchmakingVariants.${variantIndex}.placeScoringConfigs.${placeIndex}.matchmakingScoringConfigId`,
                        )}
                        onChange={(e) => {
                          const newConfigId = e.target.value;
                          field.onChange(newConfigId);
                          // Update usePlatformDefault separately using setValue
                          const usePlatformDefault =
                            newConfigId === ROBLOX_DEFAULT_MATCHMAKING_SCORING_CONFIG_ID;
                          setValue(
                            `matchmakingVariants.${variantIndex}.placeScoringConfigs.${placeIndex}.usePlatformDefault`,
                            usePlatformDefault,
                          );
                        }}
                        // label is not visible for treatment variants
                        // Label source string: Select config
                        label={
                          variantIndex === 0
                            ? translate(
                                translationKey(
                                  'Label.ExperimentCreation.SelectConfig',
                                  TranslationNamespace.UniverseConfigAndExperimentation,
                                ),
                              )
                            : ''
                        }
                        data-testid={`config-selector-${variantIndex}-place-${placeIndex}`}
                        error={!!error}
                        helperText={error?.message}
                        disabled={variantIndex === 0}
                        displayEmpty
                        variant='outlined'
                        InputLabelProps={{ shrink: true }}
                        SelectProps={{
                          MenuProps: {
                            PaperProps: {
                              className: selectMenu,
                            },
                          },
                        }}>
                        {configurationsToSelect.map((config) => {
                          return (
                            <MenuItem
                              key={config.id}
                              value={config.id}
                              data-testid={`config-selector-${variantIndex}-place-${placeIndex}-${config.id}`}>
                              {config.name}
                            </MenuItem>
                          );
                        })}
                        {isScoringConfigsDataForPlacesLoading && (
                          <div className={loadingMenuItem}>
                            <CircularProgress size={18} />
                          </div>
                        )}
                      </Select>
                    </FormControl>
                  )}
                />
              </div>
            ))}

            {/* Remove button column */}
            <div className={removeIconColumn}>
              {variantIndex > 1 && (
                <IconButton
                  data-testid={`remove-variant-icon-button-${variantIndex}`}
                  onClick={() => handleRemoveVariant(variantIndex)}
                  aria-label='Remove variant'
                  size='large'>
                  <DeleteIcon color='secondary' fontSize='large' />
                </IconButton>
              )}
            </div>
          </div>
        ))}
        {/* add/remove variant or place buttons */}
        <Grid container direction='row' className={tableRow}>
          <Grid item>
            <Button
              variant='contained'
              color='secondary'
              size='small'
              data-testid='add-variant-button'
              onClick={addVariant}
              startIcon={<AddIcon />}
              // diable adding more variants than the allowed 4
              disabled={allVariants.length > 3}>
              {/* Label source string: Variant */}
              {translate(
                translationKey(
                  'Label.ExperimentCreation.Variant',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='contained'
              color='secondary'
              size='small'
              data-testid='add-place-button'
              onClick={addPlaceToAllVariants}
              startIcon={<AddIcon />}
              disabled={controlVariantPlaceScoringConfigs.length > 3}>
              {/* Label source string: Place */}
              {translate(
                translationKey(
                  'Label.ExperimentCreation.Place',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant='contained'
              color='secondary'
              size='small'
              data-testid='remove-place-button'
              onClick={removeLastPlaceFromAllVariants}
              disabled={controlVariantPlaceScoringConfigs.length <= 1}
              startIcon={<RemoveIcon />}>
              {/* Label source string: Place */}
              {translate(
                translationKey(
                  'Label.ExperimentCreation.Place',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Button>
          </Grid>
          <Grid item alignSelf='center'>
            <Typography variant='body2' color='secondary'>
              {createAScoringConfigurationText}
            </Typography>
          </Grid>
        </Grid>
      </div>
    </>
  );
};

export default MatchmakingExperimentConfigurationStep;
