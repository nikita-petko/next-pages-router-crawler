import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getPrettifiedNumber } from '@rbx/core';
import { Button, Icon } from '@rbx/foundation-ui';
import { withTranslation, useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import type { CreatorUpdatesChangelogPost } from '@modules/clients/creatorUpdatesApi';
import type { TDevForumAnnouncement } from '@modules/home/utils/apiUtils';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useChangelogPostStyles from './ChangelogPost.styles';
import { CHANGELOG_TAG_VALUES } from './ChangelogTags';
import { captureUpdatesPageEvent, EUpdatesPageSection } from './eventUtils';

export type ChangelogPostAnnouncement = CreatorUpdatesChangelogPost & {
  devForumAnnouncement?: TDevForumAnnouncement;
};

type ChangelogPostProps = {
  announcement: ChangelogPostAnnouncement;
  position: number;
  getTakeaways: (announcement: ChangelogPostAnnouncement) => Promise<{
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
      id: announcement.id,
      position: position.toString(),
    },
  });
  const [takeawaysContent, setTakeawaysContent] = useState<string>('');
  const [takeawaysContentHtml, setTakeawaysContentHtml] = useState<string | null>(null);

  const {
    title,
    primaryLinkUrl,
    primaryLinkLabel,
    likeCount,
    postCount,
    tags,
    keyTakeaways,
    imageUrl,
    youtubeUrl,
  } = announcement;
  const shouldShowLikeCount = likeCount != null && likeCount > 0;
  const shouldShowPostCount = postCount != null && postCount > 0;
  const shouldShowTakeaways = takeawaysContent.length > 0;
  const shouldShowMedia = imageUrl != null || youtubeUrl != null;

  const formattedTags = Array.isArray(tags)
    ? tags
        .filter((t) => t && t.trim())
        .map((t) => t.toLowerCase().replaceAll(/\s+/g, '-'))
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
          setTakeawaysContentHtml(result.html);
        }
      } catch {
        if (isMounted) {
          setTakeawaysContent(keyTakeaways ?? '');
          setTakeawaysContentHtml(null);
        }
      }
    };

    void loadTakeaways();
    return () => {
      isMounted = false;
    };
  }, [announcement, getTakeaways, keyTakeaways]);

  return (
    <div className={classes.container} ref={postRef}>
      <Typography variant='h5' classes={{ root: classes.title }}>
        {title}
      </Typography>

      <div className={classes.postContent}>
        <div className={classes.metadataRow}>
          {shouldShowLikeCount && (
            <div className={classes.metadataItem}>
              <Icon name='icon-regular-heart' size='Small' className={classes.icon} />
              <Typography variant='body2' classes={{ root: classes.metadataText }}>
                {getPrettifiedNumber(likeCount)}
              </Typography>
            </div>
          )}
          {shouldShowPostCount && (
            <div className={classes.metadataItem}>
              <Icon
                name='icon-regular-speech-bubble-align-left'
                size='Small'
                className={classes.icon}
              />
              <Typography variant='body2' classes={{ root: classes.metadataText }}>
                {getPrettifiedNumber(postCount)}
              </Typography>
            </div>
          )}
          {formattedTags.map((tag) => (
            <Typography key={tag} variant='body2' classes={{ root: classes.metadataText }}>
              {tag}
            </Typography>
          ))}
        </div>

        {(shouldShowTakeaways || shouldShowMedia) && (
          <div className={classes.takeaways}>
            {shouldShowTakeaways && (
              <div className={cx(classes.takeawaysContent, classes.takeawaysContentRich)}>
                {takeawaysContentHtml ? (
                  /* eslint-disable-next-line react/no-danger -- DevForum cooked HTML is trusted by the legacy changelog path. */
                  <div dangerouslySetInnerHTML={{ __html: takeawaysContentHtml }} />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{takeawaysContent}</ReactMarkdown>
                )}
              </div>
            )}
            {imageUrl && (
              <div className={classes.imageWrapper}>
                <img src={imageUrl} alt={title} className={classes.image} loading='lazy' />
              </div>
            )}
            {!imageUrl && youtubeUrl && (
              <a
                className={classes.youtubeLink}
                href={youtubeUrl}
                target='_blank'
                rel='noopener noreferrer'>
                {youtubeUrl}
              </a>
            )}
          </div>
        )}
      </div>

      {primaryLinkUrl && (
        <div className={classes.actions}>
          <Button
            as='a'
            href={primaryLinkUrl}
            target='_blank'
            rel='noopener noreferrer'
            variant='SoftEmphasis'
            size='Medium'
            className={cx(classes.actionButton, classes.readActionButton)}
            onClick={() => {
              onConvert('clickViewUpdates');
              captureUpdatesPageEvent('clickViewDetails', EUpdatesPageSection.ChangelogPost, {
                id: announcement.id,
                position: position.toString(),
              });
            }}>
            <Typography variant='smallLabel1' classes={{ root: classes.actionLabelSoft }}>
              {primaryLinkLabel ?? translate('Label.ViewDetails')}
            </Typography>
          </Button>
        </div>
      )}
    </div>
  );
};

export default withTranslation(ChangelogPost, [TranslationNamespace.Home]);
