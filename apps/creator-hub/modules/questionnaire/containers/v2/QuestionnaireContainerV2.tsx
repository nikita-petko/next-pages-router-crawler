import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/router';
import { withTranslation, useLocalization, useTranslation } from '@rbx/intl';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import { PageLoading } from '@modules/miscellaneous/components';
import FailureView from '@modules/miscellaneous/components/FailureView/FailureView';
import { useIXPParameters } from '@modules/miscellaneous/hooks';
import { useUnifiedLoggerProvider } from '@modules/miscellaneous/hooks/UnifiedLoggerProvider';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  useAnswers,
  useLatestQuestionnaireId,
  useLatestSubmission,
  useQuestionnaire,
} from '../../utils/queries';
import {
  clearQuestionnaireAttemptId,
  getOrCreateQuestionnaireAttemptId,
  getQuestionnaireEntryPoint,
  logQuestionnaireStarted,
} from '../../utils/questionnaireEvents';
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
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>(ViewState.Overview);
  const [showSubmissionSuccessAlert, setShowSubmissionSuccessAlert] = useState(false);
  const [attemptId, setAttemptId] = useState('');
  const [entryPoint, setEntryPoint] = useState('');
  const { translate } = useTranslation();
  const { unifiedLogger } = useUnifiedLoggerProvider();

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

  const handleStartQuestionnaire = useCallback(() => {
    if (!questionnaireId) {
      return;
    }
    const nextAttemptId = getOrCreateQuestionnaireAttemptId(universeId, questionnaireId);
    const explicitEntryPoint =
      typeof router.query.entryPoint === 'string' ? router.query.entryPoint : undefined;
    const nextEntryPoint = getQuestionnaireEntryPoint(explicitEntryPoint);

    setAttemptId(nextAttemptId);
    setEntryPoint(nextEntryPoint);
    logQuestionnaireStarted(unifiedLogger, {
      attemptId: nextAttemptId,
      entryPoint: nextEntryPoint,
      locale,
      questionnaireId,
      universeId,
    });
    setShowSubmissionSuccessAlert(false);
    setViewState(ViewState.Stepper);
    document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo(0, 0);
  }, [locale, questionnaireId, router.query.entryPoint, unifiedLogger, universeId]);

  const handleCancelQuestionnaire = () => {
    setViewState(ViewState.Overview);
    setShowSubmissionSuccessAlert(false);
  };

  const handleCompleteQuestionnaire = () => {
    if (questionnaireId) {
      clearQuestionnaireAttemptId(universeId, questionnaireId);
    }
    setAttemptId('');
    setViewState(ViewState.Overview);
    setShowSubmissionSuccessAlert(true);
  };

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

  if (viewState === ViewState.Stepper) {
    return (
      <QuestionnaireStepperV2
        universeId={universeId}
        attemptId={attemptId}
        entryPoint={entryPoint}
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
