import { useMemo } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { Card, Typography, Grid, Chip } from '@rbx/ui';
import MdxContent from '@modules/analytics-assistant/components/markdown/MDX';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import useGenericSummaryInsightCardStyles from '@modules/experience-analytics-shared/components/GenericSummaryInsightCard/GenericSummaryInsightCard.styles';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

type GenerativeAIInsightCardProps = {
  reportSummary: string;
};

const GenerativeAIInsightCard = ({ reportSummary }: GenerativeAIInsightCardProps) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: {
      card,
      iconContainer,
      contentContainer,
      headerContainer,
      headerContent,
      headerText,
      bodyContainer,
    },
  } = useGenericSummaryInsightCardStyles();

  const betaChip = useMemo(
    () => (
      <Chip
        label={translate(translationKey('Label.Beta', TranslationNamespace.AnalyticsAssistant))}
        color='secondary'
        size='small'
      />
    ),
    [translate],
  );

  return (
    <Card variant='outlined'>
      <Grid className={card} container>
        <Grid className={iconContainer} item>
          <Icon name='icon-regular-nebula' />
        </Grid>
        <Grid className={contentContainer} item>
          <div className={headerContainer}>
            <div className={headerContent}>
              <Typography className={headerText} variant='h5'>
                {translate(translationKey('Heading.Assistant', TranslationNamespace.Analytics))}
              </Typography>
              {betaChip}
            </div>
          </div>
          <div className={bodyContainer}>
            <MdxContent content={reportSummary.replace(/^\n+/, '')} />
          </div>
          <Typography variant='captionBody' color='secondary'>
            {translate(
              translationKey(
                'Label.PlayerFeedbackCard.Disclaimer',
                TranslationNamespace.AnalyticsAssistant,
              ),
            )}
          </Typography>
        </Grid>
      </Grid>
    </Card>
  );
};

export default GenerativeAIInsightCard;
