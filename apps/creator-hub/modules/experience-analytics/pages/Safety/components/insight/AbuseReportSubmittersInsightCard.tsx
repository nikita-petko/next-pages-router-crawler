import React, { ReactNode, useCallback, useMemo, useRef } from 'react';
import { Card, Typography, Grid, Button, Link, BuilderInsightsIcon } from '@rbx/ui';
import { AnalyticsDocLink, useImpressionObserver, useLocale } from '@modules/charts-generic';
import { translationKey, TranslationKey } from '@modules/analytics-translations';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Flex } from '@modules/miscellaneous/common/components';
import {
  useRAQIV2TranslationDependencies,
  useRAQIAnalyticsCurrentFilterBundle,
  getDimensionRenderer,
} from '@modules/experience-analytics-shared';
import { RAQIV2Dimension, RAQIV2AbuseChannel } from '@rbx/creator-hub-analytics-config';
import { AbuseReportSubmittersInsightSpec } from '../../hooks/useGetAbuseReportInsight';
import useAbuseReportSubmittersInsightCardStyles from './AbuseReportSubmittersInsightCard.styles';

const safetyDocLink: AnalyticsDocLink = '/docs/safety';
const textFilterDocLink: AnalyticsDocLink = '/docs/ui/text-filtering';

type AbuseReportContent = {
  headingKey: TranslationKey;
  descriptionKey: TranslationKey;
  cta: {
    key: TranslationKey;
    action:
      | { type: 'filter'; value: RAQIV2AbuseChannel }
      | { type: 'link'; value: AnalyticsDocLink };
  };
  descriptionLinks?: AnalyticsDocLink[];
};

const abuseChannelContentMap: Record<RAQIV2AbuseChannel | 'Total', AbuseReportContent> = {
  Total: {
    headingKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Total.Heading',
      TranslationNamespace.Safety,
    ),
    descriptionKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Total.Description',
      TranslationNamespace.Safety,
    ),
    cta: {
      key: translationKey(
        'Action.AbuseReportSubmitters.Insight.Total.CTA',
        TranslationNamespace.Safety,
      ),
      action: { type: 'link', value: safetyDocLink },
    },
  },
  [RAQIV2AbuseChannel.Avatar]: {
    headingKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Avatar.Heading',
      TranslationNamespace.Safety,
    ),
    descriptionKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Avatar.Description',
      TranslationNamespace.Safety,
    ),
    cta: {
      key: translationKey(
        'Action.AbuseReportSubmitters.Insight.Avatar.CTA',
        TranslationNamespace.Safety,
      ),
      action: { type: 'filter', value: RAQIV2AbuseChannel.Avatar },
    },
    descriptionLinks: [safetyDocLink],
  },
  [RAQIV2AbuseChannel.Chat]: {
    headingKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Text.Heading',
      TranslationNamespace.Safety,
    ),
    descriptionKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Text.Description',
      TranslationNamespace.Safety,
    ),
    cta: {
      key: translationKey(
        'Action.AbuseReportSubmitters.Insight.Text.CTA',
        TranslationNamespace.Safety,
      ),
      action: { type: 'filter', value: RAQIV2AbuseChannel.Chat },
    },
    descriptionLinks: [safetyDocLink, textFilterDocLink],
  },
  [RAQIV2AbuseChannel.Voice]: {
    headingKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Voice.Heading',
      TranslationNamespace.Safety,
    ),
    descriptionKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Voice.Description',
      TranslationNamespace.Safety,
    ),
    cta: {
      key: translationKey(
        'Action.AbuseReportSubmitters.Insight.Voice.CTA',
        TranslationNamespace.Safety,
      ),
      action: { type: 'filter', value: RAQIV2AbuseChannel.Voice },
    },
  },
  [RAQIV2AbuseChannel.Place]: {
    headingKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Place.Heading',
      TranslationNamespace.Safety,
    ),
    descriptionKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Place.Description',
      TranslationNamespace.Safety,
    ),
    cta: {
      key: translationKey(
        'Action.AbuseReportSubmitters.Insight.Place.CTA',
        TranslationNamespace.Safety,
      ),
      action: { type: 'filter', value: RAQIV2AbuseChannel.Place },
    },
    descriptionLinks: [safetyDocLink],
  },
  [RAQIV2AbuseChannel.Audio]: {
    headingKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Audio.Heading',
      TranslationNamespace.Safety,
    ),
    descriptionKey: translationKey(
      'Label.AbuseReportSubmitters.Insight.Audio.Description',
      TranslationNamespace.Safety,
    ),
    cta: {
      key: translationKey(
        'Action.AbuseReportSubmitters.Insight.Audio.CTA',
        TranslationNamespace.Safety,
      ),
      action: { type: 'filter', value: RAQIV2AbuseChannel.Audio },
    },
    descriptionLinks: [safetyDocLink],
  },
};

type AbuseReportSubmittersInsightCardProps = AbuseReportSubmittersInsightSpec;

const AbuseReportSubmittersInsightCard = (props: AbuseReportSubmittersInsightCardProps) => {
  const { universeId, channel: abuseChannelValue } = props;
  const {
    classes: {
      summaryContainer,
      iconContainer,
      summaryTextContainer,
      summaryText,
      summaryDescription,
    },
  } = useAbuseReportSubmittersInsightCardStyles();
  const locale = useLocale();
  const { translate, translateHTML, ...translationDependencies } =
    useRAQIV2TranslationDependencies();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const { filters, onFiltersChange } = useRAQIAnalyticsCurrentFilterBundle([
    RAQIV2Dimension.AbuseChannel,
  ]);

  // Get dimension renderer for AbuseChannel to translate channel names
  const abuseChannelRenderer = useMemo(
    () => getDimensionRenderer(RAQIV2Dimension.AbuseChannel),
    [],
  );

  // Build comma-separated list of breakdown channel names for Total insights
  const breakdownChannelNames = useMemo(() => {
    if (abuseChannelValue !== 'Total') {
      return undefined;
    }

    const { subChannels } = props;

    if (subChannels.length === 0) {
      return undefined;
    }

    return subChannels
      .map((channel) =>
        abuseChannelRenderer
          .getBreakdownValueName(
            { value: channel },
            { translate, translateHTML, ...translationDependencies },
          )
          .toLocaleLowerCase(locale),
      )
      .join(', ');
  }, [
    abuseChannelValue,
    props,
    abuseChannelRenderer,
    translate,
    translateHTML,
    translationDependencies,
    locale,
  ]);

  // Determine content based on channel value and breakdown channels
  const content = useMemo(() => {
    const baseContent = abuseChannelContentMap[abuseChannelValue];

    // If it's Total and we have breakdown channels, use dynamic content
    if (abuseChannelValue === 'Total') {
      const { subChannels } = props as { subChannels: RAQIV2AbuseChannel[] };

      if (subChannels.length > 0) {
        return {
          ...baseContent,
          descriptionKey: translationKey(
            'Label.AbuseReportSubmitters.Insight.Total.DescriptionV2',
            TranslationNamespace.Safety,
          ),
        };
      }
    }

    return baseContent;
  }, [abuseChannelValue, props]);

  const descriptionLinks = useMemo(
    () =>
      content.descriptionLinks?.map((link, index) => ({
        opening: `linkStart${index === 0 ? '' : index}`,
        closing: `linkEnd${index === 0 ? '' : index}`,
        content: (chunks: ReactNode) => {
          return (
            <Link href={link} target='_blank' underline='always' color='inherit'>
              {chunks}
            </Link>
          );
        },
      })) || [],
    [content.descriptionLinks],
  );

  const heading = useMemo(() => {
    if (breakdownChannelNames) {
      return translate(content.headingKey, { channels: breakdownChannelNames });
    }
    return translate(content.headingKey);
  }, [content.headingKey, breakdownChannelNames, translate]);

  const description = useMemo(() => {
    if (descriptionLinks.length > 0) {
      return translateHTML(content.descriptionKey, descriptionLinks);
    }
    if (breakdownChannelNames) {
      return translate(content.descriptionKey, { channels: breakdownChannelNames });
    }
    return translate(content.descriptionKey);
  }, [content.descriptionKey, descriptionLinks, breakdownChannelNames, translate, translateHTML]);

  const handleClick = useCallback(() => {
    const {
      action: { type, value },
    } = content.cta;
    if (type === 'filter') {
      const abuseChannelFilter = {
        dimension: RAQIV2Dimension.AbuseChannel,
        values: [value],
      };

      const updatedFilters = filters.filter(
        (filter) => filter.dimension !== RAQIV2Dimension.AbuseChannel,
      );
      updatedFilters.push(abuseChannelFilter);
      onFiltersChange(updatedFilters);
    } else if (type === 'link') {
      window.open(value, '_blank');
    }

    unifiedLogger.logClickEvent({
      eventName: 'analytics/safety/abuseReportInsightPrimaryCTA',
      parameters: {
        universe_id: universeId.toString(),
        abuse_channel: abuseChannelValue,
      },
    });
  }, [content.cta, unifiedLogger, universeId, abuseChannelValue, filters, onFiltersChange]);

  const cardRef = useRef<HTMLDivElement>(null);
  const logImpression = useCallback(() => {
    unifiedLogger.logImpressionEvent({
      eventName: 'analytics/safety/abuseReportInsightImpression',
      parameters: {
        universe_id: universeId.toString(),
        abuse_channel: abuseChannelValue,
      },
    });
  }, [unifiedLogger, universeId, abuseChannelValue]);
  useImpressionObserver(cardRef, logImpression);

  return (
    <Card ref={cardRef} variant='outlined'>
      <Grid className={summaryContainer} container>
        <Grid className={iconContainer} item>
          <BuilderInsightsIcon />
        </Grid>
        <Grid className={summaryTextContainer} item>
          <Typography className={summaryText} variant='h5'>
            {heading}
          </Typography>
          <Typography className={summaryDescription} variant='body1'>
            {description}
          </Typography>
          <Flex justifyContent='flex-start' alignItems='center'>
            <Button
              color='secondary'
              variant='contained'
              size='medium'
              onClick={handleClick}
              sx={{ marginTop: 1, marginBottom: 1 }}>
              {translate(content.cta.key)}
            </Button>
          </Flex>
        </Grid>
      </Grid>
    </Card>
  );
};

export default AbuseReportSubmittersInsightCard;
