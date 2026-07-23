import React, { useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  InfoOutlinedIcon,
  makeStyles,
  Skeleton,
  Typography,
  WarningIcon,
} from '@rbx/ui';
import { getAnalyticsMetricDisplayConfig } from '@modules/experience-analytics-shared';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { NumberFormatter } from '@rbx/core';
import { useLocale } from '@modules/charts-generic';
import { Link, urls } from '@modules/miscellaneous/common';
import { ExperimentMetricToRAQIV2Metric } from '../../api/makeValidatedExperimentationAPI';
import { ExperimentMetric } from '../../api/universeExperimentationClientEnums';
import useExperimentMDECalculation from '../hooks/useExperimentMDECalculation';

type MinimumDetectableEffectCardProps = {
  metric: ExperimentMetric;
  exposurePercent: number;
  durationDays: number;
  baselineProportion: number;
  variantProportions: number[];
};

const useStyles = makeStyles()(() => ({
  cardContent: {
    padding: `24px`,
  },
  statsContainer: {
    display: 'flex',
    gap: '16px',
    marginTop: '16px',
  },
  secondaryDescriptionBlock: {
    marginTop: '16px',
  },
}));

const MinimumDetectableEffectCard = ({
  metric,
  exposurePercent,
  durationDays,
  baselineProportion,
  variantProportions,
}: MinimumDetectableEffectCardProps) => {
  const locale = useLocale();
  const { translate, translateHTML } = useTranslationWrapper(useTranslation());
  const {
    classes: { cardContent, statsContainer, secondaryDescriptionBlock },
  } = useStyles();

  const { mde, isFetching, error } = useExperimentMDECalculation({
    exposurePercent,
    goalMetric: metric,
    durationDays,
    baselineProportion,
    variantProportions,
  });

  const { metricLabel } = useMemo(() => {
    const { localizedName } = getAnalyticsMetricDisplayConfig(
      ExperimentMetricToRAQIV2Metric[metric],
    );
    return {
      metricLabel: translate(localizedName),
    };
  }, [metric, translate]);

  const { audienceValue, mdeValue, description, secondaryDescription } = useMemo(() => {
    if (isFetching) {
      return {
        audienceValue: <Skeleton width={60} animate />,
        mdeValue: <Skeleton width={60} animate />,
        description: <Skeleton height={120} animate variant='rectangular' />,
      };
    }

    if (error) {
      return {
        audienceValue: '--',
        mdeValue: '--',
        description: translateHTML(
          translationKey(
            'Description.MDE.Error',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks: React.ReactNode) {
                return (
                  <Link
                    href={urls.creatorHub.docs.getExperimentationBestPracticesUrl()}
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        ),
      };
    }

    if (!mde) {
      return {
        audienceValue: '--',
        mdeValue: '--',
        description: translateHTML(
          translationKey(
            'Description.MDE.NoMDE',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks: React.ReactNode) {
                return (
                  <Link
                    href={urls.creatorHub.docs.getExperimentationBestPracticesUrl()}
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        ),
      };
    }

    if (mde.totalSampleSize === 0 || !mde.meetThreshold) {
      return {
        audienceValue: 0,
        mdeValue: (
          <React.Fragment>
            <span>N/A</span> <InfoOutlinedIcon color='error' />
          </React.Fragment>
        ),
        description: translateHTML(
          translationKey(
            'Description.MDE.MDEBelowMinimumSampleSize',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          [
            {
              opening: 'boldStart',
              closing: 'boldEnd',
              content(chunks: React.ReactNode) {
                return <Typography variant='subtitle2'>{chunks}</Typography>;
              },
            },
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks: React.ReactNode) {
                return (
                  <Link
                    href={urls.creatorHub.docs.getExperimentationBestPracticesUrl()}
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        ),
        secondaryDescription: translate(
          translationKey(
            'Description.MDE.MDEForMetricTooltip',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      };
    }

    const localizedNumberFormatter = new NumberFormatter(locale, '');
    const formattedAudienceValue = localizedNumberFormatter.getCustomNumber(
      mde.totalSampleSize,
      {},
    );

    if (mde.mdeRelativePercentage > 100) {
      // case 1
      return {
        audienceValue: formattedAudienceValue,
        mdeValue: (
          <React.Fragment>
            <span>{`>100%`}</span> <WarningIcon color='warning' />
          </React.Fragment>
        ),
        description: translateHTML(
          translationKey(
            'Description.MDE.MDEOver100',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
          [
            {
              opening: 'boldStart',
              closing: 'boldEnd',
              content(chunks: React.ReactNode) {
                return <Typography variant='subtitle2'>{chunks}</Typography>;
              },
            },
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks: React.ReactNode) {
                return (
                  <Link
                    href={urls.creatorHub.docs.getExperimentationBestPracticesUrl()}
                    target='_blank'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        ),
        secondaryDescription: translate(
          translationKey(
            'Description.MDE.MDEForMetricTooltip',
            TranslationNamespace.UniverseConfigAndExperimentation,
          ),
        ),
      };
    }

    let formattedMdeValue: React.ReactNode;
    let key = translationKey(
      'Description.MDE',
      TranslationNamespace.UniverseConfigAndExperimentation,
    );
    if (!mde.mdeRelativePercentage) {
      // case 3
      formattedMdeValue = (
        <React.Fragment>
          <span>N/A</span> <WarningIcon color='warning' />
        </React.Fragment>
      );
      key = translationKey(
        'Description.MDE.ChooseAnotherMetric',
        TranslationNamespace.UniverseConfigAndExperimentation,
      );
    } else if (mde.mdeRelativePercentage < 0.1) {
      formattedMdeValue = localizedNumberFormatter
        .getCustomNumber(mde.mdeRelativePercentage / 100, {
          notation: 'scientific',
        })
        .toString();
    } else {
      formattedMdeValue = localizedNumberFormatter
        .getCustomNumber(mde.mdeRelativePercentage / 100, {
          style: 'percent',
          minimumFractionDigits: 1,
          maximumFractionDigits: 3,
        })
        .toString();
    }

    return {
      audienceValue: formattedAudienceValue,
      mdeValue: formattedMdeValue,
      description: translateHTML(key, [
        {
          opening: 'boldStart',
          closing: 'boldEnd',
          content(chunks: React.ReactNode) {
            return <Typography variant='subtitle2'>{chunks}</Typography>;
          },
        },
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks: React.ReactNode) {
            return (
              <Link
                href={urls.creatorHub.docs.getExperimentationBestPracticesUrl()}
                target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
      ]),
    };
  }, [isFetching, error, mde, locale, translateHTML, translate]);

  const Stats: React.FC<{ label: string; value: React.ReactNode }> = useCallback(
    ({ label, value }) => {
      return (
        <div>
          <Typography variant='smallLabel1' component='div'>
            {label}
          </Typography>
          <Typography variant='h4'>{value}</Typography>
        </div>
      );
    },
    [],
  );

  return (
    <Card>
      <CardContent classes={{ root: cardContent }}>
        <Typography variant='body1' component='div'>
          {description}
        </Typography>
        {secondaryDescription && (
          <Typography variant='body1' component='div' classes={{ root: secondaryDescriptionBlock }}>
            {secondaryDescription}
          </Typography>
        )}
        <div className={statsContainer}>
          <Stats
            label={translate(
              translationKey(
                'Label.MDE.EstimatedAudience',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
            )}
            value={audienceValue}
          />
          <Stats
            label={translate(
              translationKey(
                'Label.MDE.MDEForMetric',
                TranslationNamespace.UniverseConfigAndExperimentation,
              ),
              { metric: metricLabel },
            )}
            value={mdeValue}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MinimumDetectableEffectCard;
