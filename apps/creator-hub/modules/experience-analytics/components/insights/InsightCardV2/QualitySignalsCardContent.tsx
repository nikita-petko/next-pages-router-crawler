import React, { FC, useCallback, useMemo } from 'react';
import {
  AddIcon,
  Card,
  CardActionArea,
  CardContent,
  EditIcon,
  FactCheckIcon,
  LightbulbIcon,
  Link,
  PersonIcon,
  Typography,
  useMediaQuery,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useImpressionObserver } from '@modules/charts-generic';
import { translationKey, useTranslationWrapper } from '@modules/analytics-translations';
import { Flex } from '@modules/miscellaneous/common/components';
import { useTranslation } from '@rbx/intl';
import {
  QualitySignalCardsSpec,
  useExperienceAnalyticsGameDetails,
} from '@modules/experience-analytics-shared';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import useQualitySignalCardStyles from './QualitySignalCard.style';
import { logQualitySignalCardsImpression, logQualitySignalsClick } from '../InsightsLogger';

const QualitySignalsCardContent: FC<{ spec: QualitySignalCardsSpec }> = ({ spec }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const {
    classes: { cardsWrapper, card, icon, cardActionArea },
  } = useQualitySignalCardStyles();
  const isCompactView = useMediaQuery((theme) => theme.breakpoints.down('Medium'));
  const { rootPlaceId, universeId } = useExperienceAnalyticsGameDetails();
  const { unifiedLogger } = useUnifiedLoggerProvider();

  const cardRef = React.useRef<HTMLDivElement>(null);
  const sendImpressionEvent = useCallback(() => {
    logQualitySignalCardsImpression(unifiedLogger, universeId);
  }, [unifiedLogger, universeId]);
  useImpressionObserver(cardRef, sendImpressionEvent);

  // Define a mapping from spec's true/false values to translated strings and links.
  // Keep this updated as new signals become available.
  const textMap = useMemo(
    () => [
      {
        condition: spec.showDefaultPlaceCard,
        type: 'showDefaultPlace',
        title: translate(
          translationKey('Header.UpdateDefaultPlace', TranslationNamespace.Insights),
        ),
        text: translate(
          translationKey('Description.UpdateDefaultPlace', TranslationNamespace.Insights),
        ),
        link: 'places',
        icon: <AddIcon className={icon} color='secondary' />,
      },
      {
        condition: spec.showDefaultNameDescriptionCard,
        type: 'showDefaultNameDescription',
        title: translate(
          translationKey('Header.UpdateDefaultNameDescription', TranslationNamespace.Insights),
        ),
        text: translate(
          translationKey('Description.UpdateDefaultNameDescription', TranslationNamespace.Insights),
        ),
        link: 'configure',
        icon: <EditIcon className={icon} color='secondary' />,
      },
      {
        condition: spec.showDefaultIconCard,
        type: 'showDefaultIcon',
        title: translate(translationKey('Header.UpdateDefaultIcon', TranslationNamespace.Insights)),
        text: translate(
          translationKey('Description.UpdateDefaultIcon', TranslationNamespace.Insights),
        ),
        link: `places/${rootPlaceId}/icon`,
        icon: <LightbulbIcon className={icon} color='secondary' />,
      },
      {
        condition: spec.showDefaultThumbnailCard,
        type: 'showDefaultThumbnail',
        title: translate(
          translationKey('Header.UpdateDefaultThumbnail', TranslationNamespace.Insights),
        ),
        text: translate(
          translationKey('Description.UpdateDefaultThumbnail', TranslationNamespace.Insights),
        ),
        link: `places/${rootPlaceId}/thumbnails`,
        icon: <PersonIcon className={icon} color='secondary' />,
      },
      {
        condition: spec.showCompleteGuidelinesCard,
        type: 'showCompleteGuidelines',
        title: translate(
          translationKey('Header.CompleteGuidelines', TranslationNamespace.Insights),
        ),
        text: translate(
          translationKey('Description.CompleteGuidelines', TranslationNamespace.Insights),
        ),
        link: 'experience-questionnaire',
        icon: <FactCheckIcon className={icon} color='secondary' />,
      },
    ],
    [
      icon,
      rootPlaceId,
      spec.showCompleteGuidelinesCard,
      spec.showDefaultIconCard,
      spec.showDefaultNameDescriptionCard,
      spec.showDefaultPlaceCard,
      spec.showDefaultThumbnailCard,
      translate,
    ],
  );

  const handleCardOnClick = useCallback(
    (qualitySignalType: string) => {
      const placeId = rootPlaceId;
      logQualitySignalsClick(unifiedLogger, {
        universeId,
        placeId,
        qualitySignalType,
      });
    },
    [rootPlaceId, unifiedLogger, universeId],
  );

  // Filter based on condition and take only up to the first three
  const cardsToShow = textMap.filter((cardData) => cardData.condition).slice(0, 3);

  return (
    <Flex
      gap={12}
      flexDirection={isCompactView ? 'column' : 'row'}
      classes={{ root: cardsWrapper }}
      ref={cardRef}>
      {cardsToShow.map((cardData) => (
        <Card key={cardData.title} classes={{ root: card }} variant='outlined'>
          <CardActionArea disableRipple classes={{ root: cardActionArea }}>
            <Link
              href={cardData.link}
              underline='none'
              onClick={() => handleCardOnClick(cardData.type)}>
              <CardContent>
                <Flex justifyContent='flex-start' alignItems='center'>
                  {cardData.icon}
                  <div>
                    <Typography variant='h6' color='primary' display='block'>
                      {cardData.title}
                    </Typography>
                    <Typography variant='body1' color='primary' display='block'>
                      {cardData.text}
                    </Typography>
                  </div>
                </Flex>
              </CardContent>
            </Link>
          </CardActionArea>
        </Card>
      ))}
    </Flex>
  );
};

export default QualitySignalsCardContent;
