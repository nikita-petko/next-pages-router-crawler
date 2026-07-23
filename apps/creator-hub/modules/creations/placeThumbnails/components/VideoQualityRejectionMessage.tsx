import type { FC, ReactNode } from 'react';
import { useTranslation } from '@rbx/intl';
import { Grid, Link, Typography } from '@rbx/ui';
import { docs } from '@modules/miscellaneous/urls/creatorHub';

const VIDEO_QUALITY_GUIDELINES_LINK = `${docs.getUrl()}/production/publishing/thumbnails#videos`;
const ROBLOX_SUPPORT_LINK = `https://${process.env.robloxSiteDomain}/support`;

const createTranslationLinkTag = (href: string) => {
  return {
    content(chunks: ReactNode) {
      return (
        <Link href={href} target='_blank' underline='always'>
          {chunks}
        </Link>
      );
    },
  };
};

/**
 * Message to display when a video preview is rejected due to content quality.
 */
const VideoQualityRejectionMessage: FC = () => {
  const { translateHTML } = useTranslation();

  return (
    <Grid container direction='column' spacing={0.5}>
      <Grid item>
        <Typography variant='body2' color='error'>
          {translateHTML(
            // TranslationNamespace.PlaceThumbnails
            'Message.VideoRejectedVideoQualityGuidelines',
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                ...createTranslationLinkTag(VIDEO_QUALITY_GUIDELINES_LINK),
              },
            ],
          )}
        </Typography>
      </Grid>
      <Grid item>
        <Typography variant='body2' color='secondary'>
          {translateHTML(
            // TranslationNamespace.PlaceThumbnails
            'Message.VideoRejectedVideoQualitySubmitFeedback',
            [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                ...createTranslationLinkTag(ROBLOX_SUPPORT_LINK),
              },
            ],
            {
              lineBreak: <br />,
            },
          )}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default VideoQualityRejectionMessage;
