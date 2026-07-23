import React from 'react';
import { Answer, Question, Questionnaire, Section } from '@modules/clients/experienceQuestionnaire';
import {
  DeepValidatedQuestionnaire,
  DeepValidateSection,
  ValidatedAnswer,
  ValidatedGeneralQuestion,
  ValidatedQuestionnaire,
  ValidatedSection,
} from '../interfaces/types';
import { isCheckBoxQuestion, isRadioButtonQuestion, isTextBoxQuestion } from './questionTypeGuard';

const validateSections = (newSections: Section[] | undefined) => {
  const initValidatedSections: ValidatedSection[] = [];
  if (newSections) {
    // See above method for comment
    const validatedSections: ValidatedSection[] = newSections.reduce((accumulator, section) => {
      if (section.id && section.name && section.questions) {
        const validatedSection: ValidatedSection = {
          id: section.id,
          name: section.name,
          description: section.description ?? null,
          questions: section.questions,
          metadata: section.metadata ?? {},
        };
        return [...accumulator, validatedSection];
      }
      return accumulator;
    }, initValidatedSections);

    return validatedSections;
  }

  return initValidatedSections;
};

const validateAndSaveQuestionnaire = (
  newQuestionnaire: Questionnaire | undefined,
  setQuestionnaire: React.Dispatch<React.SetStateAction<Required<Questionnaire> | undefined>>,
) => {
  if (
    newQuestionnaire &&
    newQuestionnaire.id &&
    newQuestionnaire.name &&
    newQuestionnaire.description
  ) {
    const validatedQuestionnaire: ValidatedQuestionnaire = {
      id: newQuestionnaire.id,
      name: newQuestionnaire.name,
      description: newQuestionnaire.description,
      sections: validateSections(newQuestionnaire.sections),
    };
    setQuestionnaire(validatedQuestionnaire);
  }
};

const validateAnswers = (answers: Answer[]): ValidatedAnswer[] => {
  return answers.reduce((accumulator, answer) => {
    if (answer.questionId && answer.value) {
      return [...accumulator, { questionId: answer.questionId, value: answer.value }];
    }
    return accumulator;
  }, [] as ValidatedAnswer[]);
};

const validateAndSaveAnswers = (
  newAnswers: Answer[],
  setValidatedAnswers: React.Dispatch<React.SetStateAction<Required<Answer>[]>>,
) => {
  if (newAnswers.length > 0) {
    setValidatedAnswers(validateAnswers(newAnswers));
  }
};

const validateQuestions = (newQuestions: Question[] | undefined) => {
  if (newQuestions) {
    // See comment in QuestionnaireContainer under validateAndSaveSectionAnswers()
    const initValidatedQuestions: ValidatedGeneralQuestion[] = [];
    const validatedQuestions: ValidatedGeneralQuestion[] = newQuestions.reduce(
      (accumulator, question) => {
        if (question.id && question.text) {
          if (isRadioButtonQuestion(question)) {
            return [
              ...accumulator,
              {
                id: question.id,
                options: question.options,
                metadata: question.metadata,
                helpInfo: question.helpInfo,
                text: question.text,
                type: question.type,
              },
            ];
          }
          if (isCheckBoxQuestion(question)) {
            return [
              ...accumulator,
              {
                id: question.id,
                options: question.options,
                metadata: question.metadata,
                helpInfo: question.helpInfo,
                text: question.text,
                type: question.type,
              },
            ];
          }
          if (isTextBoxQuestion(question)) {
            return [
              ...accumulator,
              {
                id: question.id,
                validationType: question.validationType,
                maxInputLength: question.maxInputLength,
                metadata: question.metadata,
                helpInfo: question.helpInfo,
                text: question.text,
                type: question.type,
              },
            ];
          }
        }
        return accumulator;
      },
      initValidatedQuestions,
    );

    return validatedQuestions;
  }
  return [];
};

const deepValidateSections = (sections: Section[] | undefined) => {
  const initValidatedSections: DeepValidateSection[] = [];
  if (sections) {
    const validatedSections: DeepValidateSection[] = sections.reduce((accumulator, section) => {
      if (section.id && section.name && section.questions) {
        const validatedSection: DeepValidateSection = {
          id: section.id,
          name: section.name,
          description: section.description ?? null,
          questions: validateQuestions(section.questions),
          metadata: section.metadata ?? {},
        };
        return [...accumulator, validatedSection];
      }
      return accumulator;
    }, initValidatedSections);

    return validatedSections;
  }

  return initValidatedSections;
};

const deepValidateQuestionnaire = (
  questionnaire: Questionnaire,
): DeepValidatedQuestionnaire | null => {
  if (
    questionnaire.id &&
    questionnaire.name &&
    questionnaire.sections &&
    questionnaire.description
  ) {
    return {
      id: questionnaire.id,
      name: questionnaire.name,
      description: questionnaire.description,
      sections: deepValidateSections(questionnaire.sections),
    };
  }

  return null;
};

export {
  deepValidateQuestionnaire,
  validateAnswers,
  validateAndSaveAnswers,
  validateAndSaveQuestionnaire,
  validateQuestions,
  validateSections,
};
