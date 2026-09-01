import type { FunctionComponent } from 'react';
import React, { useMemo } from 'react';
import { Step, StepLabel, Typography } from '@rbx/ui';
import type { ValidatedAnswer, ValidatedSection } from '../interfaces/types';
import { validateQuestions } from '../utils/validationHelpers';
import type { QuestionnaireQuestionComponent } from './types';

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
  questionComponent: QuestionnaireQuestionComponent;
}

const QuestionnaireSubSectionContainerV2: FunctionComponent<
  React.PropsWithChildren<QuestionnaireSubSectionContainerProps>
> = ({
  validatedAnswers,
  errors,
  section,
  updateAnswer,
  depth = 0,
  questionComponent: QuestionComponent,
}) => {
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
        <QuestionComponent
          key={question.id}
          question={question}
          updateAnswer={updateAnswer}
          validatedAnswers={validatedAnswers}
          errors={errors}
          depth={depth}
        />
      ))}
    </Step>
  );
};

export default QuestionnaireSubSectionContainerV2;
