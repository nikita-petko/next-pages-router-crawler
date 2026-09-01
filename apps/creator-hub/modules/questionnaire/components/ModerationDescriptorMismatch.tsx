import type { FunctionComponent } from 'react';
import React from 'react';
import type { V1Beta1ExperienceDescriptorUsage as ExperienceDescriptorUsage } from '@rbx/client-experience-guidelines-service/v1';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import useQuestionnaireProgressStyles from './QuestionnaireProgress.styles';

export interface ModerationDescriptorMismatchProps {
  header: string;
  creatorUsage?: ExperienceDescriptorUsage;
  moderatorUsage?: ExperienceDescriptorUsage;
  moderatorReasoning?: string;
}

const ModerationDescriptorMismatch: FunctionComponent<
  React.PropsWithChildren<ModerationDescriptorMismatchProps>
> = ({ header, creatorUsage, moderatorUsage, moderatorReasoning }) => {
  const { translate } = useTranslation();
  const {
    classes: { boldText },
  } = useQuestionnaireProgressStyles();

  const creatorUsageDisplayName = creatorUsage?.contains
    ? creatorUsage?.experienceDescriptor?.displayName
    : translate('Message.NotPresentDescriptorUsage');
  const moderatorUsageDisplayName = moderatorUsage?.contains
    ? moderatorUsage?.experienceDescriptor?.displayName
    : translate('Message.NotPresentDescriptorUsage');

  if (
    creatorUsageDisplayName === moderatorUsageDisplayName ||
    !creatorUsageDisplayName ||
    !moderatorUsageDisplayName
  ) {
    return null;
  }

  return (
    <li>
      <Typography variant='body1' className={boldText}>
        {header}
      </Typography>
      <ul>
        <li>
          <Typography variant='body1'>
            {translate('Message.YourSubmissionModeration')}: {creatorUsageDisplayName}
          </Typography>
        </li>
        <li>
          <Typography variant='body1'>
            {translate('Message.ModeratorFeedbackModeration')}: {moderatorUsageDisplayName}
          </Typography>
        </li>
        {/* TODO: Add translation string for feedback reasoning */}
        {moderatorReasoning && (
          <li>
            <Typography variant='body1'>Feedback reasoning: {moderatorReasoning}</Typography>
          </li>
        )}
      </ul>
    </li>
  );
};

export default ModerationDescriptorMismatch;
