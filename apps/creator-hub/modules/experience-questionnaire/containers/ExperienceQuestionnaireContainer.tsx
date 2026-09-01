import type { FunctionComponent } from 'react';
import React from 'react';
import { useRouter } from 'next/router';
import { StatusCodes } from '@rbx/core';
import { withTranslation } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { PageLoading } from '@modules/miscellaneous/components';
import { ErrorPage } from '@modules/miscellaneous/error';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import QuestionnaireContainer from '@modules/questionnaire/containers/QuestionnaireContainer';
import QuestionnaireContainerV2 from '@modules/questionnaire/containers/v2/QuestionnaireContainerV2';
import { useQuestionnaireStatus } from '@modules/questionnaire/utils/queries';
import NotAvailable from '../components/NotAvailable';
import NotEligible from '../components/NotEligible';
import QuestionnaireState from '../constants/questionnaireState';
import useQuestionnaireFeature from '../hooks/useQuestionnaireFeature';
import useQuestionnaireV2Gate from '../hooks/useQuestionnaireV2Gate';
import useExperienceQuestionnaireStyles from './ExperienceQuestionnaireContainer.styles';

/**
 * Owns every gate in front of the questionnaire so the page shows one loading state. The feature
 * switch, eligibility and the V2 flag are independent, so they start together rather than nesting.
 */
const ExperienceQuestionnaireContainer: FunctionComponent<React.PropsWithChildren> = () => {
  const router = useRouter();
  // A non-string `id` yields `NaN`, which the gates below treat as still loading.
  const { id } = router.query;
  const universeIdNumber = typeof id === 'string' ? parseInt(id, 10) : NaN;
  const { data: statusData, isPending: isStatusPending } = useQuestionnaireStatus();
  const { currentQuestionnaireState } = useQuestionnaireFeature(universeIdNumber);
  const { shouldUseV2, isFetched } = useQuestionnaireV2Gate();
  const {
    classes: { root },
  } = useExperienceQuestionnaireStyles();

  // An error falls through to the 404 by design: without confirmation, do not show the page. Ahead
  // of the loading gate so a disabled feature does not also wait on eligibility.
  if (!isStatusPending && statusData?.isEnabled !== true) {
    return <ErrorPage errorCode={StatusCodes.NOT_FOUND} />;
  }

  const isLoading =
    isStatusPending ||
    currentQuestionnaireState === QuestionnaireState.Loading ||
    (currentQuestionnaireState === QuestionnaireState.Enabled && !isFetched);

  // Same wrapper as the content below, where the questionnaire containers render their own
  // `PageLoading`, so the spinner never moves. Keep the duplication.
  if (isLoading) {
    return (
      <Grid className={root} container direction='column'>
        <Grid item>
          <PageLoading />
        </Grid>
      </Grid>
    );
  }

  switch (currentQuestionnaireState) {
    case QuestionnaireState.Disabled:
      return <NotAvailable />;
    case QuestionnaireState.NotEligible:
      return <NotEligible />;
    case QuestionnaireState.Forbidden:
      return <ErrorPage errorCode={StatusCodes.FORBIDDEN} />;
    case QuestionnaireState.Enabled:
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
