import { Question } from '@modules/clients/experienceQuestionnaire';
import {
  CHECKBOX_QUESTION_TYPE,
  RADIO_BUTTON_QUESTION_TYPE,
  TEXTBOX_QUESTION_TYPE,
} from '../constants/questionnaireConstants';
import {
  ValidatedCheckBoxQuestion,
  ValidatedRadioButtonQuestion,
  ValidatedTextBoxQuestion,
} from '../interfaces/types';

export const isRadioButtonQuestion = (
  questionObject: Question,
): questionObject is ValidatedRadioButtonQuestion => {
  return questionObject.type === RADIO_BUTTON_QUESTION_TYPE;
};

export const isCheckBoxQuestion = (
  questionObject: Question,
): questionObject is ValidatedCheckBoxQuestion => {
  return questionObject.type === CHECKBOX_QUESTION_TYPE;
};

export const isTextBoxQuestion = (
  questionObject: Question,
): questionObject is ValidatedTextBoxQuestion => {
  return questionObject.type === TEXTBOX_QUESTION_TYPE;
};
