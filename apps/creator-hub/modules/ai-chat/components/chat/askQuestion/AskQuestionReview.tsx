import type { FC } from 'react';
import React from 'react';
import { Button } from '@rbx/foundation-ui';
import type { QuestionAnswer } from '@modules/analytics-assistant/types/AskQuestion';
import { deriveQuestionDisplayText } from '@modules/analytics-assistant/utils/buildAskQuestionAnswer';

export interface AskQuestionReviewProps {
  answers: QuestionAnswer[];
  skippedText: string;
  continueLabel: string;
  editLabel: string;
  onContinue: () => void;
  onEdit: () => void;
}

const AskQuestionReview: FC<AskQuestionReviewProps> = ({
  answers,
  skippedText,
  continueLabel,
  editLabel,
  onContinue,
  onEdit,
}) => (
  <div className='flex flex-col gap-medium'>
    <div className='flex flex-col gap-medium'>
      {answers.map((answer) => (
        <div key={answer.questionId} className='flex flex-col gap-xxsmall'>
          <span className='text-title-small content-emphasis'>{answer.prompt}</span>
          <span className='text-body-small content-muted'>
            {deriveQuestionDisplayText(answer, skippedText)}
          </span>
        </div>
      ))}
    </div>
    <div className='flex justify-end gap-small'>
      <Button variant='Emphasis' size='Medium' onClick={onContinue}>
        {continueLabel}
      </Button>
      <Button variant='Standard' size='Medium' onClick={onEdit}>
        {editLabel}
      </Button>
    </div>
  </div>
);

export default AskQuestionReview;
