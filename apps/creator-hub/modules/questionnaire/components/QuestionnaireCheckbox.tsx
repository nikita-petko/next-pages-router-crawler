import React, { FunctionComponent } from 'react';
import { Checkbox, FormControlLabel, Grid, Typography } from '@rbx/ui';
import { Checkbox as FoundationCheckbox } from '@rbx/foundation-ui';
import { Question, Section } from '@modules/clients/experienceQuestionnaire';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';
import {
  QuestionnaireResponseErrors,
  ValidatedAnswer,
  ValidatedCheckBoxQuestion,
} from '../interfaces/types';
import QuestionnaireRequiredText from './QuestionnaireRequiredText';
import QuestionnaireQuestionContainer from '../containers/QuestionnaireQuestionContainer';
import QuestionnaireSubSectionContainer from '../containers/QuestionnaireSubSectionContainer';
import QuestionnaireSubSectionContainerV2 from '../containers/QuestionnaireSubSectionContainerV2';
import { validateQuestions, validateSections } from '../utils/validationHelpers';
import QuestionLabel from './QuestionLabel';
import AnswerHelpButton from './AnswerHelpButton';
import useQuestionnaireTraverser from '../utils/useQuestionnaireTraverser';

export interface QuestionnaireCheckboxProps {
  validatedAnswers: ValidatedAnswer[];
  errors: QuestionnaireResponseErrors;
  question: ValidatedCheckBoxQuestion;
  updateAnswer: (questionId: string, values: string, unusedChildrenQuestionIds: string[]) => void;
  depth?: number;
}

const QuestionnaireCheckbox: FunctionComponent<
  React.PropsWithChildren<QuestionnaireCheckboxProps>
> = ({ validatedAnswers, errors, question, updateAnswer, depth = 0 }) => {
  const { shouldUseV2 } = useQuestionnaireV2Gate();
  const { traverseQuestionsForQuestionIds, traverseSectionsForQuestionIds } =
    useQuestionnaireTraverser();

  const parseAnswerArray = (answerValue: string | undefined): string[] => {
    if (answerValue) {
      const parsedAnswers = JSON.parse(answerValue);
      if (parsedAnswers && Array.isArray(parsedAnswers)) {
        return parsedAnswers;
      }
    }
    return [];
  };

  const answer = validatedAnswers.find((ans) => ans.questionId === question.id);
  const answers = parseAnswerArray(answer?.value);
  const error = !!errors[question.id];
  const selectedOptions = question.options.filter((opt) => answers.includes(opt.id ?? ''));
  const childQuestions = validateQuestions(
    selectedOptions.reduce((acc, option) => {
      const newQuestions = option.childQuestions ?? [];
      return [...acc, ...newQuestions];
    }, new Array<Question>()),
  );
  const childSections = validateSections(
    selectedOptions.reduce((acc, option) => {
      const newQuestions = option.childSections ?? [];
      return [...acc, ...newQuestions];
    }, new Array<Section>()),
  );

  const onUpdateAnswerCheckBox = (questionId: string, values: string[]) => {
    const deselectedOptionIds = answers.filter((id) => !values.includes(id));

    const deselectedOptions = question.options.filter((opt) =>
      deselectedOptionIds.includes(opt.id ?? ''),
    );

    const deselectedChildQuestions = validateQuestions(
      deselectedOptions.reduce((acc, option) => {
        const newQuestions = option.childQuestions ?? [];
        return [...acc, ...newQuestions];
      }, new Array<Question>()),
    );

    const deselectedChildSections = validateSections(
      deselectedOptions.reduce((acc, option) => {
        const newSections = option.childSections ?? [];
        return [...acc, ...newSections];
      }, new Array<Section>()),
    );

    const subQuestionsIds = traverseQuestionsForQuestionIds(deselectedChildQuestions);
    const subSectionsQuestionIds = traverseSectionsForQuestionIds(deselectedChildSections);

    updateAnswer(questionId, JSON.stringify(values), [
      ...subQuestionsIds,
      ...subSectionsQuestionIds,
    ]);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      onUpdateAnswerCheckBox(question.id, [...answers, event.target.name]);
    } else {
      onUpdateAnswerCheckBox(
        question.id,
        answers.filter((singleAnswer) => singleAnswer !== event.target.name),
      );
    }
  };

  if (shouldUseV2) {
    return (
      <section>
        <Grid container direction='column'>
          <QuestionLabel questionText={question.text} helpInfo={question.helpInfo}>
            {error && <QuestionnaireRequiredText translationKey='Message.MustChooseOption' />}
          </QuestionLabel>
          <div className='flex flex-col gap-small margin-top-small'>
            {question.options.map((option) => (
              <div key={option.id}>
                <FoundationCheckbox
                  label={option.text ?? ''}
                  size='Medium'
                  placement='Start'
                  isChecked={answers && option.id ? answers.includes(option.id) : false}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onUpdateAnswerCheckBox(question.id, [...answers, option.id ?? '']);
                    } else {
                      onUpdateAnswerCheckBox(
                        question.id,
                        answers.filter((singleAnswer) => singleAnswer !== option.id),
                      );
                    }
                  }}
                />
                {option.helpInfo && <AnswerHelpButton helpInfo={option.helpInfo} />}
              </div>
            ))}
          </div>
        </Grid>
        {childQuestions.length > 0 &&
          childQuestions.map((childQuestion) => {
            return (
              <QuestionnaireQuestionContainer
                validatedAnswers={validatedAnswers}
                errors={errors}
                question={childQuestion}
                updateAnswer={updateAnswer}
                key={childQuestion.id}
                isSubQuestion
                depth={depth + 1}
              />
            );
          })}
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
        {question.options.map((option) => (
          <FormControlLabel
            key={option.id}
            value={option.id}
            control={
              <Checkbox
                checked={answers && option.id ? answers.includes(option.id) : false}
                onChange={handleChange}
                name={option.id}
              />
            }
            label={
              <Typography variant='body1' color='primary'>
                {option.text}
              </Typography>
            }
          />
        ))}
      </Grid>
      {childQuestions.length > 0 &&
        childQuestions.map((childQuestion) => {
          return (
            <QuestionnaireQuestionContainer
              validatedAnswers={validatedAnswers}
              errors={errors}
              question={childQuestion}
              updateAnswer={updateAnswer}
              key={childQuestion.id}
              isSubQuestion
              depth={depth + 1}
            />
          );
        })}
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
            />
          );
        })}
    </section>
  );
};

export default QuestionnaireCheckbox;
