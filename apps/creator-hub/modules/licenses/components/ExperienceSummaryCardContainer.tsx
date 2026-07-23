import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ContentTile, ContentType } from '@modules/ip/license-manager/components/ContentTile';
import {
  KeyValuePair,
  KeyValuePairContainer,
} from '@modules/ip/license-manager/components/KeyValuePair';
import { useGetExperienceGuidelines } from '@modules/ip/license-manager/agreements/hooks/useGetExperienceGuidelines';

import CommonSummaryCardContainerSkeleton from './CommonSummaryCardContainerSkeleton';
import useCommonSummaryCardContainerStyles from './CommonSummaryCardContainer.styles';
import useGetExperienceDetails from '../hooks/useGetExperienceDetails';

interface ExperienceSummaryCardContainerProps {
  experienceId: number;
}

const ExperienceSummaryCardContainer: FunctionComponent<
  React.PropsWithChildren<ExperienceSummaryCardContainerProps>
> = ({ experienceId }) => {
  const { translate } = useTranslation();
  const {
    classes: { summaryContainer },
  } = useCommonSummaryCardContainerStyles();

  const {
    data: experienceData,
    isPending: areExperienceDetailsPending,
    isError: hasExperienceDetailsError,
  } = useGetExperienceDetails({ experienceId });
  const {
    data: experienceGuidelineData,
    isPending: areExperienceGuidelinesPending,
    isError: hasExperienceGuidelinesError,
  } = useGetExperienceGuidelines({
    universeId: experienceId,
  });

  if (areExperienceDetailsPending || areExperienceGuidelinesPending) {
    return <CommonSummaryCardContainerSkeleton testId='experience-summary-skeleton' />;
  }

  if (hasExperienceDetailsError || !experienceData) {
    return (
      <Grid
        container
        className={summaryContainer}
        marginTop={1}
        alignContent='center'
        justifyContent='center'>
        <Typography variant='body1' color='secondary'>
          {translate('Description.FailedToLoadExperience')}
        </Typography>
      </Grid>
    );
  }

  const experienceGuidelines =
    hasExperienceGuidelinesError || !experienceGuidelineData
      ? translate('Label.MaturityRatingNoneAvailable')
      : experienceGuidelineData;

  return (
    <Grid container flexDirection='column' width='auto'>
      <Grid item>
        <ContentTile
          header={experienceData.name!}
          subheader={experienceData.creatorName!}
          thumbnailTargetId={experienceData.universeId!}
          type={ContentType.Universe}
        />
      </Grid>
      <Grid item>
        <KeyValuePairContainer>
          <KeyValuePair label={translate('Label.ContentMaturity')} value={experienceGuidelines} />
        </KeyValuePairContainer>
      </Grid>
    </Grid>
  );
};

export default ExperienceSummaryCardContainer;
