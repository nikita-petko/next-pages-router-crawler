import type { FunctionComponent, PropsWithChildren } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { withTranslation, useLocalization } from '@rbx/intl';
import { Grid } from '@rbx/ui';
import { SCROLL_CONTAINER_ID } from '@modules/creator-hub-layout/CreatorHubLayoutInner';
import { PageLoading } from '@modules/miscellaneous/components';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import QuestionnaireAccordions from '../components/QuestionnaireAccordions';
import QuestionnaireProgress from '../components/QuestionnaireProgress';
import QuestionnaireSubmissionState from '../components/SubmissionState';
import { QUESTIONNAIRE_TRANSLATION_KEYS } from '../constants/questionnaireConstants';
import useQuestionnaireToast from '../hooks/useQuestionnaireToast';
import networkRequestManager from '../implementations/QuestionnaireNetworkRequestManager';
import type { ValidatedAnswer, QuestionnaireResponseErrors } from '../interfaces/types';
import convertToRobloxLocale from '../utils/localizationHelper';
import {
  useAnswers,
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
  const { showToastNetworkError, showToastUserError, showToastSuccess } = useQuestionnaireToast();
  const [errors, setErrors] = useState<QuestionnaireResponseErrors>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [editedAnswers, setEditedAnswers] = useState<ValidatedAnswer[] | null>(null);
  const [subPage, setSubPage] = useState<SubPage>(SubPage.Landing);
  const { locale } = useLocalization();
  const localeCode = convertToRobloxLocale(locale);
  const { settings, isFetched } = useSettings();
  const { enableContentMaturity18Plus } = settings;

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

  const { data: submissionData, isLoading: isSubmissionLoading } = useLatestSubmission(universeId);
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
    setSubPage(SubPage.Questionnaire);
    document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo(0, 0);
  };

  const handleStartQuestionnaire = () => {
    setSubPage(SubPage.Questionnaire);
    document.getElementById(SCROLL_CONTAINER_ID)?.scrollTo(0, 0);
  };

  if (
    isLatestQuestionnaireIdLoading ||
    isAnswerLoading ||
    isSubmissionLoading ||
    isQuestionnaireLoading ||
    !isFetched
  ) {
    return <PageLoading />;
  }

  return (
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

      {subPage === SubPage.Questionnaire && questionnaireData && (
        <QuestionnaireAccordions
          questionnaire={questionnaireData}
          answers={pendingAnswers}
          errors={errors}
          isSaving={isSaving}
          setAnswers={setAnswers}
          send={attemptShowPreview}
          save={attemptSave}
          goToLanding={() => setSubPage(SubPage.Landing)}
        />
      )}

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
          moveBackAScreen={() => setSubPage(SubPage.Questionnaire)}
          isContentMaturityEnabled
          isIncreaseMaturityEnabled={false}
          enableContentMaturity18Plus={enableContentMaturity18Plus}
        />
      )}
    </Grid>
  );
};

export default withTranslation(QuestionnaireContainer, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
