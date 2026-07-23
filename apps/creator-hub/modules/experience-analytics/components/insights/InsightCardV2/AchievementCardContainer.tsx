import React, { FC } from 'react';
import { NonEmptyArray } from '@modules/charts-generic';
import { translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Grid } from '@rbx/ui';
import {
  InsightAchievementSpec,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import AchievementCard from './AchievementCard';
import Section from '../../Section';

type AchievementCardContainerProps = {
  achievementCardSpecs: NonEmptyArray<InsightAchievementSpec>;
};

const AchievementCardContainer: FC<AchievementCardContainerProps> = ({ achievementCardSpecs }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  return (
    <Section title={translate(translationKey('Title.Achievements', TranslationNamespace.Insights))}>
      <Grid container item XSmall={12} direction='column' spacing='24px'>
        {achievementCardSpecs.map((spec) => (
          <Grid item key={spec.insightId}>
            <AchievementCard spec={spec} />
          </Grid>
        ))}
      </Grid>
    </Section>
  );
};

export default AchievementCardContainer;
