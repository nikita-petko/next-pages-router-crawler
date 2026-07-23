import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';

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
