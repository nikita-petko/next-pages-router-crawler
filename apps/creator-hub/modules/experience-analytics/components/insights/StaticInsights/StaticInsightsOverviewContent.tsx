import type { ReactElement } from 'react';
import React, { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { Grid, makeStyles, Typography } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { StaticInsightType } from '@modules/clients/analytics';
import useUniversePublishStatus from '@modules/creations-overview/hooks/useUniversePublishStatus';
import { useUniverseResource } from '@modules/experience-analytics-shared/hooks/useChartResourceProvider';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { MetricAverageTypeProvider } from '../../../pages/ExperienceOverviewPage/MetricAverageTypeContext';
import SnapshotSection from '../../../pages/ExperienceOverviewPage/SnapshotSection';
import StaticInsightCard from './StaticInsightCard';

const useStaticInsightsStyles = makeStyles()(() => ({
  container: {
    marginBottom: 20,
  },
  cardContainer: {
    display: 'flex',
    marginTop: 0,
  },
}));

const StaticInsightsOverviewContent: React.FC = () => {
  const { id: universeId } = useUniverseResource();
  const { isPublished } = useUniversePublishStatus(universeId);
  const { translate } = useRAQIV2TranslationDependencies();
  const {
    classes: { container, cardContainer },
  } = useStaticInsightsStyles();

  const { titleKey, description } = useMemo(() => {
    return {
      titleKey: translationKey('Title.GetStarted', TranslationNamespace.Insights),
      description: translate(
        translationKey('Description.GetStarted', TranslationNamespace.Insights),
      ),
    };
  }, [translate]);

  const cards: Array<ReactElement<typeof Grid>> = useMemo(() => {
    return Object.values(StaticInsightType).map((insightType) => (
      <Grid item XSmall={12} Large={4} key={insightType}>
        <StaticInsightCard insightType={insightType} />
      </Grid>
    ));
  }, []);

  const staticInsights = useMemo(
    () =>
      isPublished ? (
        <Grid item XSmall={12} className={container}>
          <Grid container direction='row' spacing={2}>
            <Grid item container XSmall={12}>
              <Grid item>
                <Typography variant='h2'>{translate(titleKey)}</Typography>
              </Grid>
              <Grid item container alignItems='center' justifyContent='space-between'>
                <Typography variant='body1'>{description}</Typography>
              </Grid>
            </Grid>
            <Grid item container spacing={3} className={cardContainer}>
              {cards}
            </Grid>
          </Grid>
        </Grid>
      ) : null,
    [isPublished, container, translate, titleKey, description, cardContainer, cards],
  );

  return (
    <MetricAverageTypeProvider>
      {staticInsights}
      <SnapshotSection />
    </MetricAverageTypeProvider>
  );
};

export default withTranslation(StaticInsightsOverviewContent, [
  TranslationNamespace.Creations,
  TranslationNamespace.Navigation,
  TranslationNamespace.Analytics,
  TranslationNamespace.Insights,
  TranslationNamespace.Controls,
  TranslationNamespace.Error,
]);
