import type { FunctionComponent, PropsWithChildren } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useFlag } from '@rbx/flags';
import { withTranslation, useLocalization } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { questionnaireSectionStepperEnabled } from '@generated/flags/contentSuitability';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import QuestionnaireAccordions from '../components/QuestionnaireAccordions';
import QuestionnaireProgress from '../components/QuestionnaireProgress';
import QuestionnaireSectionStepper from '../components/QuestionnaireSectionStepper';
import QuestionnaireSubmissionState from '../components/SubmissionState';
import { QUESTIONNAIRE_TRANSLATION_KEYS } from '../constants/questionnaireConstants';
import { QuestionnaireTelemetryProvider } from '../contexts/QuestionnaireTelemetryContext';
import useQuestionnaireAttemptTiming from '../hooks/useQuestionnaireAttemptTiming';
import useQuestionnaireFunnelAttempt from '../hooks/useQuestionnaireFunnelAttempt';
import {
  QuestionnaireSectionStepperIxpCache,
  QuestionnaireSectionStepperIxpEnrollment,
} from '../hooks/useQuestionnaireSectionStepperGate';
import useQuestionnaireTelemetry from '../hooks/useQuestionnaireTelemetry';
import useQuestionnaireToast from '../hooks/useQuestionnaireToast';
import networkRequestManager from '../implementations/QuestionnaireNetworkRequestManager';
import type { ValidatedAnswer, QuestionnaireResponseErrors } from '../interfaces/types';
import convertToRobloxLocale from '../utils/localizationHelper';
import {
  useAnswers,
  useDetailedGuidelines,
  useLatestQuestionnaireId,
  useLatestSubmission,
  useQuestionnaire,
  useSaveAnswers,
  useSubmitAnswers,
  useValidateAnswers,
} from '../utils/queries';
import QuestionnairePreviewContainer from './QuestionnairePreviewContainer';

/**
 * When this is pulled out and is reusable for other teams we will also require
 * another prop called the client which must implement our interface to work on
 * import. Universe ID will also turn into referenceId, agnostic of implementation.
 */
interface QuestionnaireContainerProps {
  universeId: number;
}

enum SubPage {
  Landing,
  Questionnaire,
  Preview,
}

const QuestionnaireContainer: FunctionComponent<PropsWithChildren<QuestionnaireContainerProps>> = ({
  universeId,
}) => {
  const router = useRouter();
  const { showToastNetworkError, showToastUserError, showToastSuccess } = useQuestionnaireToast();
  const [errors, setErrors] = useState<QuestionnaireResponseErrors>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editedAnswers, setEditedAnswers] = useState<ValidatedAnswer[] | null>(null);
  const [subPage, setSubPage] = useState<SubPage>(SubPage.Landing);
  const [hasExistingAnswersAtEntry, setHasExistingAnswersAtEntry] = useState(false);
  const [isEditingFromPreview, setIsEditingFromPreview] = useState(false);
  const priorSubPageRef = useRef(subPage);
  const { locale } = useLocalization();
  const localeCode = convertToRobloxLocale(locale);
  const explicitEntryPoint =
    typeof router.query.entryPoint === 'string' ? router.query.entryPoint : undefined;
  const { ready: isSectionStepperFlagReady, value: isSectionStepperFlagEnabled } = useFlag(
    questionnaireSectionStepperEnabled,
  );
  const isStepperExperimentEnabled = isSectionStepperFlagReady && isSectionStepperFlagEnabled;

  const setAnswers = useCallback(
    (questionId: string, answers: ValidatedAnswer[]) => {
      setEditedAnswers(answers);
      if (errors[questionId]) {
        const errorsCopy = { ...errors };
        delete errorsCopy[questionId];

        setErrors(errorsCopy);
      }
    },
    [errors],
  );

  const {
    data: questionnaireIdData,
    refetch: refetchQuestionnaireId,
    isLoading: isLatestQuestionnaireIdLoading,
  } = useLatestQuestionnaireId(universeId);
  const questionnaireId = questionnaireIdData?.questionnaireId;
  const { attemptId, completeAttempt, entryPoint, startAttempt } = useQuestionnaireFunnelAttempt({
    explicitEntryPoint,
    locale,
    questionnaireId,
    universeId,
  });

  const { data: questionnaireData, isLoading: isQuestionnaireLoading } = useQuestionnaire(
    questionnaireId,
    localeCode,
  );

  const getLatestQuestionnaireId = useCallback(async () => {
    const results = await refetchQuestionnaireId();
    return results.data?.questionnaireId;
  }, [refetchQuestionnaireId]);

  const { data: answersData, isLoading: isAnswerLoading } = useAnswers(universeId);

  const pendingAnswers = useMemo(
    () => editedAnswers ?? answersData ?? [],
    [editedAnswers, answersData],
  );

  useLayoutEffect(() => {
    if (subPage === SubPage.Questionnaire && priorSubPageRef.current !== SubPage.Questionnaire) {
      setHasExistingAnswersAtEntry(pendingAnswers.length > 0);
      setIsEditingFromPreview(priorSubPageRef.current === SubPage.Preview);
    }
    priorSubPageRef.current = subPage;
  }, [subPage, pendingAnswers]);

  const { data: submissionData, isLoading: isSubmissionLoading } = useLatestSubmission(universeId);

  // Unused here on purpose: awaiting it in this gate is what runs it alongside the queries above
  // rather than after them, and leaves `QuestionnaireProgress` with no loading state of its own.
  const { isLoading: isDetailedGuidelinesLoading } = useDetailedGuidelines(universeId);
  const {
    submissionState,
    progressState,
  }: {
    submissionState: QuestionnaireSubmissionState;
    progressState: 'submitted' | 'started' | 'not_started';
  } = useMemo(() => {
    const started = (answersData?.length ?? 0) > 0;
    if (submissionData?.submission == null) {
      return {
        submissionState: QuestionnaireSubmissionState.SubmittedNone,
        progressState: started ? 'started' : 'not_started',
      };
    }

    // Check if the latest submission was indeed for the latest questionnaire version
    if (questionnaireId === submissionData.questionnaireId) {
      return {
        submissionState: QuestionnaireSubmissionState.SubmittedCurrentVersion,
        progressState: started ? 'started' : 'submitted',
      };
    }
    return {
      submissionState: QuestionnaireSubmissionState.SubmittedOldVersion,
      progressState: started ? 'started' : 'submitted',
    };
  }, [answersData?.length, questionnaireId, submissionData]);

  const { mutateAsync: submitAnswers } = useSubmitAnswers(universeId);
  const { mutateAsync: saveAnswers } = useSaveAnswers(universeId);
  const { mutateAsync: validateAnswers } = useValidateAnswers();

  const isAttemptActive = subPage === SubPage.Questionnaire || subPage === SubPage.Preview;
  useQuestionnaireAttemptTiming(universeId, questionnaireId, isAttemptActive);

  const telemetry = useQuestionnaireTelemetry({
    attemptId,
    entryPoint,
    locale,
    questionnaireId,
    universeId,
  });

  const attemptSave = useCallback(
    async (answersToSave?: ValidatedAnswer[]): Promise<boolean> => {
      const currQuestionnaireId = await getLatestQuestionnaireId();
      if (currQuestionnaireId !== questionnaireId) {
        showToastUserError(
          QUESTIONNAIRE_TRANSLATION_KEYS.CHANGED_QUESTIONNAIRE_ID_TITLE,
          QUESTIONNAIRE_TRANSLATION_KEYS.CHANGED_QUESTIONNAIRE_ID_MESSAGE,
        );
        return false;
      }
      if (!questionnaireId) {
        showToastUserError(
          QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_TITLE,
          QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_MESSAGE,
        );
        return false;
      }

      try {
        setIsSaving(true);
        await saveAnswers({
          questionnaireId,
          answers: answersToSave ?? pendingAnswers,
        });
        return true;
      } catch (e) {
        networkRequestManager.handleNetworkRequestFailure(
          e,
          showToastUserError,
          showToastNetworkError,
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [
      getLatestQuestionnaireId,
      questionnaireId,
      showToastUserError,
      saveAnswers,
      pendingAnswers,
      showToastNetworkError,
    ],
  );

  const attemptShowPreview = useCallback(async () => {
    if (!questionnaireId) {
      showToastUserError(
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_TITLE,
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_MESSAGE,
      );
      return false;
    }

    try {
      setIsSaving(true);
      const validationResult = await validateAnswers({
        questionnaireId,
        answers: pendingAnswers,
      });
      if (validationResult.isValid !== true) {
        if (validationResult.failures != null) {
          const responseErrors: QuestionnaireResponseErrors = {};
          validationResult.failures.forEach((failure) => {
            if (failure.questionId != null) {
              responseErrors[failure.questionId] = true;
            }
          });
          setErrors(responseErrors);
          showToastUserError('Title.ValidationFailed', 'Message.ValidationFailed');
        }
        return false;
      }
      setSubPage(SubPage.Preview);
      return true;
    } catch (e) {
      networkRequestManager.handleNetworkRequestFailure(
        e,
        showToastUserError,
        showToastNetworkError,
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [questionnaireId, showToastUserError, validateAnswers, pendingAnswers, showToastNetworkError]);

  const goToQuestionnaire = useCallback(() => {
    setSubPage(SubPage.Questionnaire);
    document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo(0, 0);
  }, []);

  const goToLanding = useCallback(() => {
    setSubPage(SubPage.Landing);
  }, []);

  const handleStartQuestionnaire = useCallback(() => {
    startAttempt({ onStarted: goToQuestionnaire });
  }, [goToQuestionnaire, startAttempt]);

  const attemptSubmit = async () => {
    const currQuestionnaireId = await getLatestQuestionnaireId();
    if (currQuestionnaireId !== questionnaireId) {
      showToastUserError(
        QUESTIONNAIRE_TRANSLATION_KEYS.CHANGED_QUESTIONNAIRE_ID_TITLE,
        QUESTIONNAIRE_TRANSLATION_KEYS.CHANGED_QUESTIONNAIRE_ID_MESSAGE,
      );
      return;
    }
    if (!questionnaireId) {
      showToastUserError(
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_TITLE,
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_MESSAGE,
      );
      return;
    }

    try {
      setIsSaving(true);
      await submitAnswers({ questionnaireId, answers: pendingAnswers });
      completeAttempt();
      setEditedAnswers(null);
      showToastSuccess(true);
      setSubPage(SubPage.Landing);
    } catch (e) {
      networkRequestManager.handleNetworkRequestFailure(
        e,
        showToastUserError,
        showToastNetworkError,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const attemptEdit = async () => {
    const currQuestionnaireId = await getLatestQuestionnaireId();
    if (currQuestionnaireId !== questionnaireId) {
      showToastUserError(
        QUESTIONNAIRE_TRANSLATION_KEYS.CHANGED_QUESTIONNAIRE_ID_TITLE,
        QUESTIONNAIRE_TRANSLATION_KEYS.CHANGED_QUESTIONNAIRE_ID_MESSAGE,
      );
      return;
    }
    goToQuestionnaire();
  };

  const questionnaireFormProps = useMemo(
    () => ({
      answers: pendingAnswers,
      errors,
      isSaving,
      setAnswers,
      send: attemptShowPreview,
      save: attemptSave,
      goToLanding,
    }),
    [pendingAnswers, errors, isSaving, setAnswers, attemptShowPreview, attemptSave, goToLanding],
  );

  const showSectionStepper = (isIxpStepperEnabled: boolean, isIxpFetched: boolean): boolean =>
    isStepperExperimentEnabled && !isEditingFromPreview && isIxpFetched && isIxpStepperEnabled;

  const isWaitingForIxpAssignment = (isIxpFetched: boolean): boolean =>
    isStepperExperimentEnabled && !hasExistingAnswersAtEntry && !isIxpFetched;

  const renderQuestionnaireContent = (isIxpStepperEnabled: boolean, isIxpFetched: boolean) => (
    <Grid container flexDirection='column' gap='var(--gap-xxlarge)' maxWidth='700px'>
      {subPage === SubPage.Landing && (
        <QuestionnaireProgress
          onClick={handleStartQuestionnaire}
          universeId={universeId}
          progressState={progressState}
          submissionState={submissionState}
          isContentMaturityEnabled
          isIncreaseMaturityEnabled
        />
      )}

      {subPage === SubPage.Questionnaire &&
        questionnaireData &&
        (isWaitingForIxpAssignment(isIxpFetched) ? (
          <PageLoading />
        ) : (
          <QuestionnaireTelemetryProvider value={telemetry}>
            {showSectionStepper(isIxpStepperEnabled, isIxpFetched) ? (
              <QuestionnaireSectionStepper
                questionnaire={questionnaireData}
                {...questionnaireFormProps}
              />
            ) : (
              <QuestionnaireAccordions
                questionnaire={questionnaireData}
                {...questionnaireFormProps}
              />
            )}
          </QuestionnaireTelemetryProvider>
        ))}

      {subPage === SubPage.Preview && questionnaireId && (
        <QuestionnairePreviewContainer
          universeId={universeId}
          questionnaireId={questionnaireId}
          questionnaireResponse={{
            answers: pendingAnswers,
          }}
          onEdit={attemptEdit}
          attemptSubmit={attemptSubmit}
          isSaving={isSaving}
          moveBackAScreen={goToQuestionnaire}
          isContentMaturityEnabled
          isIncreaseMaturityEnabled={false}
        />
      )}
    </Grid>
  );

  if (
    isLatestQuestionnaireIdLoading ||
    isAnswerLoading ||
    isSubmissionLoading ||
    isQuestionnaireLoading ||
    isDetailedGuidelinesLoading ||
    !isSectionStepperFlagReady
  ) {
    return <PageLoading />;
  }

  const shouldEnrollInSectionStepperExperiment =
    isStepperExperimentEnabled && subPage === SubPage.Questionnaire && !hasExistingAnswersAtEntry;

  const shouldReadSectionStepperIxpFromCache =
    isStepperExperimentEnabled && subPage === SubPage.Questionnaire && hasExistingAnswersAtEntry;

  if (shouldEnrollInSectionStepperExperiment) {
    return (
      <QuestionnaireSectionStepperIxpEnrollment>
        {({ isSectionStepperEnabled: isIxpStepperEnabled, isFetched: isIxpFetched }) =>
          renderQuestionnaireContent(isIxpStepperEnabled, isIxpFetched)
        }
      </QuestionnaireSectionStepperIxpEnrollment>
    );
  }

  if (shouldReadSectionStepperIxpFromCache) {
    return (
      <QuestionnaireSectionStepperIxpCache>
        {({ isSectionStepperEnabled: isIxpStepperEnabled, isFetched: isIxpFetched }) =>
          renderQuestionnaireContent(isIxpStepperEnabled, isIxpFetched)
        }
      </QuestionnaireSectionStepperIxpCache>
    );
  }

  return renderQuestionnaireContent(false, true);
};

export default withTranslation(QuestionnaireContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
