import React, { useCallback, useEffect, useMemo } from 'react';
import type { Validate } from 'react-hook-form';
import { Controller, useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import {
  TextField,
  Select,
  MenuItem,
  Grid,
  Button,
  InputAdornment,
  makeStyles,
  AddIcon,
  IconButton,
  EditIcon,
  useDialog,
  Typography,
  DeleteIcon,
} from '@rbx/ui';
import {
  isExperimentNullControlValueEnabled as isExperimentNullControlValueEnabledFlag,
  isTargetingConfigsEnabled as isTargetingConfigsEnabledFlag,
} from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { analyticsConfigsNavigationItem } from '@modules/charts-generic/constants/analyticsNavigationItems';
import buildExperienceAnalyticsUrlWithParams from '@modules/charts-generic/utils/analyticsUrlBuilder';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { Link } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import useConfigBooleanValidator from '../../hooks/useConfigBooleanValidator';
import useConfigJsonValidator from '../../hooks/useConfigJsonValidator';
import useConfigNumberValidator from '../../hooks/useConfigNumberValidator';
import useConfigStringValidator from '../../hooks/useConfigStringValidator';
import { ValidationError, type ValidationResult } from '../../hooks/validatorTypes';
import { configEntryHasConditionValues } from '../../utils/configConditionValueExpansion';
import useLatestChosenConfigPublishedEntryForExperiment from '../hooks/useLatestChosenConfigPublishedEntryForExperiment';
import type { ConfigurationStepFormDataInExperience } from '../types/FormData';
import useConfigKeyInfiniteSelect from './ConfigKeyInfiniteSelect';
import JSONEditorDialog from './JSONEditorDialog';

const MAX_VARIANTS_ALLOWED = 5;

const useStyles = makeStyles()((theme) => ({
  variantContainer: {
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    width: '100%',
    gap: '16px',
    [theme.breakpoints.down('Medium')]: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  variantField: {
    maxWidth: '240px',
    flex: 1,
  },
  removeVariantButton: {
    alignSelf: 'center',
  },
}));

const ConfigsExperimentConfigurationStep = () => {
  const {
    classes: { variantContainer, variantField, removeVariantButton },
  } = useStyles();
  const validateConfigBooleanValue = useConfigBooleanValidator();
  const validateConfigStringValue = useConfigStringValidator();
  const validateConfigJsonValue = useConfigJsonValidator();
  const validateConfigNumberValue = useConfigNumberValidator();
  const { id: universeId } = useUniverseResource();
  const flagContext = { universeId };
  const { ready: isTargetingConfigsReady, value: isTargetingConfigsEnabledValue } = useFlag(
    isTargetingConfigsEnabledFlag,
    flagContext,
  );
  const {
    ready: isExperimentNullControlValueReady,
    value: isExperimentNullControlValueEnabledValue,
  } = useFlag(isExperimentNullControlValueEnabledFlag, flagContext);
  const isTargetingConfigsEnabled = isTargetingConfigsReady && isTargetingConfigsEnabledValue;
  const isExperimentNullControlValueEnabled =
    isExperimentNullControlValueReady && isExperimentNullControlValueEnabledValue;
  const shouldSendNullControlValue =
    isTargetingConfigsEnabled && isExperimentNullControlValueEnabled;
  const { translate, translateHTML, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { renderConfigSelect } = useConfigKeyInfiniteSelect();

  // Config key validator
  const validateConfigKeyFormField: Validate<
    ConfigurationStepFormDataInExperience['chosenConfig'],
    ConfigurationStepFormDataInExperience
  > = useCallback(
    (value) => {
      if (value) {
        return true;
      }
      return translate(
        translationKey(
          'Message.ExperimentCreation.ConfigKeyRequired',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    },
    [translate],
  );

  // Variant name validator
  const validateVariantName: Validate<string, ConfigurationStepFormDataInExperience> = useCallback(
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

      const firstIndex = formValues.variants.findIndex((v) => v.label.trim() === trimmedValue);
      const lastIndex = formValues.variants.findLastIndex((v) => v.label.trim() === trimmedValue);
      if (firstIndex !== lastIndex) {
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

  const controlWeightTooLowMessage = tPendingTranslation(
    'Control weight must be greater than 0',
    'Validation error shown when the control variant weight is 0% during experiment creation.',
    translationKey(
      'Message.ExperimentCreation.ControlWeightTooLow',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );

  // Variant weight validator — baseline uses a dedicated factory so the read-only
  // control field stays registered with react-hook-form and validates on submit.
  const makeValidateVariantWeight = useCallback(
    (variantIndex: number): Validate<number, ConfigurationStepFormDataInExperience> =>
      (value, formValues) => {
        const variant = formValues.variants[variantIndex];
        const isBaseline = variant?.isBaseline ?? false;

        if (isBaseline) {
          if (!value || value < 1) {
            return controlWeightTooLowMessage;
          }

          const totalWeight = formValues.variants.reduce(
            (acc, formVariant) => acc + formVariant.weight,
            0,
          );
          if (totalWeight !== 100) {
            return translate(
              translationKey(
                'Message.ExperimentCreation.VariantWeightSumNot100',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            );
          }

          return true;
        }

        if (!value) {
          return translate(
            translationKey(
              'Message.ExperimentCreation.VariantWeightRequired',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }
        if (value < 1) {
          return translate(
            translationKey(
              'Message.ExperimentCreation.VariantWeightTooLow',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }
        if (value > 99) {
          return translate(
            translationKey(
              'Message.ExperimentCreation.VariantWeightTooHigh',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }
        const totalWeight = formValues.variants.reduce(
          (acc, formVariant) => acc + formVariant.weight,
          0,
        );
        if (totalWeight !== 100) {
          return translate(
            translationKey(
              'Message.ExperimentCreation.VariantWeightSumNot100',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          );
        }
        return true;
      },
    [controlWeightTooLowMessage, translate],
  );

  // Variant value validator
  const makeVariantValueValidator = useCallback(
    (
      valueType: ValidConfigEntryValueType,
    ): Validate<string, ConfigurationStepFormDataInExperience> =>
      (value) => {
        let validationResult: ValidationResult<ValidationError>;
        switch (valueType) {
          case ValidConfigEntryValueType.String:
            validationResult = validateConfigStringValue({ value });
            break;
          case ValidConfigEntryValueType.Boolean:
            validationResult = validateConfigBooleanValue({ value });
            break;
          case ValidConfigEntryValueType.Number:
            validationResult = validateConfigNumberValue({
              value,
              errorMessageOverrides: {
                [ValidationError.InvalidNumber]: translationKey(
                  'Message.ExperimentCreation.VariantNumberValueInvalid',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              },
            });
            break;
          case ValidConfigEntryValueType.Json:
            validationResult = validateConfigJsonValue({
              value,
              errorMessageOverrides: {
                [ValidationError.InvalidJson]: translationKey(
                  'Message.ExperimentCreation.VariantJsonValueInvalid',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              },
            });
            break;
          default: {
            const exhaustiveCheck: never = valueType;
            throw new Error(`Unhandled value type: ${String(exhaustiveCheck)}`);
          }
        }

        if (validationResult.isValid) {
          return true;
        }

        return validationResult.message ?? false;
      },
    [
      validateConfigBooleanValue,
      validateConfigJsonValue,
      validateConfigNumberValue,
      validateConfigStringValue,
    ],
  );

  const { control, trigger } = useFormContext<ConfigurationStepFormDataInExperience>();
  const { open, close, configure } = useDialog();

  const {
    fields: variantsFields,
    append,
    remove,
    update,
  } = useFieldArray({
    control,
    name: 'variants',
  });

  const onClickEditJson = useCallback(
    (intialValue: string, index: number) => {
      const onSave = (value: string) => {
        update(index, {
          ...variantsFields[index],
          value,
        });
        // trigger field validation
        void trigger(`variants.${index}.value`);
        close();
      };

      configure(<JSONEditorDialog initialValue={intialValue} onCancel={close} onSave={onSave} />, {
        maxWidth: 'Large',
        fullWidth: true,
      });

      open();
    },
    [close, configure, open, trigger, update, variantsFields],
  );

  const chosenConfig = useWatch({ control, name: 'chosenConfig' });
  const { publishedEntry: chosenPublishedEntry, formValue: chosenConfigValue } =
    useLatestChosenConfigPublishedEntryForExperiment({
      chosenConfigKey: chosenConfig?.key,
    });
  const baselineHasConditionValues =
    isTargetingConfigsEnabled && configEntryHasConditionValues(chosenPublishedEntry);
  const multipleValuesLabel = tPendingTranslation(
    'Multiple',
    'Label for a multiple value in the table.',
    translationKey(
      'Table.Column.Value.Multiple',
      TranslationNamespace.UniverseConfigAndExperimentation,
    ),
  );
  const { baselineVariant, baselineVariantIndex } = useMemo(() => {
    const index = variantsFields.findIndex((variant) => variant.isBaseline);
    return {
      baselineVariant: variantsFields[index],
      baselineVariantIndex: index,
    };
  }, [variantsFields]);

  const addVariant = useCallback(() => {
    append({ label: '', weight: 50, value: '', isBaseline: false });
  }, [append]);

  const removeVariant = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const indexToRemove = Number(e.currentTarget.value);

      const totalWeightWithoutBaselineAndRemovedVariant = variantsFields.reduce(
        (acc, variant, variantIndex) => {
          if (variant.isBaseline || variantIndex === indexToRemove) {
            return acc;
          }
          return acc + variant.weight;
        },
        0,
      );
      // Auto update baseline variant weight before removing the target variant
      update(baselineVariantIndex, {
        ...baselineVariant,
        weight: Math.max(0, 100 - totalWeightWithoutBaselineAndRemovedVariant),
      });
      remove(indexToRemove);
    },
    [update, baselineVariantIndex, baselineVariant, variantsFields, remove],
  );

  // When null control values are disabled, keep the baseline variant value in sync with the published config.
  useEffect(() => {
    if (shouldSendNullControlValue) {
      return;
    }

    if (chosenConfigValue != null && baselineVariant.value !== chosenConfigValue) {
      update(baselineVariantIndex, {
        label: baselineVariant.label,
        weight: baselineVariant.weight,
        isBaseline: true,
        value: chosenConfigValue,
      });
    }
  }, [
    baselineVariant,
    baselineVariantIndex,
    chosenConfigValue,
    shouldSendNullControlValue,
    update,
  ]);

  const variantsForm = useMemo(() => {
    if (!chosenConfig) {
      return null;
    }

    const { valueType } = chosenConfig;
    return (
      <>
        <Typography variant='h6'>
          {translate(
            translationKey(
              'Label.ExperimentCreation.Variants',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Typography>
        <Grid container item gap='24px'>
          {variantsFields.map((variantFields, index) => {
            return (
              <Grid item key={variantFields.id} classes={{ root: variantContainer }}>
                <Controller
                  control={control}
                  name={`variants.${index}.label`}
                  rules={{
                    validate: validateVariantName,
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      data-testid={`variant-label-${index}`}
                      label={translate(
                        translationKey(
                          'Label.VariantName',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      )}
                      id={`variant-label-${index}`}
                      error={!!error}
                      helperText={error?.message}
                      classes={{ root: variantField }}
                      disabled={variantFields.isBaseline}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`variants.${index}.weight`}
                  rules={{
                    validate: makeValidateVariantWeight(index),
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      data-testid={`variant-weight-${index}`}
                      onChange={(e) => {
                        if (variantFields.isBaseline) {
                          return;
                        }
                        const { value } = e.target;
                        const intValue = parseInt(value, 10);
                        const newWeight = Number.isNaN(intValue) ? 0 : intValue;
                        field.onChange(newWeight);

                        // Auto update baseline variant weight with 100 - totalWeightWithoutBaselineVariant
                        const totalWeightWithoutBaselineVariant = variantsFields.reduce(
                          (acc, variant, variantIndex) => {
                            if (variantIndex === index) {
                              return acc + newWeight;
                            }
                            if (variant.isBaseline) {
                              return acc;
                            }
                            return acc + variant.weight;
                          },
                          0,
                        );
                        update(baselineVariantIndex, {
                          ...baselineVariant,
                          weight: Math.max(0, 100 - totalWeightWithoutBaselineVariant),
                        });
                        // trigger validations on modified weight fields
                        void trigger(`variants.${index}.weight`);
                        void trigger(`variants.${baselineVariantIndex}.weight`);
                      }}
                      label={translate(
                        translationKey(
                          'Label.VariantWeight',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      )}
                      id={`variant-weight-${index}`}
                      InputProps={{
                        readOnly: variantFields.isBaseline,
                        endAdornment: <InputAdornment position='end'>%</InputAdornment>,
                      }}
                      error={!!error}
                      helperText={error?.message}
                      inputMode='numeric'
                      classes={{ root: variantField }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`variants.${index}.value`}
                  rules={{
                    validate:
                      isTargetingConfigsEnabled &&
                      variantFields.isBaseline &&
                      (shouldSendNullControlValue || baselineHasConditionValues)
                        ? () => true
                        : makeVariantValueValidator(valueType),
                  }}
                  render={({ field, fieldState: { error } }) => {
                    const baselineDisplayValue =
                      isTargetingConfigsEnabled && variantFields.isBaseline
                        ? baselineHasConditionValues
                          ? multipleValuesLabel
                          : shouldSendNullControlValue
                            ? (chosenConfigValue ?? '')
                            : field.value
                        : field.value;
                    const commonProps = {
                      label: translate(
                        translationKey(
                          'Label.VariantValue',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      ),
                      id: `variant-value-${index}`,
                      'data-testid': `variant-value-${index}`,
                      error: !!error,
                      helperText: error?.message,
                      classes: { root: variantField },
                    };
                    if (
                      isTargetingConfigsEnabled &&
                      variantFields.isBaseline &&
                      baselineHasConditionValues
                    ) {
                      return (
                        <TextField
                          {...commonProps}
                          value={multipleValuesLabel}
                          fullWidth
                          disabled
                        />
                      );
                    }
                    switch (valueType) {
                      case ValidConfigEntryValueType.Boolean: {
                        return (
                          <Select
                            {...field}
                            {...commonProps}
                            value={baselineDisplayValue}
                            variant='outlined'
                            fullWidth
                            disabled={variantFields.isBaseline}>
                            <MenuItem value='true'>
                              {translate(
                                translationKey(
                                  'Message.ExperimentCreation.VariantBooleanValueTrue',
                                  TranslationNamespace.UniverseConfigAndExperimentation,
                                ),
                              )}
                            </MenuItem>
                            <MenuItem value='false'>
                              {translate(
                                translationKey(
                                  'Message.ExperimentCreation.VariantBooleanValueFalse',
                                  TranslationNamespace.UniverseConfigAndExperimentation,
                                ),
                              )}
                            </MenuItem>
                          </Select>
                        );
                      }
                      case ValidConfigEntryValueType.String:
                      case ValidConfigEntryValueType.Number: {
                        return (
                          <TextField
                            {...field}
                            {...commonProps}
                            value={baselineDisplayValue}
                            fullWidth
                            disabled={variantFields.isBaseline}
                          />
                        );
                      }
                      case ValidConfigEntryValueType.Json: {
                        return (
                          <TextField
                            {...field}
                            {...commonProps}
                            value={baselineDisplayValue}
                            fullWidth
                            disabled={variantFields.isBaseline}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position='end'>
                                  <IconButton
                                    aria-label='edit'
                                    onClick={() => {
                                      onClickEditJson(baselineDisplayValue, index);
                                    }}
                                    disabled={variantFields.isBaseline}>
                                    <EditIcon color='secondary' />
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        );
                      }
                      default: {
                        const exhaustiveCheck: never = valueType;
                        throw new Error(`Unhandled value type: ${String(exhaustiveCheck)}`);
                      }
                    }
                  }}
                />

                {index >= 2 && (
                  <IconButton
                    aria-label='Remove variant'
                    onClick={removeVariant}
                    variant='contained'
                    color='secondary'
                    value={index}
                    disableRipple
                    classes={{ root: removeVariantButton }}>
                    <DeleteIcon color='secondary' />
                  </IconButton>
                )}
              </Grid>
            );
          })}
          <Button
            onClick={addVariant}
            variant='contained'
            color='secondary'
            size='small'
            startIcon={<AddIcon />}
            disabled={variantsFields.length >= MAX_VARIANTS_ALLOWED}
            disableRipple>
            {translate(
              translationKey(
                'Action.ExperimentCreation.AddVariant',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
          </Button>
        </Grid>
      </>
    );
  }, [
    chosenConfig,
    chosenConfigValue,
    shouldSendNullControlValue,
    baselineHasConditionValues,
    multipleValuesLabel,
    isTargetingConfigsEnabled,
    translate,
    variantsFields,
    addVariant,
    variantContainer,
    control,
    validateVariantName,
    makeValidateVariantWeight,
    makeVariantValueValidator,
    removeVariant,
    removeVariantButton,
    variantField,
    update,
    baselineVariantIndex,
    baselineVariant,
    trigger,
    onClickEditJson,
  ]);

  const makeGoToConfigsLinkUnderlined = useCallback(
    (chunks: React.ReactNode) => {
      return (
        <Link
          href={buildExperienceAnalyticsUrlWithParams(
            analyticsConfigsNavigationItem,
            {},
            universeId,
          )}
          target='_blank'
          underline='always'
          color='inherit'>
          {chunks}
        </Link>
      );
    },
    [universeId],
  );

  const createAConfigKeyHelperText = useMemo(() => {
    return translateHTML(
      translationKey(
        'Message.ExperimentCreation.CreateAConfigKey',
        TranslationNamespace.UniverseConfigAndExperimentation,
      ),
      [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content: makeGoToConfigsLinkUnderlined,
        },
      ],
    );
  }, [makeGoToConfigsLinkUnderlined, translateHTML]);

  return (
    <>
      <Grid item maxWidth='750px'>
        <Controller
          control={control}
          name='chosenConfig'
          rules={{
            validate: validateConfigKeyFormField,
          }}
          render={({ field, fieldState: { error } }) =>
            renderConfigSelect(field, {
              label: translate(
                translationKey(
                  'Label.ConfigKey',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              error: !!error,
              helperText: error ? (
                <>
                  {error?.message}. {createAConfigKeyHelperText}
                </>
              ) : (
                createAConfigKeyHelperText
              ),
              fullWidth: true,
            })
          }
        />
      </Grid>
      {variantsForm}
    </>
  );
};
export default ConfigsExperimentConfigurationStep;
