import type { ValidatedAnswer, ValidatedSection } from '../interfaces/types';
import findQuestionById from './findQuestionById';
import isSectionComplete from './isSectionComplete';
import { isCheckBoxQuestion } from './questionTypeGuard';

export const buildUpdatedAnswers = (
  answers: ValidatedAnswer[],
  questionId: string,
  value: string,
  unusedChildrenQuestionIds: string[],
): ValidatedAnswer[] => {
  const otherAnswers = answers.filter((answer) => answer.questionId !== questionId);
  const answersWithQuestionsRemoved = otherAnswers.filter(
    (answer) => !unusedChildrenQuestionIds.includes(answer.questionId),
  );

  return [...answersWithQuestionsRemoved, { questionId, value }];
};

export const shouldAutoAdvanceAfterAnswer = ({
  section,
  priorAnswers,
  newAnswers,
  questionId,
}: {
  section: ValidatedSection | undefined;
  priorAnswers: ValidatedAnswer[];
  newAnswers: ValidatedAnswer[];
  questionId: string;
}): boolean => {
  if (!section) {
    return false;
  }

  const wasComplete = isSectionComplete(section, priorAnswers);
  const isComplete = isSectionComplete(section, newAnswers);
  const answeredQuestion = findQuestionById(section.questions, questionId);

  return (
    !wasComplete && isComplete && answeredQuestion != null && !isCheckBoxQuestion(answeredQuestion)
  );
};
