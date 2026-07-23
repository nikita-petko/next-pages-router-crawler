import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { Grid, TextField, FormControl, Select, MenuItem, Slider, FormLabel } from '@rbx/ui';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Controller, useFormContext, useWatch, Validate } from 'react-hook-form';
import { getAnalyticsMetricDisplayConfig } from '@modules/experience-analytics-shared';
import { useTranslation } from '@rbx/intl';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { ValidExperiment } from '../../api/validExperimentationTypes';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import {
  ExperimentMetric,
  ExperimentProductType,
  ExperimentState,
} from '../../api/universeExperimentationClientEnums';
import CreationStepperButtons from './CreationStepperButtons';
import { SetupStepFormData } from '../types/FormData';
import ExperimentTypeTranslationKeys from '../utils/experimentTypeTranslationKeys';
import MDECardInForm from './MDECardInForm';

type ExperimentSetupStepProps = {
  onNext: () => void;
  onCancel: () => void;
  setExperimentType: (type: ExperimentProductType) => void;
  experiment?: ValidExperiment;
};
const orderedSelectableGoalMetrics = [
  ExperimentMetric.Day1Retention,
  ExperimentMetric.Day7Retention,
  ExperimentMetric.PlaytimePerUser,
  ExperimentMetric.AverageRevenuePerUser,
  ExperimentMetric.AverageRevenuePerPayingUser,
  ExperimentMetric.PayerConversionRate,
  ExperimentMetric.AverageSessionTime,
] as const;

const ExperimentTypes = [ExperimentProductType.Configs, ExperimentProductType.Matchmaking] as const;

const ExperimentSetupStep: FunctionComponent<ExperimentSetupStepProps> = ({
  onNext,
  onCancel,
  setExperimentType,
  experiment,
}) => {
  const { isMatchmakingCustomizationAllowed: isCustomMatchmakingExperimentsEnabled } =
    useFeatureFlagsForNamespace(
      'isMatchmakingCustomizationAllowed',
      FeatureFlagNamespace.Matchmaking,
    );
  const { translate } = useTranslationWrapper(useTranslation());

  const { control, handleSubmit } = useFormContext<SetupStepFormData>();

  const experimentType = useWatch({ control, name: 'type' });

  const onSubmit = useMemo(() => handleSubmit(() => onNext()), [handleSubmit, onNext]);

  // Experiment type validator
  const validateExperimentType: Validate<ExperimentProductType, SetupStepFormData> = useCallback(
    (value) => {
      if (value) return true;
      return translate(
        translationKey(
          'Message.ExperimentCreation.ExperimentTypeRequired',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    },
    [translate],
  );

  // Experiment name field validator
  const validateExperimentName: Validate<string, SetupStepFormData> = useCallback(
    (value) => {
      const trimmedValue = value.trim();
      if (trimmedValue.length === 0) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.ExperimentNameRequired',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
      if (trimmedValue.length > 100) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.ExperimentNameTooLong',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
      if (!/^[a-zA-Z][a-zA-Z0-9._]*$/.test(trimmedValue)) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.ExperimentNameMustStartWithLetter',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
      return true;
    },
    [translate],
  );

  // Duration days validator
  const validateDurationDays: Validate<number, SetupStepFormData> = useCallback(
    (value) => {
      if (!value) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.DurationDaysRequired',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
      if (value < 14) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.DurationDaysTooLow',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
      if (value > 60) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.DurationDaysTooHigh',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }
      return true;
    },
    [translate],
  );

  // Goal metric selector validator
  const validateGoalMetric: Validate<ExperimentMetric | null, SetupStepFormData> = useCallback(
    (value) => {
      if (value) return true;
      return translate(
        translationKey(
          'Message.ExperimentCreation.GoalMetricRequired',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
    },
    [translate],
  );

  return (
    <Grid
      container
      width='100%'
      maxWidth={900}
      direction='column'
      gap='24px'
      padding='8px'
      component='form'
      onSubmit={onSubmit}>
      {/* Experiment type selector */}
      <Grid item>
        <Controller
          name='type'
          control={control}
          rules={{
            validate: validateExperimentType,
          }}
          render={({ field }) => (
            <FormControl fullWidth>
              <Select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  setExperimentType(e.target.value as ExperimentProductType);
                }}
                disabled={!!experiment}
                data-testid='experiment-type-label'
                label={translate(
                  translationKey(
                    'Label.ExperimentCreation.ExperimentType',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                placeholder={translate(
                  translationKey(
                    'Placeholder.ExperimentCreation.ExperimentType',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}>
                {ExperimentTypes.filter((type) => {
                  switch (type) {
                    case ExperimentProductType.Configs:
                      return true;
                    case ExperimentProductType.Matchmaking:
                      return isCustomMatchmakingExperimentsEnabled;
                    default: {
                      const exhaustiveCheck: never = type;
                      throw new Error(`Unhandled experiment type: ${exhaustiveCheck}`);
                    }
                  }
                }).map((type) => (
                  <MenuItem key={type} value={type}>
                    {translate(ExperimentTypeTranslationKeys[type])}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      {/* Experiment name */}
      <Grid item>
        <Controller
          name='name'
          control={control}
          rules={{
            validate: validateExperimentName,
          }}
          render={({ field, fieldState: { error } }) => (
            <TextField
              {...field}
              disabled={experiment && experiment.state !== ExperimentState.Draft}
              id='experiment-name-label'
              data-testid='experiment-name-label'
              fullWidth
              label={translate(
                translationKey(
                  'Label.ExperimentCreation.ExperimentName',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
              placeholder={translate(
                translationKey(
                  'Placeholder.ExperimentCreation.ExperimentName',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
              error={!!error}
              helperText={translate(
                translationKey(
                  'Message.ExperimentCreation.ExperimentNameHelperText',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            />
          )}
        />
      </Grid>
      {/* Goal metric selector */}
      <Grid item>
        <Controller
          name='goalMetric'
          control={control}
          rules={{
            validate: validateGoalMetric,
          }}
          render={({ field, fieldState: { error } }) => (
            <FormControl fullWidth>
              <Select
                {...field}
                data-testid='goal-metric-label'
                label={translate(
                  translationKey(
                    'Label.ExperimentCreation.GoalMetric',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                placeholder={translate(
                  translationKey(
                    'Placeholder.ExperimentCreation.GoalMetric',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                helperText={
                  error?.message ??
                  translate(
                    translationKey(
                      'Message.ExperimentCreation.GoalMetricHelperText',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )
                }
                error={!!error}>
                {orderedSelectableGoalMetrics.map((metric) => (
                  <MenuItem key={metric} value={metric}>
                    {translate(
                      getAnalyticsMetricDisplayConfig(ExperimentMetricToRAQIV2Metric[metric])
                        .localizedName,
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
      </Grid>
      {/** Planned duration selector */}
      <Grid item>
        <Controller
          name='durationDays'
          control={control}
          rules={{
            validate: validateDurationDays,
          }}
          render={({ field, fieldState: { error } }) => {
            // Different helper text based on experiment type
            let helperTextKey: string;
            switch (experimentType) {
              case ExperimentProductType.Configs:
                helperTextKey = 'Message.ExperimentCreation.DurationDaysHelperText';
                break;
              case ExperimentProductType.Matchmaking:
                helperTextKey = 'Message.ExperimentCreation.DurationDaysHelperTextMatchmaking';
                break;
              default:
                helperTextKey = 'Message.ExperimentCreation.DurationDaysHelperText';
            }
            const helperTextFallback = translate(
              translationKey(helperTextKey, TranslationNamespace.UniverseConfigAndExperimentation),
            );
            return (
              <TextField
                {...field}
                data-testid='duration-days-input'
                onChange={(e) => {
                  const { value } = e.target;
                  const intValue = parseInt(value, 10);
                  if (!Number.isNaN(intValue)) {
                    field.onChange(intValue);
                  } else {
                    field.onChange(0);
                  }
                }}
                variant='outlined'
                fullWidth
                id='Duration'
                label={translate(
                  translationKey(
                    'Label.ExperimentCreation.DurationDays',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
                aria-label='Duration'
                error={!!error}
                helperText={error?.message ?? helperTextFallback}
              />
            );
          }}
        />
      </Grid>
      {/* Exposure percent slider */}
      <Grid item>
        <Controller
          name='exposurePercent'
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <FormLabel>
                {translate(
                  translationKey(
                    'Label.ExperimentCreation.PercentRollout',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              </FormLabel>
              <Slider
                {...field}
                aria-label='percent-rollout-slider'
                data-testid='percent-rollout-slider'
                min={1}
                max={100}
                step={1}
                valueLabelDisplay='on'
                valueLabelFormat={(value) => `${value}%`}
                color='secondary'
                marks={[
                  { value: 1, label: '1%' },
                  { value: 100, label: '100%' },
                ]}
              />
            </FormControl>
          )}
        />
        <MDECardInForm />
      </Grid>
      {/* Filters (P1) */}
      {/* TODO(DSA-4646): Add filters */}
      <CreationStepperButtons onCancel={onCancel} cancelButtonVariant='contained' />
    </Grid>
  );
};

export default ExperimentSetupStep;
