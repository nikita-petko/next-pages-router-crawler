import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import QuestionnaireContainer from '@modules/questionnaire/containers/QuestionnaireContainer';
import QuestionnaireContainerV2 from '@modules/questionnaire/containers/v2/QuestionnaireContainerV2';
import NotAvailable from '../components/NotAvailable';
import NotEligible from '../components/NotEligible';
import QuestionnaireState from '../constants/questionnaireState';
import useQuestionnaireFeature from '../hooks/useQuestionnaireFeature';
import useQuestionnaireV2Gate from '../hooks/useQuestionnaireV2Gate';
import useExperienceQuestionnaireStyles from './ExperienceQuestionnaireContainer.styles';

const ExperienceQuestionnaireContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const router = useRouter();
  const universeId = router.query.id as string;
  const universeIdNumber = parseInt(universeId, 10);
  const { currentQuestionnaireState } = useQuestionnaireFeature(universeIdNumber);
  const { shouldUseV2, isFetched } = useQuestionnaireV2Gate();
  const {
    classes: { root },
  } = useExperienceQuestionnaireStyles();

  switch (currentQuestionnaireState) {
    case QuestionnaireState.Loading:
      return <PageLoading />;
    case QuestionnaireState.Disabled:
      return <NotAvailable />;
    case QuestionnaireState.NotEligible:
      return <NotEligible />;
    case QuestionnaireState.Forbidden:
      return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
    case QuestionnaireState.Enabled:
      if (!isFetched) {
        return <PageLoading />;
      }

      return (
        <Grid className={root} container direction='column'>
          <Grid item>
            {shouldUseV2 ? (
              <QuestionnaireContainerV2 universeId={universeIdNumber} />
            ) : (
              <QuestionnaireContainer universeId={universeIdNumber} />
            )}
          </Grid>
        </Grid>
      );
    default:
      return <ErrorPage errorCode={StatusCodes.BAD_REQUEST} />;
  }
};

export default withTranslation(ExperienceQuestionnaireContainer, [
  TranslationNamespace.DeveloperQuestionnaire,
]);
