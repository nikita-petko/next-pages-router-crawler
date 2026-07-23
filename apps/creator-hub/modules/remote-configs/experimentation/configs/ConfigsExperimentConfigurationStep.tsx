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
import React, { Fragment, useCallback, useEffect, useMemo } from 'react';
import { Controller, useFieldArray, useFormContext, useWatch, Validate } from 'react-hook-form';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Link } from '@modules/miscellaneous/common';
import {
  analyticsConfigsNavigationItem,
  buildExperienceAnalyticsUrlWithParams,
} from '@modules/charts-generic';
import { useUniverseResource } from '@modules/experience-analytics-shared';
import useConfigBooleanValidator from '../../hooks/useConfigBooleanValidator';
import useConfigStringValidator from '../../hooks/useConfigStringValidator';
import useConfigJsonValidator from '../../hooks/useConfigJsonValidator';
import useConfigNumberValidator from '../../hooks/useConfigNumberValidator';
import { ValidationError, type ValidationResult } from '../../hooks/validatorTypes';
import useConfigKeyInfiniteSelect from './ConfigKeyInfiniteSelect';
import { ValidConfigEntryValueType } from '../../api/universeConfigsClientEnums';
import { ConfigurationStepFormDataInExperience } from '../types/FormData';
import JSONEditorDialog from './JSONEditorDialog';
import useLatestTargetingConfigEntryValueForExperiment from '../hooks/useLatestConfigEntryValueForExperiment';

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
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const { renderConfigSelect } = useConfigKeyInfiniteSelect();

  // Config key validator
  const validateConfigKeyFormField: Validate<
    ConfigurationStepFormDataInExperience['chosenConfig'],
    ConfigurationStepFormDataInExperience
  > = useCallback(
    (value) => {
      if (value) return true;
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

  // Variant weight validator
  const validateVariantWeight: Validate<number, ConfigurationStepFormDataInExperience> =
    useCallback(
      (value, formValues) => {
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
        const totalWeight = formValues.variants.reduce((acc, variant) => acc + variant.weight, 0);
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
      [translate],
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
            throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
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
        trigger(`variants.${index}.value`);
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
  const chosenConfigValue = useLatestTargetingConfigEntryValueForExperiment({
    chosenConfigKey: chosenConfig?.key,
  });
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

  // If the baseline variant value is not the same as the latest config entry value,
  // update the baseline variant value to the chosen config entry value
  useEffect(() => {
    if (chosenConfigValue != null && baselineVariant.value !== chosenConfigValue) {
      update(baselineVariantIndex, {
        label: baselineVariant.label,
        weight: baselineVariant.weight,
        isBaseline: true,
        value: chosenConfigValue,
      });
    }
  }, [baselineVariant, baselineVariantIndex, chosenConfigValue, update]);

  const variantsForm = useMemo(() => {
    if (!chosenConfig) {
      return null;
    }

    const { valueType } = chosenConfig;
    return (
      <React.Fragment>
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
                    validate: validateVariantWeight,
                  }}
                  render={({ field, fieldState: { error } }) => (
                    <TextField
                      {...field}
                      disabled={variantFields.isBaseline}
                      data-testid={`variant-weight-${index}`}
                      onChange={(e) => {
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
                        trigger(`variants.${index}.weight`);
                        trigger(`variants.${baselineVariantIndex}.weight`);
                      }}
                      label={translate(
                        translationKey(
                          'Label.VariantWeight',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      )}
                      id={`variant-weight-${index}`}
                      InputProps={{
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
                    validate: makeVariantValueValidator(valueType),
                  }}
                  render={({ field, fieldState: { error } }) => {
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
                    switch (valueType) {
                      case ValidConfigEntryValueType.Boolean: {
                        return (
                          <Select
                            {...field}
                            {...commonProps}
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
                            fullWidth
                            disabled={variantFields.isBaseline}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position='end'>
                                  <IconButton
                                    aria-label='edit'
                                    onClick={() => {
                                      onClickEditJson(field.value, index);
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
                        throw new Error(`Unhandled value type: ${exhaustiveCheck}`);
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
      </React.Fragment>
    );
  }, [
    chosenConfig,
    translate,
    variantsFields,
    addVariant,
    variantContainer,
    control,
    validateVariantName,
    validateVariantWeight,
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
    <Fragment>
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
                <React.Fragment>
                  {error?.message}. {createAConfigKeyHelperText}
                </React.Fragment>
              ) : (
                createAConfigKeyHelperText
              ),
              fullWidth: true,
            })
          }
        />
      </Grid>
      {variantsForm}
    </Fragment>
  );
};
export default ConfigsExperimentConfigurationStep;
