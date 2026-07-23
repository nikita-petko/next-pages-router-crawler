import React, { FC, useMemo } from 'react';
import { AnnotationType } from '@modules/clients/analytics';
import { makeStyles, Typography } from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import { Link } from '@modules/miscellaneous/common';
import { dateTimeFormatter } from '@rbx/core';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { getEventUrl } from '@modules/miscellaneous/common/urls/www';
import {
  TranslationKey,
  translationKey,
  useTranslationWrapper,
} from '@modules/analytics-translations';
import { TimeSeriesAnnotation, useLocale } from '@modules/charts-generic';
import { useTranslation } from '@rbx/intl';

const useStyles = makeStyles()((theme) => ({
  eventContainer: {
    borderRadius: theme.border.radius.small.borderRadius,
    overflow: 'hidden',
    fontSize: '12px',
    lineHeight: '140%',
    fontWeight: theme.typography.fontWeightLight,
    padding: '4px',
  },
  eventLinkText: {
    lineClamp: 1,
    textOverflow: 'ellipsis',
    position: 'relative',
    lineHeight: '130%',
    fontSize: '12px',
    fontWeight: theme.typography.fontWeightMedium,
  },
  eventThumbnail: {
    borderTopLeftRadius: theme.border.radius.xsmall.borderRadius,
    borderBottomLeftRadius: theme.border.radius.xsmall.borderRadius,
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'left center',
    height: '48px',
    width: '62px',
  },
}));

type LiveEventAnnotationTooltipContentProps = {
  annotation: TimeSeriesAnnotation & { type: AnnotationType.LiveEvent };
};

const LiveEventAnnotationTooltipContent: FC<LiveEventAnnotationTooltipContentProps> = ({
  annotation,
}) => {
  const {
    classes: { eventContainer, eventLinkText, eventThumbnail },
  } = useStyles();
  const locale = useLocale();
  const { translate } = useTranslationWrapper(useTranslation());

  const { imageUrl, eventName, eventId, startUtc } = annotation;

  const eventDateDescription = useMemo(() => {
    const dateTime = dateTimeFormatter(locale).getCustomDateTime(startUtc, {
      month: 'short',
      day: '2-digit',
    });

    let eventDateDescriptionKey: TranslationKey;
    switch (annotation.eventType) {
      case 'start':
        eventDateDescriptionKey = translationKey(
          'Description.Annotation.StartedAt',
          TranslationNamespace.Analytics,
        );
        break;
      case 'end':
        eventDateDescriptionKey = translationKey(
          'Description.Annotation.EndedAt',
          TranslationNamespace.Analytics,
        );
        break;
      default: {
        const exhaustiveCheck: never = annotation.eventType;
        throw new Error('Exhaustive check:', exhaustiveCheck);
      }
    }
    return translate(eventDateDescriptionKey, { datetime: dateTime });
  }, [annotation.eventType, locale, startUtc, translate]);

  return (
    <Flex alignItems='center' classes={{ root: eventContainer }} gap={8}>
      {imageUrl ? (
        <div style={{ backgroundImage: `url(${imageUrl})` }} className={eventThumbnail} />
      ) : null}
      <div>
        <Link href={getEventUrl(eventId)} target='_blank' color='inherit' display='block'>
          <Typography variant='smallLabel2' classes={{ root: eventLinkText }}>
            {eventName}
          </Typography>
        </Link>
        {eventDateDescription}
      </div>
    </Flex>
  );
};

export default LiveEventAnnotationTooltipContent;
