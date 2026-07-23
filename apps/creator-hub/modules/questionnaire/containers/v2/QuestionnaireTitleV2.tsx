import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useQuestionnaireV2Gate from '@modules/experience-questionnaire/hooks/useQuestionnaireV2Gate';

const QuestionnaireTitleV2: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { shouldUseV2, isFetched } = useQuestionnaireV2Gate();
  const titleKey =
    shouldUseV2 && isFetched
      ? 'Heading.MaturityAndComplianceQuestionnaireV2'
      : 'Heading.MaturityAndComplianceQuestionnaire';

  return (
    <Typography variant='h3' className='block'>
      {translate(titleKey)}
    </Typography>
  );
};

export default QuestionnaireTitleV2;
