import type { FunctionComponent } from 'react';
import { Fragment } from 'react';
import QuestionnaireCheckbox from '../components/QuestionnaireCheckbox';
import QuestionnaireRadioButton from '../components/QuestionnaireRadioButton';
import QuestionnaireTextbox from '../components/QuestionnaireTextbox';
import type {
  ValidatedAnswer,
  ValidatedCheckBoxQuestion,
  ValidatedRadioButtonQuestion,
  ValidatedTextBoxQuestion,
} from '../interfaces/types';
import {
  isCheckBoxQuestion,
  isRadioButtonQuestion,
  isTextBoxQuestion,
} from '../utils/questionTypeGuard';
import type { QuestionnaireQuestionComponent } from './types';

export interface QuestionnaireQuestionSwitchProps {
  validatedAnswers: ValidatedAnswer[];
  errors: { [key: string]: boolean };
  question: ValidatedCheckBoxQuestion | ValidatedRadioButtonQuestion | ValidatedTextBoxQuestion;
  updateAnswer: (questionId: string, value: string, unusedChildrenQuestionIds: string[]) => void;
  depth?: number;
  questionComponent: QuestionnaireQuestionComponent;
}

const QuestionnaireQuestionSwitch: FunctionComponent<QuestionnaireQuestionSwitchProps> = ({
  validatedAnswers,
  errors,
  question,
  updateAnswer,
  depth = 0,
  questionComponent,
}) => {
  return (
    <>
      {isRadioButtonQuestion(question) && (
        <QuestionnaireRadioButton
          validatedAnswers={validatedAnswers}
          updateAnswer={updateAnswer}
          question={question}
          errors={errors}
          depth={depth}
          questionComponent={questionComponent}
        />
      )}
      {isCheckBoxQuestion(question) && (
        <QuestionnaireCheckbox
          validatedAnswers={validatedAnswers}
          updateAnswer={updateAnswer}
          question={question}
          errors={errors}
          depth={depth}
          questionComponent={questionComponent}
        />
      )}
      {isTextBoxQuestion(question) && (
        <QuestionnaireTextbox
          validatedAnswers={validatedAnswers}
          updateAnswer={updateAnswer}
          question={question}
          errors={errors}
        />
      )}
    </>
  );
};

export default QuestionnaireQuestionSwitch;
