import React, { FunctionComponent, useState, useCallback, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Grid, CheckIcon } from '@rbx/ui';
import { Button } from '@rbx/foundation-ui';
import { withTranslation, useLocalization, useTranslation } from '@rbx/intl';
import { Question, Section } from '@modules/clients/experienceQuestionnaire';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { PageLoading } from '@modules/miscellaneous/common';
import {
  ValidatedAnswer,
  QuestionnaireResponseErrors,
  DeepValidatedQuestionnaire,
} from '../../../interfaces/types';
import {
  useLatestQuestionnaireId,
  useQuestionnaire,
  useAnswers,
  useSaveAnswers,
  useSubmitAnswersV2,
} from '../../../utils/queries';
import convertToRobloxLocale from '../../../utils/localizationHelper';
import QuestionnaireQuestionContainer from '../../QuestionnaireQuestionContainer';
import QuestionnaireAccordions from '../../../components/QuestionnaireAccordions';
import useQuestionnaireToast from '../../../hooks/useQuestionnaireToast';
import networkRequestManager from '../../../implementations/QuestionnaireNetworkRequestManager';
import { QUESTIONNAIRE_TRANSLATION_KEYS } from '../../../constants/questionnaireConstants';
import isSectionComplete from '../../../utils/isSectionComplete';
import getViolatedSectionIds from '../../../utils/getViolatedSectionIds';
import useQuestionnaireTraverser from '../../../utils/useQuestionnaireTraverser';
import { validateQuestions, validateSections } from '../../../utils/validationHelpers';

interface MainQuestionnaireProps {
  universeId: number;
  activeStep: number;
  onNext: () => void;
  onBack: () => void;
  onCancel: () => void;
  onComplete: (questionnaireId: string) => void;
  onActiveSectionChange?: (sectionId: string | null) => void;
  onViolation?: (isViolating: boolean, violatedIds?: Set<string>) => void;
  actionBarContainer?: HTMLElement | null;
}

const noop = () => {};

const MainQuestionnaire: FunctionComponent<MainQuestionnaireProps> = ({
  universeId,
  activeStep,
  onNext,
  onBack,
  onCancel,
  onComplete,
  onActiveSectionChange,
  onViolation,
  actionBarContainer,
}) => {
  const { translate } = useTranslation();
  const { showToastNetworkError, showToastUserError } = useQuestionnaireToast();
  const [errors, setErrors] = useState<QuestionnaireResponseErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'unsaved' | null>(null);
  const [pendingAnswers, setPendingAnswers] = useState<ValidatedAnswer[]>([]);
  const [violatedSectionIds, setViolatedSectionIds] = useState<Set<string>>(new Set());

  const { locale } = useLocalization();
  const localeCode = convertToRobloxLocale(locale);
  const { data: questionnaireIdData } = useLatestQuestionnaireId(universeId);
  const questionnaireId = questionnaireIdData?.questionnaireId;

  const { data: questionnaireData, isLoading: isQuestionnaireLoading } = useQuestionnaire(
    questionnaireId,
    localeCode,
  );

  const {
    data: answersData,
    isLoading: isAnswersLoading,
    isFetching: isAnswersFetching,
  } = useAnswers(universeId);
  const { mutateAsync: saveAnswers } = useSaveAnswers(universeId);
  const { mutateAsync: submitAnswers } = useSubmitAnswersV2(universeId);
  const { traverseQuestionsForQuestionIds, traverseSectionsForQuestionIds } =
    useQuestionnaireTraverser();

  const shouldUseAppTypeQuestion = (questionnaireData?.sections?.length ?? 0) === 1;
  const appTypeQuestion = shouldUseAppTypeQuestion
    ? questionnaireData?.sections?.[0]?.questions?.[0]
    : null;

  const appTypeQuestionStripped = useMemo(() => {
    if (!appTypeQuestion || !('options' in appTypeQuestion)) return appTypeQuestion ?? null;
    const options = (
      (
        appTypeQuestion as {
          options?: Array<{ childSections?: unknown; childQuestions?: unknown }>;
        }
      ).options ?? []
    ).map((opt) => ({
      ...opt,
      childSections: [],
      childQuestions: [],
    }));
    return { ...appTypeQuestion, options };
  }, [appTypeQuestion]);

  const selectedAppTypeOptionId = useMemo(() => {
    if (!appTypeQuestion) return null;
    const answer = pendingAnswers.find((a) => a.questionId === appTypeQuestion.id);
    return answer ? JSON.parse(answer.value) : null;
  }, [appTypeQuestion, pendingAnswers]);

  const selectedChildSections = useMemo(() => {
    if (!shouldUseAppTypeQuestion || !appTypeQuestion || !('options' in appTypeQuestion))
      return null;
    const { options } = appTypeQuestion as {
      options?: { id?: string; childSections?: unknown }[];
    };
    const option = options?.find((opt) => opt.id === selectedAppTypeOptionId);
    return (option?.childSections as DeepValidatedQuestionnaire['sections'] | undefined) ?? null;
  }, [appTypeQuestion, selectedAppTypeOptionId, shouldUseAppTypeQuestion]);

  const remainingSectionsQuestionnaire: DeepValidatedQuestionnaire | null = useMemo(() => {
    if (!questionnaireData) return null;

    if (!shouldUseAppTypeQuestion) {
      return questionnaireData;
    }

    const fallbackSections = questionnaireData.sections.slice(1);
    const sectionsToUse = selectedChildSections ?? fallbackSections;

    return {
      ...questionnaireData,
      sections: sectionsToUse,
    };
  }, [questionnaireData, selectedChildSections, shouldUseAppTypeQuestion]);

  useEffect(() => {
    if (saveStatus !== null) {
      return;
    }
    if (answersData) {
      setPendingAnswers(answersData);
    }
  }, [answersData, saveStatus]);

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
    [questionnaireId, showToastUserError, saveAnswers, pendingAnswers, showToastNetworkError],
  );

  const handleSubmit = useCallback(async () => {
    if (!questionnaireId) {
      showToastUserError(
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_TITLE,
        QUESTIONNAIRE_TRANSLATION_KEYS.MISSING_QUESTIONNAIRE_ID_MESSAGE,
      );
      return;
    }

    try {
      setIsSaving(true);
      const response = await submitAnswers({ questionnaireId, answers: pendingAnswers });

      if (response.isValid === false) {
        const failedQuestionIds = (response.failures ?? [])
          .map((f) => f.questionId)
          .filter((id): id is string => !!id);
        const violated = getViolatedSectionIds(
          remainingSectionsQuestionnaire?.sections ?? [],
          failedQuestionIds,
        );
        setViolatedSectionIds(violated);
        onViolation?.(true, violated);
        return;
      }

      onComplete(questionnaireId);
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
    questionnaireId,
    showToastUserError,
    pendingAnswers,
    showToastNetworkError,
    submitAnswers,
    onComplete,
    remainingSectionsQuestionnaire,
    onViolation,
  ]);

  const isStep0 = shouldUseAppTypeQuestion && activeStep === 0;
  const isStep1 = shouldUseAppTypeQuestion ? activeStep === 1 : activeStep === 0;

  const initialQuestion = appTypeQuestion;
  const hasAnsweredInitialQuestion = initialQuestion
    ? pendingAnswers.some((a) => a.questionId === initialQuestion.id)
    : false;

  const isMainQuestionnaireComplete = useMemo(() => {
    if (!remainingSectionsQuestionnaire) return false;
    return remainingSectionsQuestionnaire.sections.every((section) =>
      isSectionComplete(section, pendingAnswers),
    );
  }, [remainingSectionsQuestionnaire, pendingAnswers]);

  const completedSectionsCount = useMemo(() => {
    if (!remainingSectionsQuestionnaire) return 0;
    return remainingSectionsQuestionnaire.sections.filter((section) =>
      isSectionComplete(section, pendingAnswers),
    ).length;
  }, [remainingSectionsQuestionnaire, pendingAnswers]);

  const totalSectionsCount = remainingSectionsQuestionnaire?.sections.length ?? 0;

  const getSaveStatusLabel = () => {
    if (isSaving) return translate('Progress.Saving');
    if (saveStatus === 'saved') return translate('Label.Saved');
    if (saveStatus === 'unsaved') return translate('Label.UnsavedChanges');
    return null;
  };
  const saveStatusLabel = getSaveStatusLabel();

  const renderActionBar = (actions: React.ReactNode) => {
    if (!actionBarContainer) return null;
    return createPortal(
      <div className='flex justify-between items-center gap-medium padding-top-medium'>
        <div className='flex items-center gap-medium'>
          <Button variant='Utility' size='Medium' onClick={onCancel}>
            {translate('Button.Cancel')}
          </Button>
          {saveStatusLabel && (
            <span className='flex items-center gap-xsmall text-body-small content-muted'>
              {saveStatus === 'saved' && <CheckIcon fontSize='small' />}
              {saveStatusLabel}
            </span>
          )}
        </div>
        <div className='flex gap-small'>{actions}</div>
      </div>,
      actionBarContainer,
    );
  };

  const isWaitingForAnswers = isAnswersLoading || (saveStatus === null && isAnswersFetching);
  if (
    isQuestionnaireLoading ||
    isWaitingForAnswers ||
    !questionnaireData ||
    !remainingSectionsQuestionnaire
  ) {
    return <PageLoading />;
  }

  return (
    <Grid container flexDirection='column' gap='var(--gap-xxlarge)'>
      {isStep0 && initialQuestion && (
        <React.Fragment>
          <QuestionnaireQuestionContainer
            validatedAnswers={pendingAnswers}
            errors={errors}
            question={appTypeQuestionStripped ?? initialQuestion}
            updateAnswer={async (questionId: string, value: string) => {
              const currentAnswer = pendingAnswers.find((a) => a.questionId === questionId);
              const oldParsed = currentAnswer ? JSON.parse(currentAnswer.value) : null;
              const oldIds: string[] = oldParsed ? [].concat(oldParsed) : [];
              const newParsed = JSON.parse(value);
              const newIds: string[] = Array.isArray(newParsed) ? newParsed : [newParsed];
              const deselectedIds = oldIds.filter((id) => !newIds.includes(id));
              const deselectedOptions =
                appTypeQuestion && 'options' in appTypeQuestion
                  ? (
                      appTypeQuestion as {
                        options: Array<{
                          id?: string;
                          childQuestions?: Question[];
                          childSections?: Section[];
                        }>;
                      }
                    ).options.filter((opt) => deselectedIds.includes(opt.id ?? ''))
                  : [];
              const childQuestions = validateQuestions(
                deselectedOptions.flatMap((opt) => opt.childQuestions ?? []),
              );
              const childSections = validateSections(
                deselectedOptions.flatMap((opt) => opt.childSections ?? []),
              );
              const unusedIds = [
                ...traverseQuestionsForQuestionIds(childQuestions),
                ...traverseSectionsForQuestionIds(childSections),
              ];
              const otherAnswers = pendingAnswers.filter((a) => a.questionId !== questionId);
              const newAnswers = [
                ...otherAnswers.filter((a) => !unusedIds.includes(a.questionId)),
                { questionId, value },
              ];
              setAnswers(questionId, newAnswers);
              await handleSave(newAnswers);
            }}
          />
          {renderActionBar(
            <Button
              variant='Emphasis'
              size='Medium'
              onClick={onNext}
              isDisabled={!hasAnsweredInitialQuestion || isSaving}>
              {translate('Button.Continue')}
            </Button>,
          )}
        </React.Fragment>
      )}

      {isStep1 && (
        <React.Fragment>
          {translate('Progress.SectionsCompleted', {
            completed: completedSectionsCount.toString(),
            total: totalSectionsCount.toString(),
          })}
          <QuestionnaireAccordions
            questionnaire={remainingSectionsQuestionnaire}
            answers={pendingAnswers}
            errors={errors}
            isSaving={isSaving}
            setAnswers={setAnswers}
            send={noop}
            save={handleSave}
            goToLanding={noop}
            omitActionBar
            onExpandedSectionChange={onActiveSectionChange}
            violatedSectionIds={violatedSectionIds}
          />
          {renderActionBar(
            <React.Fragment>
              <Button variant='Utility' size='Medium' onClick={onBack}>
                {translate('Button.Back')}
              </Button>
              <Button
                variant='Emphasis'
                size='Medium'
                onClick={handleSubmit}
                isDisabled={!isMainQuestionnaireComplete || isSaving}
                isLoading={isSaving}>
                {translate('Button.Continue')}
              </Button>
            </React.Fragment>,
          )}
        </React.Fragment>
      )}
    </Grid>
  );
};

export default withTranslation(MainQuestionnaire, [
  TranslationNamespace.Navigation,
  TranslationNamespace.DeveloperQuestionnaire,
  TranslationNamespace.Error,
]);
