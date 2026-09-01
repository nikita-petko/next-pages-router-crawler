import React, { useMemo } from 'react';
import { addDays } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import type { TAlertProps } from '@rbx/ui';
import { Alert, AlertTitle, Grid, makeStyles, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useLocale from '@modules/charts-generic/context/useLocale';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { ExperimentState } from '../../api/universeExperimentationClientEnums';
import type {
  ValidExperimentVariantsResults,
  ValidExperiment,
} from '../../api/validExperimentationTypes';
import {
  isExperimentRunningAndDurationMet,
  isExperimentStatsSig,
} from '../../utils/experimentProperties';

type ExperimentSignificanceNotificationAreaProps = {
  experiment: ValidExperiment;
  action?: React.ReactNode;
  experimentVariantsResults?: ValidExperimentVariantsResults;
};

const useStyles = makeStyles()(() => ({
  alert: {
    width: '100%',
  },
}));

const ExperimentSignificanceNotificationArea = ({
  experiment,
  action,
  experimentVariantsResults,
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
          experimentVariantsResults,
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
        throw new Error(`Unhandled experiment state: ${String(exhaustiveCheck)}`);
      }
    }
  }, [experiment, experimentVariantsResults, locale, translate]);

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
