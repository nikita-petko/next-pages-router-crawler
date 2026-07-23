import React, { FunctionComponent, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Grid, CheckIcon } from '@rbx/ui';
import { Button } from '@rbx/foundation-ui';
import { withTranslation, useLocalization, useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import { ValidatedAnswer, QuestionnaireResponseErrors } from '../../../interfaces/types';
import {
  useLatestQuestionnaireId,
  useAdditionalQuestionnaire,
  useAdditionalQuestionnaireAnswers,
  useSaveAnswers,
  useSubmitAnswersV2,
} from '../../../utils/queries';
import QuestionnaireAccordions from '../../../components/QuestionnaireAccordions';
import useQuestionnaireToast from '../../../hooks/useQuestionnaireToast';
import networkRequestManager from '../../../implementations/QuestionnaireNetworkRequestManager';
import { QUESTIONNAIRE_TRANSLATION_KEYS } from '../../../constants/questionnaireConstants';
import isSectionComplete from '../../../utils/isSectionComplete';
import getViolatedSectionIds from '../../../utils/getViolatedSectionIds';

interface AdditionalQuestionnaireProps {
  universeId: number;
  onComplete: (questionnaireId: string) => void;
  onBack: () => void;
  onCancel: () => void;
  onViolation?: (isViolating: boolean, violatedIds?: Set<string>) => void;
  actionBarContainer?: HTMLElement | null;
}

const noop = () => {};

const AdditionalQuestionnaire: FunctionComponent<AdditionalQuestionnaireProps> = ({
  universeId,
  onComplete,
  onBack,
  onCancel,
  onViolation,
  actionBarContainer,
}) => {
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { showToastNetworkError, showToastUserError } = useQuestionnaireToast();
  const [errors, setErrors] = useState<QuestionnaireResponseErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<ValidatedAnswer[]>([]);
  const [violatedSectionIds, setViolatedSectionIds] = useState<Set<string>>(new Set());

  const { data: questionnaireIdData } = useLatestQuestionnaireId(universeId);
  const questionnaireId = questionnaireIdData?.questionnaireId;

  const { data: questionnaireData, isLoading: isQuestionnaireLoading } = useAdditionalQuestionnaire(
    questionnaireId,
    universeId,
    locale,
  );
  const additionalQuestionnaireId = questionnaireData?.id;

  const {
    data: savedAnswersData,
    isLoading: isSavedAnswersLoading,
    isFetching: isSavedAnswersFetching,
  } = useAdditionalQuestionnaireAnswers(questionnaireId, universeId);

  const { mutateAsync: saveAnswers } = useSaveAnswers(universeId);
  const { mutateAsync: submitAnswers } = useSubmitAnswersV2(universeId);

  useEffect(() => {
    if (saveStatus !== null) {
      return;
    }
    if (savedAnswersData) {
      setPendingAnswers(savedAnswersData);
    }
  }, [savedAnswersData, saveStatus]);

  const setAnswers = useCallback(
    (questionId: string, answers: ValidatedAnswer[]) => {
      setPendingAnswers(answers);
      setSaveStatus('unsaved');
      if (errors[questionId]) {
        const { [questionId]: _, ...errorsCopy } = errors;
        setErrors(errorsCopy);
      }
    },
    [errors],
  );

  const handleSave = useCallback(
    async (answersToSave?: ValidatedAnswer[]): Promise<boolean> => {
      if (!additionalQuestionnaireId) {
        showToastUserError(
          QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_TITLE,
          QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_MESSAGE,
        );
        return false;
      }

      try {
        setIsSaving(true);
        await saveAnswers({
          questionnaireId: additionalQuestionnaireId,
          answers: answersToSave ?? pendingAnswers,
        });
        setSaveStatus('saved');
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
      additionalQuestionnaireId,
      showToastUserError,
      saveAnswers,
      pendingAnswers,
      showToastNetworkError,
    ],
  );

  const handleSubmit = useCallback(async () => {
    if (!additionalQuestionnaireId) {
      showToastUserError(
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_TITLE,
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_MESSAGE,
      );
      return;
    }

    try {
      setIsSaving(true);
      const response = await submitAnswers({
        questionnaireId: additionalQuestionnaireId,
        answers: pendingAnswers,
      });

      if (response.isValid === false) {
        const failedQuestionIds = (response.failures ?? [])
          .map((f) => f.questionId)
          .filter((id): id is string => !!id);
        const violated = getViolatedSectionIds(
          questionnaireData?.sections ?? [],
          failedQuestionIds,
        );
        setViolatedSectionIds(violated);
        onViolation?.(true, violated);
        return;
      }

      onComplete(additionalQuestionnaireId);
    } catch (e) {
      networkRequestManager.handleNetworkRequestFailure(
        e,
        showToastUserError,
        showToastNetworkError,
      );
    } finally {
      setIsSaving(false);
    }
  }, [
    additionalQuestionnaireId,
    showToastUserError,
    submitAnswers,
    pendingAnswers,
    showToastNetworkError,
    onComplete,
    questionnaireData,
    onViolation,
  ]);

  const isAdditionalQuestionnaireComplete = useMemo(() => {
    if (!questionnaireData) return false;
    return questionnaireData.sections.every((section) =>
      isSectionComplete(section, pendingAnswers),
    );
  }, [questionnaireData, pendingAnswers]);

  const completedSectionsCount = useMemo(() => {
    if (!questionnaireData) return 0;
    return questionnaireData.sections.filter((section) =>
      isSectionComplete(section, pendingAnswers),
    ).length;
  }, [questionnaireData, pendingAnswers]);

  const totalSectionsCount = questionnaireData?.sections.length ?? 0;

  const isWaitingForSavedAnswers =
    isSavedAnswersLoading || (saveStatus === null && isSavedAnswersFetching);
  if (isQuestionnaireLoading || isWaitingForSavedAnswers || !questionnaireData) {
    return <PageLoading />;
  }

  return (
    <Grid container flexDirection='column' gap='var(--gap-xxlarge)'>
      {translate('Progress.SectionsCompleted', {
        completed: completedSectionsCount.toString(),
        total: totalSectionsCount.toString(),
      })}
      <QuestionnaireAccordions
        questionnaire={questionnaireData}
        answers={pendingAnswers}
        errors={errors}
        isSaving={isSaving}
        setAnswers={setAnswers}
        omitActionBar
        send={noop}
        save={handleSave}
        goToLanding={noop}
        violatedSectionIds={violatedSectionIds}
      />
      {actionBarContainer &&
        createPortal(
          <div className='flex justify-between items-center gap-medium padding-top-medium'>
            <div className='flex items-center gap-medium'>
              <Button variant='Utility' size='Medium' onClick={onCancel}>
                {translate('Button.Cancel')}
              </Button>
              {isSaving && (
                <span className='text-body-small content-muted'>
                  {translate('Progress.Saving')}
                </span>
              )}
              {!isSaving && saveStatus === 'saved' && (
                <span className='flex items-center gap-xsmall text-body-small content-muted'>
                  <CheckIcon fontSize='small' />
                  {translate('Label.Saved')}
                </span>
              )}
              {!isSaving && saveStatus === 'unsaved' && (
                <span className='text-body-small content-muted'>
                  {translate('Label.UnsavedChanges')}
                </span>
              )}
            </div>
            <div className='flex gap-small'>
              <Button variant='Utility' size='Medium' onClick={onBack}>
                {translate('Button.Back')}
              </Button>
              <Button
                variant='Emphasis'
                size='Medium'
                onClick={handleSubmit}
                isDisabled={!isAdditionalQuestionnaireComplete || isSaving}
                isLoading={isSaving}>
                {translate('Button.Continue')}
              </Button>
            </div>
          </div>,
          actionBarContainer,
        )}
    </Grid>
  );
};

export default withTranslation(AdditionalQuestionnaire, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
