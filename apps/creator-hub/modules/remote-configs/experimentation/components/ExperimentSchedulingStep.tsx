import React, { FunctionComponent, useCallback, useMemo } from 'react';
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
import { Controller, useFormContext, Validate, useWatch } from 'react-hook-form';
import { getAnalyticsMetricDisplayConfig } from '@modules/experience-analytics-shared';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isExperimentReschedulatbleOnly } from '../../utils/experimentProperties';
import {
  ExperimentOperationStatus,
  ExperimentProductType,
  ExperimentState,
} from '../../api/universeExperimentationClientEnums';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import { ValidExperiment } from '../../api/validExperimentationTypes';
import CreationStepperButtons from './CreationStepperButtons';
import { ExperimentFormData } from '../types/FormData';
import { defaultGoalMetrics } from '../utils/getDefaultFormData';
import SchedulingTimeSelector from './SchedulingTimeSelector';
import VariantsTableForMatchmaking from '../matchmaking-experiments/MatchmakingVariantsTable';
import useExperimentActionsWithOperationStatusObserver from '../hooks/useExperimentActionWithOperationStatusObserver';
import VariantsTableForInExperience from '../configs/VariantsTable';

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
  const { startOrScheduleExperiment, getExperimentOperationStatus } =
    useExperimentActionsWithOperationStatusObserver();
  const { translate } = useTranslationWrapper(useTranslation());
  const { control, handleSubmit } = useFormContext<ExperimentFormData>();

  const [
    experimentName,
    chosenConfig,
    goalMetric,
    scheduledAt,
    exposurePercent,
    durationDays,
    matchmakingVariants,
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
        return <VariantsTableForInExperience variants={experiment.variants} />;
      case ExperimentProductType.Matchmaking:
        return <VariantsTableForMatchmaking matchmakingVariants={matchmakingVariants} />;
      default: {
        const exhaustiveCheck: never = experiment;
        throw new Error(`Unhandled experiment type: ${exhaustiveCheck}`);
      }
    }
  }, [experiment, matchmakingVariants]);

  const onSubmit = useMemo(
    () =>
      handleSubmit((data) => {
        startOrScheduleExperiment(
          {
            experimentId: experiment.id,
            scheduledAt: data.scheduledAt ? data.scheduledAt.toISOString() : null,
          },
          {
            onSuccess: onComplete,
          },
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
