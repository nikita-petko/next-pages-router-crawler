import React, { useMemo } from 'react';
import { Alert, AlertTitle, Grid, makeStyles, TAlertProps, Typography } from '@rbx/ui';
import {
  FormattedText,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate } from '@modules/miscellaneous/common/utils';
import { useLocale } from '@modules/charts-generic';
import { useTranslation } from '@rbx/intl';
import { addDays } from '@rbx/core';
import {
  isExperimentRunningAndDurationMet,
  isExperimentStatsSig,
} from '../../utils/experimentProperties';
import { ExperimentState } from '../../api/universeExperimentationClientEnums';
import { ValidExperiment } from '../../api/validExperimentationTypes';
import { PValueByExperimentMetricAndVariant } from '../hooks/usePValueForExperimentMetrics';

type ExperimentSignificanceNotificationAreaProps = {
  experiment: ValidExperiment;
  action?: React.ReactNode;
  pValueByExperimentMetricAndVariant: PValueByExperimentMetricAndVariant;
};

const useStyles = makeStyles()(() => ({
  alert: {
    width: '100%',
  },
}));

const ExperimentSignificanceNotificationArea = ({
  experiment,
  action,
  pValueByExperimentMetricAndVariant,
}: ExperimentSignificanceNotificationAreaProps) => {
  const {
    classes: { alert },
  } = useStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  const locale = useLocale();

  const titleAndDescription: {
    title: FormattedText;
    description: FormattedText;
    severity: TAlertProps['severity'];
  } | null = useMemo(() => {
    switch (experiment.state) {
      case ExperimentState.Scheduled:
        return {
          title: translate(
            translationKey(
              'Title.ExperimentSignificanceNotificationArea.Scheduled',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            {
              time: formatDate(experiment.scheduledTime, locale),
            },
          ),
          description: translate(
            translationKey(
              'Description.ExperimentSignificanceNotificationArea.Scheduled',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          severity: 'info',
        };
      case ExperimentState.Completed:
        return {
          title: translate(
            translationKey(
              'Title.ExperimentSignificanceNotificationArea.Completed',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            {
              time: formatDate(experiment.stoppedTime, locale),
            },
          ),
          description: translate(
            translationKey(
              'Description.ExperimentSignificanceNotificationArea.Completed',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          severity: 'info',
        };
      case ExperimentState.Cancelled:
        return {
          title: translate(
            translationKey(
              'Title.ExperimentSignificanceNotificationArea.Cancelled',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            {
              time: formatDate(experiment.stoppedTime, locale),
            },
          ),
          description: translate(
            translationKey(
              'Description.ExperimentSignificanceNotificationArea.Cancelled',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          severity: 'info',
        };
      case ExperimentState.Running: {
        const isDurationMet = isExperimentRunningAndDurationMet(experiment);
        const isSignificanceFound = isExperimentStatsSig({
          experiment,
          pValueByExperimentMetricAndVariant,
        });

        if (!isDurationMet) {
          return isSignificanceFound
            ? {
                title: translate(
                  translationKey(
                    'Title.ExperimentSignificanceNotificationArea.NotMetStatsSig',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                ),
                description: translate(
                  translationKey(
                    'Description.ExperimentSignificanceNotificationArea.NotMetSig',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                  {
                    date: formatDate(
                      addDays(experiment.startedTime, experiment.durationDays),
                      locale,
                    ),
                  },
                ),
                severity: 'info',
              }
            : {
                title: translate(
                  translationKey(
                    'Title.ExperimentSignificanceNotificationArea.NotMetNoStats',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                ),
                description: translate(
                  translationKey(
                    'Description.ExperimentSigNotificationArea.NotMetNoStats',
                    TranslationNamespace.UniverseConfigAndExperimentation,
                  ),
                  {
                    date: formatDate(
                      addDays(experiment.startedTime, experiment.durationDays),
                      locale,
                    ),
                  },
                ),
                severity: 'info',
              };
        }

        return isSignificanceFound
          ? {
              title: translate(
                translationKey(
                  'Title.ExperimentSignificanceNotificationArea.Significant',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              description: translate(
                translationKey(
                  'Description.ExperimentSignificanceNotificationArea.Significant',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              severity: 'success',
            }
          : {
              title: translate(
                translationKey(
                  'Title.ExperimentSignificanceNotificationArea.DurationMetNoStats',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              description: translate(
                translationKey(
                  'Description.ExperimentSignificanceNotificationArea.DurationMetNoStats',
                  TranslationNamespace.UniverseConfigAndExperimentation,
                ),
              ),
              severity: 'warning',
            };
      }
      case ExperimentState.Draft:
      case ExperimentState.Deleted:
        return null;
      default: {
        const exhaustiveCheck: never = experiment;
        throw new Error(`Unhandled experiment state: ${exhaustiveCheck}`);
      }
    }
  }, [experiment, locale, pValueByExperimentMetricAndVariant, translate]);

  if (!titleAndDescription) {
    return null;
  }

  const { title, description, severity } = titleAndDescription;

  return (
    <Grid container item XSmall={12}>
      <Alert variant='outlined' severity={severity} classes={{ root: alert }} action={action}>
        <AlertTitle>{title}</AlertTitle>
        <Typography component='div' marginTop='6px' variant='smallLabel1'>
          {description}
        </Typography>
      </Alert>
    </Grid>
  );
};

export default ExperimentSignificanceNotificationArea;
