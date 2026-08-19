import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography } from '@rbx/ui';
import { useGetExperienceGuidelines } from '@modules/ip/license-manager/agreements/hooks/useGetExperienceGuidelines';
import { ContentTile, ContentType } from '@modules/ip/license-manager/components/ContentTile';
import {
  KeyValuePair,
  KeyValuePairContainer,
} from '@modules/ip/license-manager/components/KeyValuePair';
import { getCreatorDisplayName } from '@modules/ip/license-manager/utils/creatorName';
import useGetExperienceDetails from '../hooks/useGetExperienceDetails';
import useCommonSummaryCardContainerStyles from './CommonSummaryCardContainer.styles';
import CommonSummaryCardContainerSkeleton from './CommonSummaryCardContainerSkeleton';

interface ExperienceSummaryCardContainerProps {
  experienceId: number;
  /** Rendered between the experience tile and content maturity (e.g. collaboration revenue targets). */
  creationDetailsContent?: React.ReactNode;
}

const ExperienceSummaryCardContainer: FunctionComponent<
  React.PropsWithChildren<ExperienceSummaryCardContainerProps>
> = ({ experienceId, creationDetailsContent }) => {
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
    return (
      <>
        <CommonSummaryCardContainerSkeleton testId='experience-summary-skeleton' />
        {creationDetailsContent != null && (
          <Grid container flexDirection='column' width='auto'>
            <Grid item>{creationDetailsContent}</Grid>
          </Grid>
        )}
      </>
    );
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
          header={experienceData.name}
          subheader={
            experienceData.creatorName
              ? getCreatorDisplayName(experienceData.creatorType, experienceData.creatorName)
              : ''
          }
          thumbnailTargetId={experienceData.universeId}
          type={ContentType.Universe}
        />
      </Grid>
      {creationDetailsContent != null && <Grid item>{creationDetailsContent}</Grid>}
      <Grid item>
        <KeyValuePairContainer>
          <KeyValuePair label={translate('Label.ContentMaturity')} value={experienceGuidelines} />
        </KeyValuePairContainer>
      </Grid>
    </Grid>
  );
};

export default ExperienceSummaryCardContainer;
