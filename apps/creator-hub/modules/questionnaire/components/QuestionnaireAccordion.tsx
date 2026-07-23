import React, { FunctionComponent } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CheckCircleOutlineIcon,
  ErrorOutlineOutlinedIcon,
  makeStyles,
  Typography,
} from '@rbx/ui';
import { Flex } from '@modules/miscellaneous/common/components';
import QuestionnaireQuestionContainer from '../containers/QuestionnaireQuestionContainer';
import type {
  QuestionnaireResponseErrors,
  ValidatedAnswer,
  ValidatedGeneralQuestion,
} from '../interfaces/types';

const useStyles = makeStyles()((theme) => ({
  accordionRoot: {
    border: 'unset',
    borderBottom: `1px solid ${theme.palette.components.divider}`,
    '&.Mui-expanded': {
      margin: 0,
    },
    '::before': {
      content: 'none',
    },
  },
  accordionSummaryContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 'var(--padding-small)',
  },
}));

type TQuestionnaireAccordionProps = {
  id: string;
  name: string;
  questions: ValidatedGeneralQuestion[];
  answers: ValidatedAnswer[];
  expanded?: boolean;
  completed?: boolean;
  violated?: boolean;
  onChange: (sectionId: string) => void;
  updateAnswer: (questionId: string, value: string, unusedChildrenQuestionIds: string[]) => void;
  errors: QuestionnaireResponseErrors;
};

const QuestionnaireAccordion: FunctionComponent<
  React.PropsWithChildren<TQuestionnaireAccordionProps>
> = ({
  questions,
  id,
  name,
  answers,
  errors,
  children,
  onChange,
  updateAnswer,
  expanded = false,
  completed = false,
  violated = false,
}) => {
  const {
    classes: { accordionRoot, accordionSummaryContent },
  } = useStyles();

  return (
    <Accordion
      square
      variant='outlined'
      expanded={expanded}
      onChange={() => onChange(id)}
      classes={{ root: accordionRoot }}>
      <AccordionSummary
        classes={{ content: accordionSummaryContent }}
        id={id}
        data-testid={`${id}-summary`}>
        <Typography variant='h5'>{name}</Typography>
        {violated && <ErrorOutlineOutlinedIcon color='error' />}
        {!violated && completed && <CheckCircleOutlineIcon color='success' />}
      </AccordionSummary>
      <AccordionDetails>
        {questions.map((question) => (
          <QuestionnaireQuestionContainer
            errors={errors}
            validatedAnswers={answers}
            key={question.id}
            question={question as ValidatedGeneralQuestion}
            updateAnswer={updateAnswer}
          />
        ))}
        <Flex gap={10}>{children}</Flex>
      </AccordionDetails>
    </Accordion>
  );
};

export default QuestionnaireAccordion;
