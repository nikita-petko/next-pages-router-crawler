import React, { useCallback } from 'react';
import { ListItemButton, ListItemAvatar, ListItemText, makeStyles } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import { EHomepageSection } from '../../utils/eventUtils';
import {
  STORIES_ASSET_BASE_PATH,
  COMMUNITY_STORIES_KEY,
  type TCommunityStory,
} from '../../constants/communityStoriesConstants';

type CommunityStoryItemProps = TCommunityStory & {
  selected: boolean;
  showStoryVideo: (videoId: string) => void;
};

const getStoryTranslationKeys = (id: string) => ({
  titleKey: `Heading.${COMMUNITY_STORIES_KEY}${id}`,
  descriptionKey: `Description.${COMMUNITY_STORIES_KEY}${id}`,
  altTextKey: `Label.${COMMUNITY_STORIES_KEY}${id}`,
});

const getStoryThumbnailSrc = (order: number) => {
  return `${STORIES_ASSET_BASE_PATH}/${COMMUNITY_STORIES_KEY}-${order < 10 ? `0${order}` : order.toString()}.webp`;
};

const useStyles = makeStyles()((theme) => ({
  story: {
    flexGrow: 1,
    gap: 12,
    padding: 8,
  },
  storyThumbnail: {
    ...theme.border.radius.medium,
    width: 63,
    height: 109,
    border: `1px solid ${theme.palette.surface.outline}`,
    verticalAlign: 'middle',
  },
}));

export default function CommunityStoryItem({
  id,
  order,
  videoId,
  selected,
  showStoryVideo,
}: CommunityStoryItemProps) {
  const { translate } = useTranslation();
  const { ref: itemRef, onConvert } = useConversionTracker<HTMLDivElement>(
    'homeCommunityStoryItem',
    {
      additionalParams: {
        page: 'homepage',
        section: EHomepageSection.CommunityStories,
        id,
      },
    },
  );

  const { titleKey, descriptionKey, altTextKey } = getStoryTranslationKeys(id);
  const thumbnailSrc = getStoryThumbnailSrc(order);

  const onClick = useCallback(() => {
    showStoryVideo(videoId);
    onConvert('clickItem');
  }, [onConvert, showStoryVideo, videoId]);

  const {
    classes: { story, storyThumbnail },
  } = useStyles();
  return (
    <ListItemButton className={story} ref={itemRef} onClick={onClick} selected={selected}>
      <ListItemAvatar>
        <img className={storyThumbnail} src={thumbnailSrc} alt={translate(altTextKey)} />
      </ListItemAvatar>
      <ListItemText primary={translate(titleKey)} secondary={translate(descriptionKey)} />
    </ListItemButton>
  );
}
