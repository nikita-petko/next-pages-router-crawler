import React, { FunctionComponent, useMemo } from 'react';
import { Step, StepLabel, Typography } from '@rbx/ui';
import { ValidatedAnswer, ValidatedSection } from '../interfaces/types';
import { validateQuestions } from '../utils/validationHelpers';
import QuestionnaireQuestionContainer from './QuestionnaireQuestionContainer';

export interface QuestionnaireSubSectionContainerProps {
  validatedAnswers: ValidatedAnswer[];
  errors: { [key: string]: boolean };
  section: ValidatedSection;
  updateAnswer: (
    questionId: string,
    jsonValue: string,
    unusedChildrenQuestionIds: string[],
  ) => void;
  depth?: number;
}

const QuestionnaireSubSectionContainerV2: FunctionComponent<
  React.PropsWithChildren<QuestionnaireSubSectionContainerProps>
> = ({ validatedAnswers, errors, section, updateAnswer, depth = 0, ...otherProps }) => {
  const validatedQuestions = useMemo(
    () => validateQuestions(section.questions),
    [section.questions],
  );

  return (
    <Step className='margin-top-medium'>
      <StepLabel>
        <Typography variant='h6'>{section.name}</Typography>
      </StepLabel>
      {validatedQuestions.map((question) => (
        <QuestionnaireQuestionContainer
          key={question.id}
          question={question}
          updateAnswer={updateAnswer}
          validatedAnswers={validatedAnswers}
          errors={errors}
          depth={depth}
          {...otherProps}
        />
      ))}
    </Step>
  );
};

export default QuestionnaireSubSectionContainerV2;
