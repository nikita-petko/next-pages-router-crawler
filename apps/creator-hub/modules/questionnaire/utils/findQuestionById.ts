import type { Question } from '@modules/clients/experienceQuestionnaire';

type TQuestionOption = {
  childQuestions?: Question[];
};

type TQuestionWithOptions = Question & {
  options: TQuestionOption[];
};

const findQuestionById = (questions: Question[] | undefined, targetId: string): Question | null => {
  if (!questions) {
    return null;
  }

  const directMatch = questions.find((question) => question.id === targetId);
  if (directMatch) {
    return directMatch;
  }

  const questionsWithOptions = questions.filter(
    (question): question is TQuestionWithOptions => 'options' in question && !!question.options,
  );

  const childMatch = questionsWithOptions
    .flatMap((question) => question.options.filter((option) => option.childQuestions))
    .map((option) => findQuestionById(option.childQuestions, targetId))
    .find((result) => result !== null);

  return childMatch ?? null;
};

export default findQuestionById;
