import {
  CheckBoxQuestion,
  Question,
  RadioButtonQuestion,
  Section,
  TextBoxQuestion,
} from '@rbx/clients/experienceQuestionnaire/v1';
import { useCallback } from 'react';
import {
  CHECKBOX_QUESTION_TYPE,
  RADIO_BUTTON_QUESTION_TYPE,
  TEXTBOX_QUESTION_TYPE,
} from '../constants/questionnaireConstants';
import { ValidatedGeneralQuestion, ValidatedSection } from '../interfaces/types';

/**
 * Traverses through the parts of the questionnaire and returns a list of question IDs of all children.
 * @returns An array of question IDs.
 */
function useQuestionnaireTraverser() {
  let visitQuestion: (question: Question) => string[];
  let visitSection: (section: Section) => string[];

  const visitTextBoxQuestion = (question: TextBoxQuestion): string[] => {
    throw new Error(
      `TextBox Questions are not supported for cleaning answers. Question ID: ${question.id}`,
    );
  };
  const visitCheckBoxQuestion = (question: CheckBoxQuestion): string[] => {
    if (!question.options) {
      return [];
    }

    const allChildQuestionIds: string[] = question.options.reduce((allChildIds, currentOption) => {
      let childrenIds: string[] = [];
      if (currentOption.childQuestions) {
        const childQuestionQuestionIds = currentOption.childQuestions.reduce(
          (accumulatedIds, currentQuestion) => [
            ...accumulatedIds,
            ...visitQuestion(currentQuestion),
          ],
          new Array<string>(),
        );
        childrenIds = [...childQuestionQuestionIds];
      }

      if (currentOption.childSections) {
        const childSectionQuestionIds = currentOption.childSections.reduce(
          (accumulatedIds, currentSection) => [...accumulatedIds, ...visitSection(currentSection)],
          new Array<string>(),
        );
        childrenIds = [...childrenIds, ...childSectionQuestionIds];
      }

      return [...allChildIds, ...childrenIds];
    }, new Array<string>());

    return allChildQuestionIds;
  };
  const visitRadioButtonQuestion = (question: RadioButtonQuestion): string[] => {
    if (!question.options) {
      return [];
    }

    const allChildQuestionIds: string[] = question.options.reduce((allChildIds, currentOption) => {
      let childrenIds: string[] = [];
      if (currentOption.childQuestions) {
        const childQuestionQuestionIds = currentOption.childQuestions.reduce(
          (accumulatedIds, currentQuestion) => [
            ...accumulatedIds,
            ...visitQuestion(currentQuestion),
          ],
          new Array<string>(),
        );
        childrenIds = [...childQuestionQuestionIds];
      }

      if (currentOption.childSections) {
        const childSectionQuestionIds = currentOption.childSections.reduce(
          (accumulatedIds, currentSection) => [...accumulatedIds, ...visitSection(currentSection)],
          new Array<string>(),
        );
        childrenIds = [...childrenIds, ...childSectionQuestionIds];
      }

      return [...allChildIds, ...childrenIds];
    }, new Array<string>());

    return allChildQuestionIds;
  };

  visitQuestion = (question: Question): string[] => {
    if (!question.id) {
      return [];
    }

    if (question.type === RADIO_BUTTON_QUESTION_TYPE) {
      return [question.id, ...visitRadioButtonQuestion(question)];
    }
    if (question.type === CHECKBOX_QUESTION_TYPE) {
      return [question.id, ...visitCheckBoxQuestion(question)];
    }
    if (question.type === TEXTBOX_QUESTION_TYPE) {
      return [question.id, ...visitTextBoxQuestion(question)];
    }
    return [question.id];
  };

  visitSection = (section: Section): string[] => {
    if (!section.questions) {
      return [];
    }
    const childQuestionIds = section.questions.reduce(
      (accumulatedIds, question) => [...accumulatedIds, ...visitQuestion(question)],
      new Array<string>(),
    );
    return childQuestionIds;
  };

  const traverseQuestionsForQuestionIds = useCallback(
    (questions: ValidatedGeneralQuestion[]) => {
      if (questions.length === 0) {
        return [];
      }

      const childQuestionIds = questions.reduce(
        (accumulatedIds, question) => [...accumulatedIds, ...visitQuestion(question)],
        new Array<string>(),
      );
      return childQuestionIds;
    },
    [visitQuestion],
  );

  const traverseSectionsForQuestionIds = useCallback(
    (sections: ValidatedSection[]) => {
      if (sections.length === 0) {
        return [];
      }

      const childQuestionIds = sections.reduce(
        (accumulatedIds, section) => [...accumulatedIds, ...visitSection(section)],
        new Array<string>(),
      );
      return childQuestionIds;
    },
    [visitSection],
  );

  return {
    traverseQuestionsForQuestionIds,
    traverseSectionsForQuestionIds,
  };
}

export default useQuestionnaireTraverser;
