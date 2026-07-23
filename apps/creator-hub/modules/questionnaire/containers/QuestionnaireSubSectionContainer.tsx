import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import { CircularProgress, Step, StepLabel, Typography } from '@rbx/ui';
import type {
  ValidatedAnswer,
  ValidatedGeneralQuestion,
  ValidatedSection,
} from '../interfaces/types';
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

const QuestionnaireSubSectionContainer: FunctionComponent<
  React.PropsWithChildren<QuestionnaireSubSectionContainerProps>
> = ({
  validatedAnswers,
  errors,
  section,
  updateAnswer,
  depth = 0,
  questionComponent: QuestionComponent,
}) => {
  const [validatedQuestions, setValidatedQuestions] = useState<ValidatedGeneralQuestion[]>([]);

  useEffect(() => {
    setValidatedQuestions(validateQuestions(section.questions));
  }, [section]);

  return (
    <Step>
      <StepLabel>
        <Typography variant='h1'>{section.name}</Typography>
      </StepLabel>
      {validatedQuestions.length === 0 ? (
        <CircularProgress />
      ) : (
        validatedQuestions.map((question) => (
          <QuestionComponent
            key={question.id}
            question={question}
            updateAnswer={updateAnswer}
            validatedAnswers={validatedAnswers}
            errors={errors}
            depth={depth}
          />
        ))
      )}
    </Step>
  );
};

export default QuestionnaireSubSectionContainer;
