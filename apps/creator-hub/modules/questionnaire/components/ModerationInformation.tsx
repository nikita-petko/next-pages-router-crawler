import type { FunctionComponent } from 'react';
import React from 'react';
import type { V1Beta1Moderation as Moderation } from '@rbx/client-experience-guidelines-service/v1';
import { getFormattedDateTime } from '@rbx/core';
import { useTranslation } from '@rbx/intl';
import { Link, Typography } from '@rbx/ui';
import { getAppealsPortalUrl } from '@modules/miscellaneous/urls/www';
import ModerationDescriptorMismatch from './ModerationDescriptorMismatch';
import useQuestionnaireProgressStyles from './QuestionnaireProgress.styles';

export interface ModerationInformationProps {
  moderation: Moderation;
  isContentMaturityEnabled: boolean;
  submitBy: string;
}

const ModerationInformation: FunctionComponent<
  React.PropsWithChildren<ModerationInformationProps>
> = ({ moderation, isContentMaturityEnabled, submitBy }) => {
  const { translate, translateHTML } = useTranslation();
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
        <>
          <Typography>
            <b>
              {translate('Label.RetakeTime', {
                retakeDeadline: formattedDate,
              })}
            </b>
          </Typography>
          <br />
        </>
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
      <Typography>
        {translateHTML(
          'Description.ModerationRejectionAppeal' /* in TranslationNamespace.DeveloperQuestionnaire */,
          [
            {
              opening: 'violationsAppealsLinkStart',
              closing: 'violationsAppealsLinkEnd',
              content(chunks) {
                return (
                  <Link href={getAppealsPortalUrl()} target='_blank' underline='always'>
                    {chunks}
                  </Link>
                );
              },
            },
          ],
        )}
      </Typography>
      <div className='margin-top-medium'>
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
