import React, { FunctionComponent, useEffect, useState } from 'react';
import { Typography } from '@rbx/ui';
import { Button, Icon } from '@rbx/foundation-ui';
import { getPrettifiedNumber } from '@rbx/core';
import type { TDevForumAnnouncement } from '@modules/home/utils/apiUtils';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { withTranslation, useTranslation } from '@rbx/intl';
import useChangelogPostStyles from './ChangelogPost.styles';
import { CHANGELOG_TAG_VALUES } from './ChangelogTags';
import { captureUpdatesPageEvent, EUpdatesPageSection } from './eventUtils';

type ChangelogPostProps = {
  announcement: TDevForumAnnouncement;
  position: number;
  getTakeaways: (announcement: TDevForumAnnouncement) => Promise<{
    content: string;
    html: string | null;
  }>;
};

const ChangelogPost: FunctionComponent<ChangelogPostProps> = ({
  announcement,
  position,
  getTakeaways,
}) => {
  const { translate } = useTranslation();
  const { classes, cx } = useChangelogPostStyles();

  const { ref: postRef, onConvert } = useConversionTracker<HTMLDivElement>('updatesChangelogPost', {
    additionalParams: {
      page: 'updates',
      section: EUpdatesPageSection.ChangelogPost,
      id: announcement.id.toString(),
      position: position.toString(),
    },
  });
  const [takeawaysContent, setTakeawaysContent] = useState<string>('');
  const [takeawaysContentHtml, setTakeawaysContentHtml] = useState<string | null>(null);

  const { title, url, likeCount, postsCount, tags, excerpt, imageUrl } = announcement;

  const formattedTags = Array.isArray(tags)
    ? tags
        .filter((t) => t && t.trim())
        .map((t) => t.toLowerCase().replace(/\s+/g, '-'))
        .filter((t) => CHANGELOG_TAG_VALUES.has(t))
        .map((t) => `#${t}`)
    : [];

  useEffect(() => {
    let isMounted = true;

    const loadTakeaways = async () => {
      try {
        const result = await getTakeaways(announcement);
        if (isMounted) {
          setTakeawaysContent(result.content);
          setTakeawaysContentHtml(result.html ?? null);
        }
      } catch {
        if (isMounted) {
          setTakeawaysContent(excerpt ?? '');
          setTakeawaysContentHtml(null);
        }
      }
    };

    loadTakeaways();
    return () => {
      isMounted = false;
    };
  }, [announcement, getTakeaways, excerpt]);

  return (
    <div className={classes.container} ref={postRef}>
      <Typography variant='h5' classes={{ root: classes.title }}>
        {title}
      </Typography>

      <div className={classes.postContent}>
        <div className={classes.metadataRow}>
          <div className={classes.metadataItem}>
            <Icon name='icon-regular-heart' size='Small' className={classes.icon} />
            <Typography variant='body2' classes={{ root: classes.metadataText }}>
              {getPrettifiedNumber(likeCount)}
            </Typography>
          </div>
          <div className={classes.metadataItem}>
            <Icon
              name='icon-regular-speech-bubble-align-left'
              size='Small'
              className={classes.icon}
            />
            <Typography variant='body2' classes={{ root: classes.metadataText }}>
              {getPrettifiedNumber(postsCount)}
            </Typography>
          </div>
          {formattedTags.map((tag) => (
            <Typography key={tag} variant='body2' classes={{ root: classes.metadataText }}>
              {tag}
            </Typography>
          ))}
        </div>

        {(takeawaysContent || imageUrl) && (
          <div className={classes.takeaways}>
            {takeawaysContent && (
              <div
                className={cx(
                  classes.takeawaysContent,
                  takeawaysContentHtml && classes.takeawaysContentRich,
                )}>
                {takeawaysContentHtml ? (
                  /* eslint-disable-next-line react/no-danger -- DevForum cooked HTML is trusted content. */
                  <div dangerouslySetInnerHTML={{ __html: takeawaysContentHtml }} />
                ) : (
                  takeawaysContent
                )}
              </div>
            )}
            {imageUrl && (
              <div className={classes.imageWrapper}>
                <img src={imageUrl} alt={title} className={classes.image} loading='lazy' />
              </div>
            )}
          </div>
        )}
      </div>

      <div className={classes.actions}>
        <Button
          as='a'
          href={url}
          target='_blank'
          rel='noopener noreferrer'
          variant='SoftEmphasis'
          size='Medium'
          className={cx(classes.actionButton, classes.readActionButton)}
          onClick={() => {
            onConvert('clickViewUpdates');
            captureUpdatesPageEvent('clickViewDetails', EUpdatesPageSection.ChangelogPost, {
              id: announcement.id.toString(),
              position: position.toString(),
            });
          }}>
          <Typography variant='smallLabel1' classes={{ root: classes.actionLabelSoft }}>
            {translate('Label.ViewDetails')}
          </Typography>
        </Button>
      </div>
    </div>
  );
};

export default withTranslation(ChangelogPost, [TranslationNamespace.Home]);
