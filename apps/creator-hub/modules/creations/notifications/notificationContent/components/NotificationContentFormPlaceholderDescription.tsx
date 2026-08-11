import type { FC } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Typography, Link } from '@rbx/ui';
import {
  notificationContentPlayerInvitePromptDocUrl,
  notificationContentExperienceNotificationDocUrl,
} from '../../constants/notificationContent';

const NotificationContentFormPlaceholderDescription: FC<React.PropsWithChildren> = () => {
  const { translateHTML } = useTranslation();
  const UENDescriptionPlaceholderExample = translateHTML(
    'Description.Placeholder.ExampleExperienceNotification',
    [
      {
        opening: 'strongStartUserIdHighScore',
        closing: 'strongEndUserIdHighScore',
        content() {
          // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- format parameter placeholder, not translatable
          return <strong>{`{userId-highScorer}`}</strong>;
        },
      },
      {
        opening: 'strongStartPoints',
        closing: 'strongEndPoints',
        content() {
          // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- format parameter placeholder, not translatable
          return <strong>{`{points}`}</strong>;
        },
      },
    ],
  );

  const UENDescriptionPlaceholderInstruction = translateHTML(
    'Description.Placeholder.InstructionExperienceNotification',
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
      {
        opening: 'strongStartUserIdSuffix',
        closing: 'strongEndUserIdSuffix',
        content() {
          // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- format parameter placeholder, not translatable
          return <strong>{`{userId-{suffix}}`}</strong>;
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
              // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- format parameter placeholder, not translatable
              return <strong>{`{experienceName}`}</strong>;
            },
          },
          {
            opening: 'strongStartDisName',
            closing: 'strongEndDisName',
            content() {
              // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- format parameter placeholder, not translatable
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
              // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- format parameter placeholder, not translatable
              return <strong>{`{displayName}`}</strong>;
            },
          },
          {
            opening: 'strongStartExpName',
            closing: 'strongEndExpName',
            content() {
              // oxlint-disable-next-line rbx/no-hardcoded-translation-string -- format parameter placeholder, not translatable
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
