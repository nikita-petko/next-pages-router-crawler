import React, { FunctionComponent } from 'react';
import QuestionnaireCheckbox from '../components/QuestionnaireCheckbox';
import QuestionnaireRadioButton from '../components/QuestionnaireRadioButton';
import {
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
import useQuestionnaireStyles from './QuestionnaireContainer.styles';
import QuestionnaireTextbox from '../components/QuestionnaireTextbox';

export interface QuestionnaireQuestionContainerProps {
  validatedAnswers: ValidatedAnswer[];
  errors: { [key: string]: boolean };
  question: ValidatedCheckBoxQuestion | ValidatedRadioButtonQuestion | ValidatedTextBoxQuestion;
  updateAnswer: (questionId: string, value: string, unusedChildrenQuestionIds: string[]) => void;
  isSubQuestion?: boolean;
  depth?: number;
}

const QuestionnaireQuestionContainer: FunctionComponent<
  React.PropsWithChildren<QuestionnaireQuestionContainerProps>
> = ({ validatedAnswers, errors, question, updateAnswer, isSubQuestion, depth = 0 }) => {
  const {
    classes: { sectionQuestion, sectionSubQuestion },
  } = useQuestionnaireStyles();

  return (
    <section className={isSubQuestion ? sectionSubQuestion : sectionQuestion}>
      {isRadioButtonQuestion(question) && (
        <QuestionnaireRadioButton
          validatedAnswers={validatedAnswers}
          updateAnswer={updateAnswer}
          question={question}
          errors={errors}
          depth={depth}
        />
      )}
      {isCheckBoxQuestion(question) && (
        <QuestionnaireCheckbox
          validatedAnswers={validatedAnswers}
          updateAnswer={updateAnswer}
          question={question}
          errors={errors}
          depth={depth}
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
    </section>
  );
};

export default QuestionnaireQuestionContainer;
