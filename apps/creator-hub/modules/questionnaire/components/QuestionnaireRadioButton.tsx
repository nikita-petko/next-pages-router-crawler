import type { FunctionComponent } from 'react';
import React from 'react';
import { Radio as FoundationRadio, RadioGroup as FoundationRadioGroup } from '@rbx/foundation-ui';
import { FormControlLabel, Grid, makeStyles, Radio, RadioGroup, Typography } from '@rbx/ui';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import QuestionnaireSubSectionContainer from '../containers/QuestionnaireSubSectionContainer';
import QuestionnaireSubSectionContainerV2 from '../containers/QuestionnaireSubSectionContainerV2';
import type { QuestionnaireQuestionComponent } from '../containers/types';
import type { ValidatedAnswer, ValidatedRadioButtonQuestion } from '../interfaces/types';
import useQuestionnaireTraverser from '../utils/useQuestionnaireTraverser';
import { validateQuestions, validateSections } from '../utils/validationHelpers';
import AnswerHelpButton from './AnswerHelpButton';
import QuestionLabel from './QuestionLabel';
import QuestionnaireRequiredText from './QuestionnaireRequiredText';

const useQuestionnaireRadioButtonStyles = makeStyles()(() => ({
  radioGroupContainer: {
    margin: 'var(--gap-medium) 0',
  },
}));

export interface QuestionnaireRadioButtonProps {
  validatedAnswers: ValidatedAnswer[];
  errors: { [key: string]: boolean };
  question: ValidatedRadioButtonQuestion;
  updateAnswer: (questionId: string, value: string, unusedChildrenQuestionIds: string[]) => void;
  depth?: number;
  questionComponent: QuestionnaireQuestionComponent;
}

const QuestionnaireRadioButton: FunctionComponent<
  React.PropsWithChildren<QuestionnaireRadioButtonProps>
> = ({
  validatedAnswers,
  question,
  updateAnswer,
  errors,
  depth = 0,
  questionComponent: QuestionComponent,
}) => {
  const { shouldUseV2 } = useQuestionnaireV2Gate();
  const { traverseQuestionsForQuestionIds, traverseSectionsForQuestionIds } =
    useQuestionnaireTraverser();
  const jsonAnswer = validatedAnswers.find((ans) => ans.questionId === question.id);
  const optionId = jsonAnswer == null ? null : JSON.parse(jsonAnswer.value);
  const error = !!errors[question.id];
  const selectedOption = question.options.find((opt) => opt.id === optionId);
  const childQuestions = validateQuestions(selectedOption?.childQuestions);
  const childSections = validateSections(selectedOption?.childSections);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const subQuestionsIds = traverseQuestionsForQuestionIds(childQuestions);
    const subSectionsQuestionIds = traverseSectionsForQuestionIds(childSections);
    updateAnswer(question.id, JSON.stringify(event.target.value), [
      ...subQuestionsIds,
      ...subSectionsQuestionIds,
    ]);
  };

  const {
    classes: { radioGroupContainer },
  } = useQuestionnaireRadioButtonStyles();

  if (shouldUseV2) {
    return (
      <section>
        <Grid container direction='column'>
          <QuestionLabel questionText={question.text} helpInfo={question.helpInfo}>
            {error && <QuestionnaireRequiredText translationKey='Message.MustChooseOption' />}
          </QuestionLabel>
          <Grid className={radioGroupContainer} item>
            <FoundationRadioGroup
              value={optionId ?? undefined}
              onValueChange={(value) => {
                const subQuestionsIds = traverseQuestionsForQuestionIds(childQuestions);
                const subSectionsQuestionIds = traverseSectionsForQuestionIds(childSections);
                updateAnswer(question.id, JSON.stringify(value), [
                  ...subQuestionsIds,
                  ...subSectionsQuestionIds,
                ]);
              }}
              size='Medium'
              placement='Start'
              className='gap-small'>
              {question.options.map((option) => (
                <div key={option.id}>
                  <FoundationRadio value={option.id ?? ''} label={option.text ?? ''} />
                  {option.helpInfo && <AnswerHelpButton helpInfo={option.helpInfo} />}
                </div>
              ))}
            </FoundationRadioGroup>
          </Grid>
        </Grid>
        {childQuestions.length > 0 &&
          childQuestions.map((childQuestion) => (
            <QuestionComponent
              key={childQuestion.id}
              validatedAnswers={validatedAnswers}
              errors={errors}
              question={childQuestion}
              updateAnswer={updateAnswer}
              depth={depth + 1}
              isSubQuestion
            />
          ))}
        {childSections.length > 0 &&
          childSections.map((childSection) => {
            return (
              <QuestionnaireSubSectionContainerV2
                validatedAnswers={validatedAnswers}
                errors={errors}
                updateAnswer={updateAnswer}
                section={childSection}
                depth={depth + 1}
                key={childSection.id}
                questionComponent={QuestionComponent}
              />
            );
          })}
      </section>
    );
  }

  return (
    <section>
      <Grid container direction='column'>
        <QuestionLabel questionText={question.text} helpInfo={question.helpInfo}>
          {error && <QuestionnaireRequiredText translationKey='Message.MustChooseOption' />}
        </QuestionLabel>
        <Grid className={radioGroupContainer} item>
          <RadioGroup name='overview' value={optionId} onChange={handleChange}>
            {question.options.map((option) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio aria-label={option.text ?? 'Error'} />}
                label={
                  <Typography variant='body1' color='primary'>
                    {option.text}
                  </Typography>
                }
              />
            ))}
          </RadioGroup>
        </Grid>
      </Grid>
      {childQuestions.length > 0 &&
        childQuestions.map((childQuestion) => (
          <QuestionComponent
            key={childQuestion.id}
            validatedAnswers={validatedAnswers}
            errors={errors}
            question={childQuestion}
            updateAnswer={updateAnswer}
            depth={depth + 1}
            isSubQuestion
          />
        ))}
      {childSections.length > 0 &&
        childSections.map((childSection) => {
          return (
            <QuestionnaireSubSectionContainer
              validatedAnswers={validatedAnswers}
              errors={errors}
              updateAnswer={updateAnswer}
              section={childSection}
              depth={depth + 1}
              key={childSection.id}
              questionComponent={QuestionComponent}
            />
          );
        })}
    </section>
  );
};

export default QuestionnaireRadioButton;
