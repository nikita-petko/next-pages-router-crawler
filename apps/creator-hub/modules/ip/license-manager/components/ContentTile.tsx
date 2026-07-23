import type { FunctionComponent } from 'react';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import {
  AssetThumbnailSize,
  Thumbnail2d,
  ThumbnailTypes,
  UniverseThumbnailSize,
} from '@rbx/thumbnails';
import { Typography, makeStyles } from '@rbx/ui';
import { Link } from '@modules/miscellaneous/components';
import Flex from '@modules/miscellaneous/components/Flex';

const useStyles = makeStyles()((theme) => ({
  contentContainer: {
    width: '327px',
    height: '100%',
    padding: theme.spacing(1),
    marginLeft: theme.spacing(-1), // Keeps the left-hand edge of the content still aligned with text
  },

  contentContainerWithHover: {
    width: '327px',
    height: '100%',
    padding: theme.spacing(1),
    marginLeft: theme.spacing(-1), // Keeps the left-hand edge of the content still aligned with text
    ...theme.border.radius.small,
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: theme.palette.states.hover,
    },
  },

  thumbnail: {
    ...theme.border.radius.small,
    display: 'inline-block',
  },

  thumbnailContainer: {
    ...theme.border.radius.small,
    width: '100%',
    height: 'auto',
    aspectRatio: '16/9',
    overflow: 'hidden',
    marginBottom: theme.spacing(1),
  },

  truncateText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block',
    whiteSpace: 'nowrap',
  },

  externalLinkIcon: {
    paddingTop: '5px',
  },
}));

export enum ContentType {
  Universe = 'Universe',
  License = 'License',
}

interface ThumbnailInfo {
  altText: string;
  type: ThumbnailTypes;
  size: AssetThumbnailSize | UniverseThumbnailSize;
}

const typeToThumbnailInfo: { [key in ContentType]: ThumbnailInfo } = {
  [ContentType.Universe]: {
    altText: 'Label.CreationThumbnail',
    type: ThumbnailTypes.universeThumbnail,
    // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
    size: UniverseThumbnailSize._256x144,
  },
  [ContentType.License]: {
    altText: 'Label.ListingThumbnail',
    type: ThumbnailTypes.assetThumbnail,
    // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
    size: AssetThumbnailSize._256x144,
  },
};

interface ContentTileProps {
  header: string;
  subheader: string;
  thumbnailTargetId: number;
  type: ContentType;
  link?: string;
}

/**
 * A reusable component that displays content in a tile format, typically used for displaying
 * universe or license information with thumbnails. Primarily used on agreement detail pages.
 *
 * This component is designed for displaying content items in a grid layout with:
 * - A thumbnail image
 * - Title text above the thumbnail
 * - Header and subheader text below the thumbnail
 * - Optional clickable link functionality
 *
 * The component automatically handles:
 * - Different thumbnail types and sizes based on content type
 * - Responsive layout (25% width on standard screens, 15% on XLarge screens)
 * - Text truncation for long content
 * - Hover effects when a link is provided
 * - Proper aspect ratio (16:9) for thumbnails
 *
 * @param props.title - The title text displayed above the thumbnail
 * @param props.header - The main header text displayed below the thumbnail
 * @param props.subheader - The subheader text displayed below the header
 * @param props.thumbnailTargetId - The ID used to fetch the thumbnail image
 * @param props.type - The type of content (Universe or License)
 * @param props.link - Optional URL to make the tile clickable and display a hover state
 */
export const ContentTile: FunctionComponent<ContentTileProps> = ({
  thumbnailTargetId,
  header,
  subheader,
  type,
  link,
}) => {
  const { translate } = useTranslation();
  const {
    classes: {
      contentContainer,
      contentContainerWithHover,
      thumbnail,
      thumbnailContainer,
      truncateText,
      externalLinkIcon,
    },
  } = useStyles();
  const thumbnailInfo = typeToThumbnailInfo[type];

  const content = (
    <div>
      <div className={thumbnailContainer}>
        <Thumbnail2d
          targetId={thumbnailTargetId}
          containerClass={thumbnail}
          alt={translate(thumbnailInfo.altText)}
          type={thumbnailInfo.type}
          size={thumbnailInfo.size}
        />
      </div>

      {header !== '' && (
        <div className='flex flex-row gap-xsmall'>
          <Typography variant='captionHeader' color='primary' className={truncateText}>
            {header}
          </Typography>
          {link != null && (
            <Icon
              name='icon-regular-arrow-up-right-from-square'
              size='Medium'
              className={`${externalLinkIcon} content-default`}
            />
          )}
        </div>
      )}

      {subheader !== '' && (
        <Typography variant='captionBody' color='primary' className={truncateText}>
          {subheader}
        </Typography>
      )}
    </div>
  );

  return (
    <Flex
      flexDirection='column'
      classes={{ root: link ? contentContainerWithHover : contentContainer }}>
      {link ? (
        <Link href={link} target='_blank' style={{ textDecoration: 'none' }}>
          {content}
        </Link>
      ) : (
        content
      )}
    </Flex>
  );
};
