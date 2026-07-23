import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Link } from '@rbx/ui';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import {
  notificationContentPlayerInvitePromptDocUrl,
  notificationContentExperienceNotificationDocUrl,
} from '../../constants/notificationContent';

const NotificationContentFormPlaceholderDescription: FC<React.PropsWithChildren> = () => {
  const { translateHTML } = useTranslation();
  const { settings } = useSettings();
  const UENDescriptionPlaceholderExample = settings.enableUENSocialMentions
    ? translateHTML('Description.Placeholder.ExampleExperienceNotification', [
        {
          opening: 'strongStartUserIdHighScore',
          closing: 'strongEndUserIdHighScore',
          content() {
            return <strong>{`{userId-highScorer}`}</strong>;
          },
        },
        {
          opening: 'strongStartPoints',
          closing: 'strongEndPoints',
          content() {
            return <strong>{`{points}`}</strong>;
          },
        },
      ])
    : translateHTML('Description.PlaceHolder.ExampleExperienceNotificationsQuests', [
        {
          opening: 'strongStartQuestsLeft',
          closing: 'strongEndQuestsLeft',
          content() {
            return <strong>{`{questsLeft}`}</strong>;
          },
        },
        {
          opening: 'strongStartPoints',
          closing: 'strongEndPoints',
          content() {
            return <strong>{`{points}`}</strong>;
          },
        },
      ]);

  const UENDescriptionPlaceholderInstruction = settings.enableUENSocialMentions
    ? translateHTML('Description.Placeholder.InstructionExperienceNotification', [
        {
          opening: 'linkStart',
          closing: 'linkEnd',
          content(chunks) {
            return (
              <Link href={notificationContentExperienceNotificationDocUrl} target='_blank'>
                {chunks}
              </Link>
            );
          },
        },
        {
          opening: 'strongStartUserIdSuffix',
          closing: 'strongEndUserIdSuffix',
          content() {
            return <strong>{`{userId-{suffix}}`}</strong>;
          },
        },
      ])
    : translateHTML(
        'Description.Placeholder.InstructionExperienceNotificationsRestrictedDisplayNames',
        [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={notificationContentExperienceNotificationDocUrl} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
        ],
      );

  return (
    <Grid container item XSmall={12} direction='column'>
      <Typography variant='body1'>
        {translateHTML('Description.Placeholder.InstructionPlayerInvitePrompt', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content(chunks) {
              return (
                <Link href={notificationContentPlayerInvitePromptDocUrl} target='_blank'>
                  {chunks}
                </Link>
              );
            },
          },
          {
            opening: 'strongStartExpName',
            closing: 'strongEndExpName',
            content() {
              return <strong>{`{experienceName}`}</strong>;
            },
          },
          {
            opening: 'strongStartDisName',
            closing: 'strongEndDisName',
            content() {
              return <strong>{`{displayName}`}</strong>;
            },
          },
        ])}
      </Typography>
      <br />
      <Typography variant='body1'>
        {translateHTML('Description.Placeholder.ExamplePlayerInvitePrompt', [
          {
            opening: 'strongStartDisName',
            closing: 'strongEndDisName',
            content() {
              return <strong>{`{displayName}`}</strong>;
            },
          },
          {
            opening: 'strongStartExpName',
            closing: 'strongEndExpName',
            content() {
              return <strong>{`{experienceName}`}</strong>;
            },
          },
        ])}
      </Typography>
      <br />
      <Typography variant='body1'>{UENDescriptionPlaceholderInstruction}</Typography>
      <br />
      <Typography variant='body1'>{UENDescriptionPlaceholderExample}</Typography>
    </Grid>
  );
};

export default NotificationContentFormPlaceholderDescription;
