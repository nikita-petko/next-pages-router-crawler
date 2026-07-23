import React, { FunctionComponent, Fragment, useEffect, useState } from 'react';
import { CircularProgress, Step, StepLabel, Typography } from '@rbx/ui';
import { ValidatedAnswer, ValidatedGeneralQuestion, ValidatedSection } from '../interfaces/types';
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

const QuestionnaireSubSectionContainer: FunctionComponent<
  React.PropsWithChildren<QuestionnaireSubSectionContainerProps>
> = ({ validatedAnswers, errors, section, updateAnswer, depth = 0, ...otherProps }) => {
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
        <Fragment>
          {validatedQuestions.map((question) => {
            return (
              <QuestionnaireQuestionContainer
                key={question.id}
                question={question}
                updateAnswer={updateAnswer}
                validatedAnswers={validatedAnswers}
                errors={errors}
                depth={depth}
                {...otherProps}
              />
            );
          })}
        </Fragment>
      )}
    </Step>
  );
};

export default QuestionnaireSubSectionContainer;
