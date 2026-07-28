import { useCallback, useMemo, useState } from 'react';
import type {
  AskQuestion,
  AskQuestionAnswer,
  AskQuestionItem,
  QuestionAnswer,
} from '@modules/analytics-assistant/types/AskQuestion';
import {
  buildAskQuestionAnswer,
  buildSkippedAskQuestionAnswer,
  EMPTY_SELECTION,
  type QuestionSelection,
} from '@modules/analytics-assistant/utils/buildAskQuestionAnswer';

export interface UseAskQuestionStateResult {
  /** True when the current step is the trailing Review (present on every card). */
  isReview: boolean;
  /** The question shown on a question step; undefined on the Review step. */
  currentQuestion: AskQuestionItem | undefined;
  /** 0-based step index across [questions…, Review]. */
  stepIndex: number;
  totalQuestions: number;
  /** True when the card has more than one question (drives the pager + footer hint). */
  isPaginated: boolean;
  /** Numeric pager label (e.g. "1/3") for a question step on a paginated card; otherwise undefined. */
  pagerLabel: string | undefined;
  canGoPrevious: boolean;
  canGoNext: boolean;
  /** Local selection for the current question (empty on the Review step). */
  currentSelection: QuestionSelection;
  /** The assembled per-question answers, for the Review list. */
  reviewAnswers: QuestionAnswer[];
  /** Select/toggle an option; single-select auto-advances to the next step. */
  selectOption: (optionId: string) => void;
  /** Select the current question's option at a 0-based index (number-key shortcut). */
  selectOptionByIndex: (index: number) => void;
  setOtherText: (text: string) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  /** Submit the assembled answer (Review "Continue"). */
  submit: () => void;
  /** Return to the first question from the Review ("Edit"). */
  editFromReview: () => void;
  /** Dismiss the card: submit an all-skipped answer (close control). */
  dismiss: () => void;
}

interface UseAskQuestionStateArgs {
  askQuestion: AskQuestion;
  onSubmit: (answer: AskQuestionAnswer) => void;
}

export function useAskQuestionState({
  askQuestion,
  onSubmit,
}: UseAskQuestionStateArgs): UseAskQuestionStateResult {
  const totalQuestions = askQuestion.questions.length;
  // Steps run [0 … totalQuestions-1] for questions, then `totalQuestions` for Review.
  const reviewStepIndex = totalQuestions;
  const [stepIndex, setStepIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, QuestionSelection>>({});

  const isReview = stepIndex === reviewStepIndex;
  const currentQuestion = isReview ? undefined : askQuestion.questions[stepIndex];
  const isPaginated = totalQuestions > 1;

  const currentSelection =
    currentQuestion !== undefined
      ? (selections[currentQuestion.id] ?? EMPTY_SELECTION)
      : EMPTY_SELECTION;

  const pagerLabel = !isReview && isPaginated ? `${stepIndex + 1}/${totalQuestions}` : undefined;

  const goToNext = useCallback(() => {
    setStepIndex((index) => Math.min(index + 1, reviewStepIndex));
  }, [reviewStepIndex]);

  const goToPrevious = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const selectOption = useCallback(
    (optionId: string) => {
      if (currentQuestion === undefined) {
        return;
      }
      const question = currentQuestion;
      // Read the prior selection from the updater arg (not the render closure) so
      // batched updates to the same question can't clobber each other.
      setSelections((prev) => {
        const existing = prev[question.id] ?? EMPTY_SELECTION;
        if (question.allowMultiple) {
          // Toggle within the set; keep any free text (Other is combinable).
          const nextOptionIds = existing.optionIds.includes(optionId)
            ? existing.optionIds.filter((id) => id !== optionId)
            : [...existing.optionIds, optionId];
          return {
            ...prev,
            [question.id]: {
              optionIds: nextOptionIds,
              otherText: existing.otherText,
              skipped: false,
            },
          };
        }
        // Single-select: replace and clear the mutually-exclusive Other text.
        return { ...prev, [question.id]: { optionIds: [optionId], skipped: false } };
      });
      // Single-select auto-advances once the choice is recorded.
      if (!question.allowMultiple) {
        goToNext();
      }
    },
    [currentQuestion, goToNext],
  );

  const selectOptionByIndex = useCallback(
    (index: number) => {
      const option = currentQuestion?.options[index];
      if (option) {
        selectOption(option.id);
      }
    },
    [currentQuestion, selectOption],
  );

  const setOtherText = useCallback(
    (text: string) => {
      if (currentQuestion === undefined) {
        return;
      }
      const question = currentQuestion;
      setSelections((prev) => {
        const existing = prev[question.id] ?? EMPTY_SELECTION;
        // Single-select: typing Other is mutually exclusive with a chosen option.
        const nextOptionIds = !question.allowMultiple && text.trim() ? [] : existing.optionIds;
        return {
          ...prev,
          [question.id]: { optionIds: nextOptionIds, otherText: text, skipped: false },
        };
      });
    },
    [currentQuestion],
  );

  const submit = useCallback(() => {
    onSubmit(buildAskQuestionAnswer(askQuestion, selections));
  }, [askQuestion, onSubmit, selections]);

  const editFromReview = useCallback(() => {
    setStepIndex(0);
  }, []);

  const dismiss = useCallback(() => {
    onSubmit(buildSkippedAskQuestionAnswer(askQuestion));
  }, [askQuestion, onSubmit]);

  // Assemble the same answer shape `submit` sends, so the Review list can never
  // drift from what is actually submitted.
  const reviewAnswers = useMemo(
    () => buildAskQuestionAnswer(askQuestion, selections).answers,
    [askQuestion, selections],
  );

  return {
    isReview,
    currentQuestion,
    stepIndex,
    totalQuestions,
    isPaginated,
    pagerLabel,
    canGoPrevious: stepIndex > 0,
    canGoNext: stepIndex < reviewStepIndex,
    currentSelection,
    reviewAnswers,
    selectOption,
    selectOptionByIndex,
    setOtherText,
    goToPrevious,
    goToNext,
    submit,
    editFromReview,
    dismiss,
  };
}
