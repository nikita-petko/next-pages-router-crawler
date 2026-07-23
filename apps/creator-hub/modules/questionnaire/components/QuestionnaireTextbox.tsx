import React, { FunctionComponent } from 'react';
import { Grid, Input, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { TextBoxValidationType } from '@modules/clients/experienceQuestionnaire';
import {
  QuestionnaireResponseErrors,
  ValidatedAnswer,
  ValidatedTextBoxQuestion,
} from '../interfaces/types';
import QuestionnaireRequiredText from './QuestionnaireRequiredText';
import QuestionLabel from './QuestionLabel';

export interface QuestionnaireTextboxProps {
  validatedAnswers: ValidatedAnswer[];
  errors: QuestionnaireResponseErrors;
  question: ValidatedTextBoxQuestion;
  updateAnswer: (
    questionId: string,
    jsonValue: string,
    unusedChildrenQuestionIds: string[],
  ) => void;
}

const QuestionnaireTextbox: FunctionComponent<
  React.PropsWithChildren<QuestionnaireTextboxProps>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- updateAnswer will be used in the future
> = ({ validatedAnswers, question, updateAnswer, errors }) => {
  const { translate } = useTranslation();
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (question.maxInputLength === null || event.target.value.length <= question.maxInputLength) {
      throw new Error(`TextBox Questions are not currently supported`);
      // updateAnswer(question.id, JSON.stringify(event.target.value));
    }
  };

  const answer = validatedAnswers.find((ans) => ans.questionId === question.id)?.value ?? '';
  const error = !!errors[question.id];

  return (
    <section>
      <Grid container direction='column'>
        <QuestionLabel questionText={question.text} helpInfo={question.helpInfo}>
          {error && answer.length === 0 && (
            <QuestionnaireRequiredText translationKey='Message.TextBoxNotEmpty' />
          )}
          {error && question.validationType === TextBoxValidationType.Email && (
            <QuestionnaireRequiredText translationKey='Message.TextBoxNotValidEmail' />
          )}
        </QuestionLabel>
        <Grid item>
          <Input id={question.id} value={answer} onChange={handleChange} error={error} />
        </Grid>
        {question.maxInputLength && answer.length >= question.maxInputLength && (
          <Grid item>
            <Typography variant='body2' color='secondary'>
              {translate('Message.MaxLengthTextInput', {
                length: question.maxInputLength.toString(),
              })}
            </Typography>
          </Grid>
        )}
      </Grid>
    </section>
  );
};

export default QuestionnaireTextbox;
