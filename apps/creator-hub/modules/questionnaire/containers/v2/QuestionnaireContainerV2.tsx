import type { FunctionComponent } from 'react';
import React, { useState } from 'react';
import { withTranslation, useLocalization, useTranslation } from '@rbx/intl';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  useAnswers,
  useLatestQuestionnaireId,
  useLatestSubmission,
  useQuestionnaire,
} from '../../utils/queries';
import QuestionnaireOverviewV2 from './QuestionnaireOverviewV2';
import QuestionnaireStepperV2 from './stepper/QuestionnaireStepperV2';

interface QuestionnaireContainerV2Props {
  universeId: number;
}

enum ViewState {
  Overview,
  Stepper,
}

const QuestionnaireContainerV2: FunctionComponent<
  React.PropsWithChildren<QuestionnaireContainerV2Props>
> = ({ universeId }) => {
  const [viewState, setViewState] = useState<ViewState>(ViewState.Overview);
  const [showSubmissionSuccessAlert, setShowSubmissionSuccessAlert] = useState(false);
  const { translate } = useTranslation();

  const { isFetched: isIXPFetched } = useIXPParameters(IXPLayers.CreatorHubNavigationUser, {
    restoreInitialValueFromCache: true,
  });

  const { isFetched } = useSettings();
  const { locale } = useLocalization();

  const {
    data: questionnaireIdData,
    isLoading: isLatestQuestionnaireIdLoading,
    isError: isLatestQuestionnaireIdError,
  } = useLatestQuestionnaireId(universeId);
  const questionnaireId = questionnaireIdData?.questionnaireId;
  const isOverEighteenQuestionnaire = questionnaireIdData?.isOverEighteenQuestionnaire ?? true;

  const { isLoading: isQuestionnaireLoading, isError: isQuestionnaireError } = useQuestionnaire(
    questionnaireId,
    locale,
  );
  const { isLoading: isAnswerLoading } = useAnswers(universeId);
  const { isLoading: isSubmissionLoading } = useLatestSubmission(universeId);

  if (
    isLatestQuestionnaireIdLoading ||
    isAnswerLoading ||
    isSubmissionLoading ||
    isQuestionnaireLoading ||
    !isIXPFetched ||
    !isFetched
  ) {
    return <PageLoading />;
  }

  if (isLatestQuestionnaireIdError || isQuestionnaireError) {
    return (
      <FailureView
        message={translate('Message.FailedToLoadPage')}
        onReload={() => window.location.reload()}
      />
    );
  }

  const handleStartQuestionnaire = () => {
    setShowSubmissionSuccessAlert(false);
    setViewState(ViewState.Stepper);
    document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo(0, 0);
  };

  const handleCancelQuestionnaire = () => {
    setViewState(ViewState.Overview);
    setShowSubmissionSuccessAlert(false);
  };

  const handleCompleteQuestionnaire = () => {
    setViewState(ViewState.Overview);
    setShowSubmissionSuccessAlert(true);
  };

  if (viewState === ViewState.Stepper) {
    return (
      <QuestionnaireStepperV2
        universeId={universeId}
        onComplete={handleCompleteQuestionnaire}
        onCancel={handleCancelQuestionnaire}
      />
    );
  }

  return (
    <QuestionnaireOverviewV2
      universeId={universeId}
      onStartQuestionnaire={handleStartQuestionnaire}
      showSubmissionSuccessAlert={showSubmissionSuccessAlert}
      onDismissSubmissionSuccessAlert={() => setShowSubmissionSuccessAlert(false)}
      isOverEighteenQuestionnaire={isOverEighteenQuestionnaire}
    />
  );
};

export default withTranslation(QuestionnaireContainerV2, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
