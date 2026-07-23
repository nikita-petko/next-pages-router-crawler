import type { FunctionComponent } from 'react';
import React from 'react';
import { CardActionArea, Typography } from '@rbx/ui';
import { useConversionTracker } from '@modules/miscellaneous/hooks';
import { CHANGELOG_TAG_VALUES } from '@modules/updates/ChangelogTags';
import type { TDevForumAnnouncement } from '../../utils/apiUtils';
import { captureHomepageEvent, EHomepageSection } from '../../utils/eventUtils';
import Card from '../common/Card';
import UpdatesMetadataRow from './UpdatesMetadataRow';
import useUpdatesTileStyles from './UpdatesTile.styles';

type TUpdatesTileProps = {
  data: TDevForumAnnouncement;
  position: number;
  disableHover?: boolean;
  isCarousel?: boolean;
  onOpen?: (data: TDevForumAnnouncement) => void;
  onHover?: (data: TDevForumAnnouncement) => void;
};

const UpdatesTile: FunctionComponent<React.PropsWithChildren<TUpdatesTileProps>> = ({
  data,
  position,
  disableHover,
  isCarousel,
  onOpen,
  onHover,
}) => {
  const { id, title, url, likeCount, postsCount, tags } = data;

  const { ref: tileRef, onConvert } = useConversionTracker<HTMLDivElement>('homeUpdatesTile', {
    additionalParams: {
      page: 'homepage',
      section: EHomepageSection.HomePageAnnouncements,
      id: id.toString(),
      position: position.toString(),
    },
  });

  const handleHover = () => {
    if (onHover) {
      onHover(data);
    }
  };

  const {
    classes: {
      card,
      cardNoHover,
      carouselCard,
      actionArea,
      tileContent,
      contentColumn,
      title: titleCls,
      carouselTitle,
      metadataRow,
      metadataItem,
      icon,
      metadataText,
      tagsRowInline,
    },
    cx,
  } = useUpdatesTileStyles();

  // Format tags
  const normalizeTag = (rawTag: string) => rawTag.toLowerCase().replaceAll(/\s+/g, '-');
  const formattedTags = Array.isArray(tags)
    ? tags
        .filter((t) => t && t.trim())
        .map((t) => normalizeTag(t.trim()))
        .filter((t) => CHANGELOG_TAG_VALUES.has(t) && t !== 'featured')
        .map((t) => `#${t}`)
    : [];

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (onOpen) {
      event.preventDefault();
    }
    onConvert('clickTile');
    captureHomepageEvent('clickTile', EHomepageSection.HomePageAnnouncements, {
      id: id.toString(),
      position: position.toString(),
    });
    if (onOpen) {
      onOpen(data);
    }
  };

  const cardContent = (
    <div className={tileContent}>
      <div className={contentColumn}>
        <Typography
          classes={{ root: isCarousel ? cx(titleCls, carouselTitle) : titleCls }}
          component='div'>
          {title}
        </Typography>
        <UpdatesMetadataRow
          likeCount={likeCount}
          postsCount={postsCount}
          tags={formattedTags}
          classes={{
            row: metadataRow,
            item: metadataItem,
            icon,
            text: metadataText,
            tagsRow: tagsRowInline,
          }}
        />
      </div>
    </div>
  );

  const cardClasses = cx(isCarousel ? carouselCard : card, disableHover && cardNoHover);

  return (
    <Card
      classes={{ root: cardClasses }}
      variant={isCarousel ? 'outlined' : undefined}
      ref={tileRef}>
      {onOpen ? (
        <CardActionArea
          classes={{ root: actionArea }}
          onClick={handleClick}
          onMouseEnter={handleHover}
          disableRipple>
          {cardContent}
        </CardActionArea>
      ) : (
        <CardActionArea
          classes={{ root: actionArea }}
          onClick={handleClick}
          onMouseEnter={handleHover}
          disableRipple
          href={url}
          target='_blank'
          rel='noreferrer noopener'>
          {cardContent}
        </CardActionArea>
      )}
    </Card>
  );
};

export default UpdatesTile;
