import React, { FunctionComponent } from 'react';
import { Typography } from '@rbx/ui';
import { V1Beta1Moderation as Moderation } from '@rbx/clients/experienceGuidelinesService';
import { useTranslation } from '@rbx/intl';
import { getFormattedDateTime } from '@rbx/core';
import useQuestionnaireProgressStyles from './QuestionnaireProgress.styles';
import ModerationDescriptorMismatch from './ModerationDescriptorMismatch';

export interface ModerationInformationProps {
  moderation: Moderation;
  isContentMaturityEnabled: boolean;
  submitBy: string;
}

const ModerationInformation: FunctionComponent<
  React.PropsWithChildren<ModerationInformationProps>
> = ({ moderation, isContentMaturityEnabled, submitBy }) => {
  const { translate } = useTranslation();
  const {
    classes: { boldText },
  } = useQuestionnaireProgressStyles();

  if (!moderation.creatorUsages || !moderation.moderatorUsages) {
    return null;
  }

  const formattedDate = submitBy ? getFormattedDateTime(new Date(submitBy)) : null;
  return (
    <div>
      {formattedDate && (
        <React.Fragment>
          <Typography>
            <b>
              {translate('Label.RetakeTime', {
                retakeDeadline: formattedDate,
              })}
            </b>
          </Typography>
          <br />
        </React.Fragment>
      )}
      <Typography>{translate('Message.UponReviewModerationText')}</Typography>
      <ul>
        {moderation.moderatorUsages.items &&
          moderation.moderatorUsages.items.length > 0 &&
          moderation.moderatorUsages.items?.map((usage) => {
            const creatorUsage = moderation.creatorUsages?.items?.find(
              (u) => u.name?.toLowerCase() === usage.name?.toLowerCase(),
            );
            const moderationReasoning = moderation.moderatorReasoning?.find(
              (u) => u.descriptorName?.toLowerCase() === usage.name?.toLowerCase(),
            );
            const header =
              usage.descriptorDisplayName?.replaceAll(/\s\(.*\)/g, '') ?? 'Unknown Descriptor'; // All descriptors are designed in the format Name (Dimension/Dimension/etc) so remove the second half: " (Dimension/Dimension/etc)" and keep "Name"

            return (
              <ModerationDescriptorMismatch
                header={header}
                creatorUsage={creatorUsage}
                moderatorUsage={usage}
                moderatorReasoning={moderationReasoning?.reasoning}
                key={usage.name}
              />
            );
          })}
      </ul>
      <div>
        <Typography className={boldText}>{translate('Title.NextStepsModeration')}</Typography>
        <ul>
          <li>
            <Typography>
              {isContentMaturityEnabled
                ? translate('Message.NextStepsModerationMaturity')
                : translate('Message.NextStepsModeration')}
            </Typography>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ModerationInformation;
