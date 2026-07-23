import type { FunctionComponent } from 'react';
import { useCallback, useMemo } from 'react';
import type { Validate } from 'react-hook-form';
import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import {
  Alert,
  Grid,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableRow,
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
  ExperimentOperationStatus,
  ExperimentProductType,
  ExperimentState,
} from '../../api/universeExperimentationClientEnums';
import type { ValidExperiment } from '../../api/validExperimentationTypes';
import RpnTokenChips from '../../components/RpnTokenChips';
import { isExperimentReschedulatbleOnly } from '../../utils/experimentProperties';
import { targetingClausesToRpnRuleTokens } from '../../utils/experimentTargetingTransforms';
import VariantsTableForInExperience from '../configs/VariantsTable';
import useBaselinePublishedConfigEntry from '../hooks/useBaselinePublishedConfigEntry';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';
import VariantsTableForMatchmaking from '../matchmaking-experiments/MatchmakingVariantsTable';
import type { ExperimentFormData } from '../types/FormData';
import { defaultGoalMetrics } from '../utils/getDefaultFormData';
import CreationStepperButtons from './CreationStepperButtons';
import SchedulingTimeSelector from './SchedulingTimeSelector';

interface ExperimentSchedulingStepProps {
  onPrev: () => void;
  onCancel: () => void;
  onComplete: () => void;
  experiment: ValidExperiment;
}

const useStyles = makeStyles()((theme) => ({
  table: {
    width: 'unset',
    tableLayout: 'auto',
  },
  tableCell: {
    borderBottom: 'none',
    textAlign: 'left',
    padding: '6px',
    ...theme.typography.body2,
  },
  tableCellLabel: {
    ...theme.typography.subtitle2,
  },
}));

const ExperimentSchedulingStep: FunctionComponent<ExperimentSchedulingStepProps> = ({
  onPrev,
  onComplete,
  onCancel,
  experiment,
}) => {
  const {
    classes: { table, tableCell, tableCellLabel },
    cx,
  } = useStyles();
  const { id: universeId } = useUniverseResource();
  const { ready: isExperimentTargetingFlagReady, value: isExperimentTargetingFlagValue } = useFlag(
    isExperimentTargetingEnabledFlag,
    { universeId },
  );
  const isExperimentTargetingEnabled =
    isExperimentTargetingFlagReady && (isExperimentTargetingFlagValue ?? false);
  const { startOrScheduleExperiment, getExperimentOperationStatus } =
    useExperimentActionsWithOperationStatusObserver();
  const { translate, tPendingTranslation } = useTranslationWrapper(useTranslation());
  const { control, handleSubmit } = useFormContext<ExperimentFormData>();

  const [
    experimentName,
    chosenConfig,
    goalMetric,
    scheduledAt,
    exposurePercent,
    durationDays,
    matchmakingVariants,
    targetingClauses,
  ] = useWatch({
    control,
    name: [
      'name',
      'chosenConfig',
      'goalMetric',
      'scheduledAt',
      'exposurePercent',
      'durationDays',
      'matchmakingVariants',
      'targetingClauses',
    ],
  });
  const goalRAQIV2Metrics = useMemo(() => {
    const uniqueGoalMetrics = new Set(
      goalMetric ? [...defaultGoalMetrics, goalMetric] : defaultGoalMetrics,
    );
    return (
      Array.from(uniqueGoalMetrics)
        .map((metric) => ExperimentMetricToRAQIV2Metric[metric])
        // always show selected goal metric first
        .sort((metric) =>
          goalMetric && metric === ExperimentMetricToRAQIV2Metric[goalMetric] ? -1 : 0,
        )
    );
  }, [goalMetric]);
  const targetingTokens = useMemo(
    () => targetingClausesToRpnRuleTokens(targetingClauses ?? []),
    [targetingClauses],
  );
  const configExperimentVariants =
    experiment.experimentType === ExperimentProductType.Configs ? experiment.variants : undefined;
  const {
    baselinePublishedEntry,
    ruleOrdering,
    isLoading: isBaselineConfigLoading,
  } = useBaselinePublishedConfigEntry({
    variants: configExperimentVariants,
  });

  // Scheduled at validator (now allows null for "start now")
  const validateScheduledAt: Validate<Date | null, ExperimentFormData> = useCallback(
    (value) => {
      // Allow null values (for "start now" option)
      if (value === null) {
        return true;
      }
      // If value is provided, it must be a valid date
      if (Number.isNaN(value.getTime())) {
        return translate(
          translationKey(
            'Message.ExperimentCreation.InvalidDatetimeValue',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );
      }

      return true;
    },
    [translate],
  );

  const variantsTable = useMemo(() => {
    switch (experiment.experimentType) {
      case ExperimentProductType.Configs:
        return (
          <VariantsTableForInExperience
            variants={experiment.variants}
            baselinePublishedEntry={baselinePublishedEntry}
            conditionOrder={ruleOrdering?.conditionOrder}
            isDataLoading={isBaselineConfigLoading}
          />
        );
      case ExperimentProductType.Matchmaking:
        return <VariantsTableForMatchmaking matchmakingVariants={matchmakingVariants} />;
      default:
        throw new Error(`Unhandled experiment type: ${String(experiment)}`);
    }
  }, [
    baselinePublishedEntry,
    experiment,
    isBaselineConfigLoading,
    matchmakingVariants,
    ruleOrdering?.conditionOrder,
  ]);

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        startOrScheduleExperiment(
          {
            experimentId: experiment.id,
            scheduledAt: data.scheduledAt ? data.scheduledAt.toISOString() : null,
          },
          { onSuccess: onComplete },
        );
      }),
    [experiment.id, handleSubmit, onComplete, startOrScheduleExperiment],
  );

  const experimentStatus = useMemo(() => {
    return getExperimentOperationStatus(experiment.id);
  }, [experiment.id, getExperimentOperationStatus]);

  const isStartingOrSchedulingExperiment =
    experimentStatus === ExperimentOperationStatus.Starting ||
    experimentStatus === ExperimentOperationStatus.Scheduling;

  return (
    <Grid
      container
      flexDirection='column'
      spacing={4}
      width='100%'
      component='form'
      onSubmit={onSubmit}>
      <Grid item>
        <Typography variant='h6'>
          {translate(
            translationKey(
              'Heading.ReviewAndSchedule',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Typography>
      </Grid>

      <Grid item>
        <Controller
          name='scheduledAt'
          control={control}
          rules={{
            validate: validateScheduledAt,
          }}
          render={({ field: { onChange, onBlur, value, ref, name }, fieldState: { error } }) => (
            <SchedulingTimeSelector
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              error={!!error}
              helperText={error?.message}
              ref={ref}
              name={name}
              minDate={
                experiment.state === ExperimentState.Scheduled
                  ? experiment.scheduledTime
                  : undefined
              }
            />
          )}
        />
      </Grid>

      {scheduledAt && (
        <Grid item>
          <Alert severity='warning' variant='outlined'>
            <Typography variant='body1'>
              {translate(
                translationKey(
                  'Message.ExperimentCreation.VariantsConfigCannotBeChangedAfterScheduling',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              )}
            </Typography>
          </Alert>
        </Grid>
      )}
      <Grid container item direction='column' gap={2}>
        <Typography variant='h5' color='primary' marginTop={1}>
          {translate(
            translationKey(
              'Heading.ReviewExperimentDetails',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          )}
        </Typography>
        <Grid item>
          <Table classes={{ root: table }}>
            <TableBody>
              <TableRow>
                <TableCell classes={{ root: cx(tableCell, tableCellLabel) }}>
                  {translate(
                    translationKey(
                      'Label.ExperimentCreation.ExperimentName',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                </TableCell>
                <TableCell classes={{ root: tableCell }}>{experimentName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell classes={{ root: cx(tableCell, tableCellLabel) }}>
                  {translate(
                    translationKey(
                      'Label.ExperimentCreation.PercentRollout',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                </TableCell>
                <TableCell classes={{ root: tableCell }}>{exposurePercent}%</TableCell>
              </TableRow>
              {isExperimentTargetingEnabled &&
                experiment.experimentType === ExperimentProductType.Configs &&
                targetingTokens.length > 0 && (
                  <TableRow>
                    <TableCell classes={{ root: cx(tableCell, tableCellLabel) }}>
                      {tPendingTranslation(
                        'Targeting',
                        'Label for targeting in the experiment creation and review flow.',
                        translationKey(
                          'Label.Targeting',
                          TranslationNamespace.UniverseConfigAndExperimentation,
                        ),
                      )}
                    </TableCell>
                    <TableCell classes={{ root: tableCell }}>
                      <RpnTokenChips tokens={targetingTokens} />
                    </TableCell>
                  </TableRow>
                )}
              <TableRow>
                <TableCell classes={{ root: cx(tableCell, tableCellLabel) }}>
                  {translate(
                    translationKey(
                      'Label.ExperimentCreation.DurationDays',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                </TableCell>
                <TableCell classes={{ root: tableCell }}>{durationDays}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell classes={{ root: cx(tableCell, tableCellLabel) }}>
                  {translate(
                    translationKey(
                      'Label.ExperimentCreation.GoalMetrics',
                      TranslationNamespace.UniverseConfigAndExperimentation,
                    ),
                  )}
                </TableCell>
                <TableCell classes={{ root: tableCell }}>
                  {goalRAQIV2Metrics
                    .map((metric) =>
                      translate(getAnalyticsMetricDisplayConfig(metric).localizedName),
                    )
                    .join(', ')}
                </TableCell>
              </TableRow>
              {experiment.experimentType === ExperimentProductType.Configs && (
                <TableRow>
                  <TableCell classes={{ root: cx(tableCell, tableCellLabel) }}>
                    {translate(
                      translationKey(
                        'Label.ConfigKey',
                        TranslationNamespace.UniverseConfigAndExperimentation,
                      ),
                    )}
                  </TableCell>
                  <TableCell classes={{ root: tableCell }}>{chosenConfig?.key ?? ''}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Grid>
        <Grid item>{variantsTable}</Grid>
      </Grid>

      <CreationStepperButtons
        onCancel={onCancel}
        onPrev={isExperimentReschedulatbleOnly(experiment.state) ? undefined : onPrev}
        isSubmitButtonLoading={isStartingOrSchedulingExperiment}
        isCancelButtonDisabled={isStartingOrSchedulingExperiment}
        isPrevButtonDisabled={isStartingOrSchedulingExperiment}
        submitButtonLabelTranslationKey={
          scheduledAt
            ? translationKey(
                'Action.ExperimentCreation.ScheduleExperiment',
                TranslationNamespace.UniverseConfigAndExperimentation,
              )
            : translationKey(
                'Action.ExperimentCreation.StartExperiment',
                TranslationNamespace.UniverseConfigAndExperimentation,
              )
        }
        message={translate(
          translationKey(
            'Message.ExperimentCreation.SavedAsDraft',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        )}
      />
    </Grid>
  );
};

export default ExperimentSchedulingStep;
