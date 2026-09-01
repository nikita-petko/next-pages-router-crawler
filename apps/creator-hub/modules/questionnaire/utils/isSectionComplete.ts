import type {
  ValidatedAnswer,
  ValidatedCheckBoxQuestion,
  ValidatedGeneralQuestion,
  ValidatedRadioButtonQuestion,
  ValidatedSection,
} from '../interfaces/types';
import { isCheckBoxQuestion, isRadioButtonQuestion } from './questionTypeGuard';

const isSectionComplete = (section: ValidatedSection, answers: ValidatedAnswer[]): boolean => {
  const answersMap = answers.reduce(
    (accumulator, { questionId, value }) => ({ ...accumulator, [questionId]: JSON.parse(value) }),
    {} as Record<string, string | string[]>,
  );

  function collectChildSections(options: Array<{ childSections?: unknown }>): ValidatedSection[] {
    return options.reduce((acc, option) => {
      const sections = (option.childSections ?? []) as ValidatedSection[];
      return [...acc, ...sections];
    }, [] as ValidatedSection[]);
  }

  function isQuestionAnswered(question: ValidatedGeneralQuestion): boolean {
    const answer = answersMap[question.id];

    if (typeof answer === 'undefined') {
      return false;
    }

    if (isCheckBoxQuestion(question)) {
      const checkboxQuestion = question as ValidatedCheckBoxQuestion;
      const answerArray = Array.isArray(answer) ? answer : [];

      if (answerArray.length === 0) {
        return false;
      }

      const selectedOptions = checkboxQuestion.options.filter(({ id }) =>
        answerArray.includes(id ?? ''),
      );

      const allChildQuestions = selectedOptions.reduce((acc, option) => {
        const childQuestions = (option.childQuestions ?? []) as ValidatedGeneralQuestion[];
        return [...acc, ...childQuestions];
      }, [] as ValidatedGeneralQuestion[]);

      const allChildSections = collectChildSections(selectedOptions);

      const childQuestionsComplete =
        allChildQuestions.length === 0 || allChildQuestions.every(isQuestionAnswered);
      const childSectionsComplete =
        allChildSections.length === 0 ||
        allChildSections.every((s) =>
          (s.questions as ValidatedGeneralQuestion[]).every(isQuestionAnswered),
        );

      return childQuestionsComplete && childSectionsComplete;
    }

    if (isRadioButtonQuestion(question)) {
      const radioQuestion = question as ValidatedRadioButtonQuestion;
      const selectedOption = radioQuestion.options.find((opt) => opt.id === answer);

      if (selectedOption) {
        const childQuestions = (selectedOption.childQuestions ?? []) as ValidatedGeneralQuestion[];
        const childSections = collectChildSections([selectedOption]);

        const childQuestionsComplete =
          childQuestions.length === 0 || childQuestions.every(isQuestionAnswered);
        const childSectionsComplete =
          childSections.length === 0 ||
          childSections.every((s) =>
            (s.questions as ValidatedGeneralQuestion[]).every(isQuestionAnswered),
          );

        return childQuestionsComplete && childSectionsComplete;
      }
    }

    return true;
  }

  const questions = section.questions as ValidatedGeneralQuestion[];
  return questions.every(isQuestionAnswered);
};

export default isSectionComplete;
