import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';

interface QuestionnaireRequiredTextProps {
  translationKey: string;
}

const QuestionnaireRequiredText: FunctionComponent<
  React.PropsWithChildren<QuestionnaireRequiredTextProps>
> = ({ translationKey }) => {
  const { translate } = useTranslation();

  return (
    <Typography variant='body2' color='error' display='block'>
      {translate(translationKey)}
    </Typography>
  );
};

export default QuestionnaireRequiredText;
