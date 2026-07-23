import type { FunctionComponent } from 'react';
import React from 'react';
import QuestionnaireQuestionSection from './QuestionnaireQuestionSection';
import QuestionnaireQuestionSwitch from './QuestionnaireQuestionSwitch';
import type { QuestionnaireQuestionContainerProps } from './types';

export type { QuestionnaireQuestionContainerProps } from './types';

const QuestionnaireQuestionContainer: FunctionComponent<
  React.PropsWithChildren<QuestionnaireQuestionContainerProps>
> = ({ validatedAnswers, errors, question, updateAnswer, isSubQuestion, depth = 0 }) => {
  return (
    <QuestionnaireQuestionSection isSubQuestion={isSubQuestion}>
      <QuestionnaireQuestionSwitch
        validatedAnswers={validatedAnswers}
        errors={errors}
        question={question}
        updateAnswer={updateAnswer}
        depth={depth}
        questionComponent={QuestionnaireQuestionContainer}
      />
    </QuestionnaireQuestionSection>
  );
};

export default QuestionnaireQuestionContainer;
