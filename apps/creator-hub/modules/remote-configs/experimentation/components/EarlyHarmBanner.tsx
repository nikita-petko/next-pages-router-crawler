import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { useTranslation } from '@rbx/intl';
import type { TAlertProps } from '@rbx/ui';
import { Grid, Alert, AlertTitle, Typography } from '@rbx/ui';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatNumberWithSpec } from '@modules/charts-generic/charts/numberFormatters';
import useLocale from '@modules/charts-generic/context/useLocale';
import getAnalyticsMetricDisplayConfig from '@modules/experience-analytics-shared/constants/AnalyticsMetricDisplayConfig';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import type {
  ValidExperimentVariantsResults,
  ValidExperiment,
} from '../../api/validExperimentationTypes';
import { getExperimentHarmSummary } from '../../utils/experimentProperties';
import {
  DEFAULT_EARLY_HARM_DURATION_HRS,
  DEFAULT_EARLY_HARM_UPDATE_FREQUENCY_MINS,
} from '../constants/earlyHarmAnalysisDefaults';

type EarlyHarmBannerProps = {
  experiment?: ValidExperiment;
  experimentVariantsResults?: ValidExperimentVariantsResults;
  isHarmDetected?: boolean;
};

const EarlyHarmBanner = ({
  experiment,
  experimentVariantsResults,
  isHarmDetected,
}: EarlyHarmBannerProps): ReactNode => {
  const { translate } = useTranslationWrapper(useTranslation());
  const locale = useLocale();

  const titleAndDescription: {
    title: FormattedText;
    description: FormattedText;
    severity: TAlertProps['severity'];
    variant: TAlertProps['variant'];
  } | null = useMemo(() => {
    if (!experiment) {
      return null;
    }

    if (isHarmDetected) {
      const { mostHarmfulMetric, harmingMetricsCount } =
        getExperimentHarmSummary(experimentVariantsResults);

      if (mostHarmfulMetric) {
        const formattedLiftPercent = formatNumberWithSpec(
          mostHarmfulMetric.lift,
          {
            abbreviate: false,
            numberFormatOptions: {
              style: 'percent',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          },
          { locale, translate },
        );
        const metricName = translate(
          getAnalyticsMetricDisplayConfig(ExperimentMetricToRAQIV2Metric[mostHarmfulMetric.metric])
            .localizedName,
        );
        const metricNoun = translate(
          translationKey(
            // We highlight most harmful metric, noun is for n-1 remaining metric
            harmingMetricsCount > 2 ? 'Noun.Metric.Plural' : 'Noun.Metric.Singular',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        );

        return {
          title: translate(
            translationKey(
              'Title.ExperimentSignificanceNotificationArea.HarmDetected',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
          ),
          description: translate(
            translationKey(
              harmingMetricsCount === 1
                ? 'Description.HarmingMetrics.OneMetric'
                : 'Description.HarmingMetrics.MultipleMetrics',
              TranslationNamespace.UniverseConfigAndExperimentation,
            ),
            {
              metricName,
              liftPercentage: formattedLiftPercent,
              numAdditionalMetrics: String(harmingMetricsCount - 1),
              metricNoun,
            },
          ),
          severity: 'error',
          variant: 'standard',
        };
      }
    }

    if (experiment.isEarlyHarmAnalysisPeriod) {
      return {
        title: translate(
          translationKey(
            'Title.ExperimentSignificanceNotificationArea.EarlyHarm',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
        description: translate(
          translationKey(
            'Description.ExperimentSignificanceNotificationArea.EarlyHarm',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          {
            updateFrequencyMins: String(DEFAULT_EARLY_HARM_UPDATE_FREQUENCY_MINS),
            durationHrs: String(DEFAULT_EARLY_HARM_DURATION_HRS),
          },
        ),
        severity: 'info',
        variant: 'outlined',
      };
    }

    return null;
  }, [experiment, experimentVariantsResults, isHarmDetected, locale, translate]);

  if (!titleAndDescription) {
    return null;
  }

  const { title, description, severity, variant } = titleAndDescription;

  return (
    <Grid container item XSmall={12}>
      <Alert variant={variant} severity={severity} className='width-full'>
        <AlertTitle>{title}</AlertTitle>
        <Typography component='div' marginTop='6px' variant='smallLabel1'>
          {description}
        </Typography>
      </Alert>
    </Grid>
  );
};

export default EarlyHarmBanner;
