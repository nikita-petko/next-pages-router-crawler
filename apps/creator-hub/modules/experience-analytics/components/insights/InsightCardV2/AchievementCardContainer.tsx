import type { FC } from 'react';
import { Grid } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { NonEmptyArray } from '@modules/charts-generic/types/NonEmptyArray';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type { InsightAchievementSpec } from '@modules/experience-analytics-shared/types/insights';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import Section from '../../Section';
import AchievementCard from './AchievementCard';

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
