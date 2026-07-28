import type { FunctionComponent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import type { Validate } from 'react-hook-form';
import { Controller, useController, useFormContext, useWatch } from 'react-hook-form';
import { useFlag } from '@rbx/flags';
import { Button } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  Grid,
  TextField,
  FormControl,
  Select,
  MenuItem,
  Slider,
  FormLabel,
  Typography,
} from '@rbx/ui';
import { isExperimentTargetingEnabled as isExperimentTargetingEnabledFlag } from '@generated/flags/creatorAnalytics';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import {
  ExperimentMetric,
  ExperimentProductType,
  ExperimentState,
} from '../../api/universeExperimentationClientEnums';
import type { ValidExperiment } from '../../api/validExperimentationTypes';
import type { ValidConditionRule } from '../../api/validTypes';
import ConditionRuleEditor from '../../components/ConditionRuleEditor';
import type { TargetingClauseFormData } from '../../types/FormData';
import { createDefaultClause } from '../../utils/configFormDataTransforms';
import {
  getCompletedTargetingClauses,
  hasIncompleteTargetingClause,
} from '../../utils/experimentTargetingTransforms';
import type { SetupStepFormData } from '../types/FormData';
import ExperimentTypeTranslationKeys from '../utils/experimentTypeTranslationKeys';
import CreationStepperButtons from './CreationStepperButtons';
import ExperimentTargetingCopyModal from './ExperimentTargetingCopyModal';
import MDECardInForm from './MDECardInForm';

type ExperimentSetupStepProps = {
  onNext: () => void;
  onCancel: () => void;
  setExperimentType: (type: ExperimentProductType) => void;
  experiment?: ValidExperiment;
  allConditionRules: Map<string, ValidConditionRule>;
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
const experimentProductTypeByValue = new Map<string, ExperimentProductType>(
  ExperimentTypes.map((type) => [type, type]),
);

const ExperimentSetupStep: FunctionComponent<ExperimentSetupStepProps> = ({
  onNext,
  onCancel,
  setExperimentType,
  experiment,
  allConditionRules,
}) => {
  const { id: universeId } = useUniverseResource();
  const { ready: isExperimentTargetingFlagReady, value: isExperimentTargetingFlagValue } = useFlag(
    isExperimentTargetingEnabledFlag,
    { universeId },
  );
  const isExperimentTargetingEnabled =
    isExperimentTargetingFlagReady && (isExperimentTargetingFlagValue ?? false);
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());

  const validateTargetingClauses: Validate<TargetingClauseFormData[], SetupStepFormData> =
    useCallback(
      (clauses) => {
        if (!hasIncompleteTargetingClause(clauses ?? [])) {
          return true;
        }
        return tPendingTranslation(
          'Complete or remove incomplete targeting filters.',
          'Validation message when experiment targeting filter rows are partially filled.',
          translationKey(
            'Message.ExperimentCreation.IncompleteTargetingFilter',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      },
      [tPendingTranslation],
    );

  const { control, handleSubmit, setValue } = useFormContext<SetupStepFormData>();

  const experimentType = useWatch({ control, name: 'type' });

  const { field: targetingClausesField, fieldState: targetingClausesFieldState } = useController({
    control,
    name: 'targetingClauses',
    rules: {
      validate: validateTargetingClauses,
    },
  });

  const [isCopyTargetingModalOpen, setIsCopyTargetingModalOpen] = useState(false);
  const [hasAttemptedProceed, setHasAttemptedProceed] = useState(false);

  const isTargetingDisabled = !!(experiment && experiment.state !== ExperimentState.Draft);

  const targetingClauses = useMemo(
    () => targetingClausesField.value ?? [],
    [targetingClausesField.value],
  );
  const shouldConfirmCopyOverwrite =
    targetingClauses.length > 0 || targetingClausesFieldState.isDirty;
  const hasReachedTargetingClauseLimit = targetingClauses.length >= 5;
  const shouldShowIncompleteErrors =
    hasAttemptedProceed && hasIncompleteTargetingClause(targetingClauses);

  const handleUpdateClause = useCallback(
    (clauseId: string, updater: (c: TargetingClauseFormData) => TargetingClauseFormData) => {
      setHasAttemptedProceed(false);
      targetingClausesField.onChange(
        targetingClauses.map((c) => (c.id === clauseId ? updater(c) : c)),
      );
    },
    [targetingClauses, targetingClausesField],
  );

  const handleRemoveClause = useCallback(
    (clauseId: string) => {
      setHasAttemptedProceed(false);
      targetingClausesField.onChange(targetingClauses.filter((c) => c.id !== clauseId));
    },
    [targetingClauses, targetingClausesField],
  );

  const handleAddClause = useCallback(() => {
    setHasAttemptedProceed(false);
    targetingClausesField.onChange([...targetingClauses, createDefaultClause()]);
  }, [targetingClauses, targetingClausesField]);

  const handleCopyTargetingClauses = useCallback(
    (clauses: TargetingClauseFormData[]) => {
      setHasAttemptedProceed(false);
      targetingClausesField.onChange(clauses);
    },
    [targetingClausesField],
  );

  const onSubmit = useMemo(
    () =>
      handleSubmit(
        (data) => {
          const nextTargetingClauses = getCompletedTargetingClauses(data.targetingClauses);
          if (nextTargetingClauses.length !== data.targetingClauses.length) {
            setValue('targetingClauses', nextTargetingClauses, { shouldDirty: true });
          }
          onNext();
        },
        () => setHasAttemptedProceed(true),
      ),
    [handleSubmit, onNext, setValue],
  );

  // Experiment type validator
  const validateExperimentType: Validate<ExperimentProductType, SetupStepFormData> = useCallback(
    (value) => {
      if (value) {
        return true;
      }
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
      if (value) {
        return true;
      }
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
                  const nextExperimentType = experimentProductTypeByValue.get(e.target.value);
                  field.onChange(e);
                  if (nextExperimentType) {
                    setExperimentType(nextExperimentType);
                    if (nextExperimentType === ExperimentProductType.Matchmaking) {
                      setValue('targetingClauses', [], { shouldDirty: true });
                    }
                  }
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
                {ExperimentTypes.map((type) => (
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
      {/* Targeting */}
      {isExperimentTargetingEnabled && experimentType === ExperimentProductType.Configs && (
        <Grid container item direction='column' spacing={0.5}>
          <Grid item>
            <Typography variant='h3'>
              {tPendingTranslation(
                'Targeting',
                'Label for targeting in the experiment creation and review flow.',
                translationKey(
                  'Label.Targeting',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2' className='content-muted'>
              {tPendingTranslation(
                'Further specify who will be enrolled in the experiment. This is optional.',
                'Informational subheading below the Targeting section.',
                translationKey(
                  'Message.ExperimentCreation.TargetingDescription',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Typography>
          </Grid>
          {targetingClauses.length > 0 && (
            <Grid item className='margin-top-small'>
              <ConditionRuleEditor
                clauses={targetingClauses}
                onUpdateClause={handleUpdateClause}
                onRemoveClause={handleRemoveClause}
                onAddClause={handleAddClause}
                isDisabled={isTargetingDisabled}
                allowRemovingLastClause
                hideAddButton
                shouldShowIncompleteErrors={shouldShowIncompleteErrors}
                headingLabel={tPendingTranslation(
                  'Filter type',
                  'Label above experiment targeting filter rows.',
                  translationKey(
                    'Label.ExperimentCreation.FilterType',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                )}
              />
            </Grid>
          )}
          {!isTargetingDisabled && (
            <Grid item className='margin-top-small'>
              <div className='flex gap-small'>
                <Button
                  type='button'
                  variant='Standard'
                  size='Small'
                  isDisabled={hasReachedTargetingClauseLimit}
                  onClick={handleAddClause}>
                  {tPendingTranslation(
                    '+ Filter',
                    'Button label to add an experiment targeting filter.',
                    translationKey(
                      'Action.ExperimentCreation.AddTargetingFilter',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                </Button>
                <Button
                  type='button'
                  variant='Standard'
                  size='Small'
                  isDisabled={allConditionRules.size === 0}
                  onClick={() => setIsCopyTargetingModalOpen(true)}>
                  {tPendingTranslation(
                    'Copy from Configs',
                    'Button label to copy targeting filters from an existing configs condition.',
                    translationKey(
                      'Action.ExperimentCreation.CopyTargetingFromConfigs',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                </Button>
              </div>
            </Grid>
          )}
          <ExperimentTargetingCopyModal
            open={isCopyTargetingModalOpen}
            conditionRules={allConditionRules}
            shouldConfirmOverwrite={shouldConfirmCopyOverwrite}
            onClose={() => setIsCopyTargetingModalOpen(false)}
            onCopy={handleCopyTargetingClauses}
          />
        </Grid>
      )}
      {/* Filters (P1) */}
      {/* TODO(DSA-4646): Add filters */}
      <CreationStepperButtons onCancel={onCancel} cancelButtonVariant='contained' />
    </Grid>
  );
};

export default ExperimentSetupStep;
