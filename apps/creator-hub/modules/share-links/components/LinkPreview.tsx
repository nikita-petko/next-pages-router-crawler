import React, { FunctionComponent } from 'react';
import {
  Grid,
  IconButton,
  InfoOutlinedIcon,
  Label,
  makeStyles,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes, UniverseThumbnailSize } from '@rbx/thumbnails';
import useGetGameDetails from '@modules/react-query/games/gameQueries';
import { useTranslation } from '@rbx/intl';

type LinkPreviewProps = {
  universeId: number;
};

type LinkPreviewPresenterProps = {
  universeId: number;
  name?: string;
  description?: string;
};

const previewContainerHeight = 185;

const useLinkPreviewStyles = makeStyles()((theme) => ({
  container: {
    paddingTop: 16,
  },
  previewContainer: {
    height: previewContainerHeight,
    overflow: 'hidden',
    flexWrap: 'nowrap',
    backgroundColor: theme.palette.components.media.fill,
    ...theme.border.radius.medium,
  },
  imageContainer: {
    flex: '0 0 329px',
  },
  thumbnailContainer: {
    display: 'inline-block',
  },
  textContainer: {
    height: `calc(${previewContainerHeight}px - 16px)`,
    overflow: 'hidden',
    flexWrap: 'nowrap',
    flexDirection: 'column',
    gap: 6,
    padding: 16,
    flex: 1,
  },
  linkPreview: {
    marginBottom: 8,
  },
  linkPreviewLabel: {
    paddingRight: 0,
    paddingLeft: 0,
  },
}));

export const LinkPreviewPresenter: FunctionComponent<LinkPreviewPresenterProps> = ({
  universeId,
  description,
  name,
}) => {
  const {
    classes: {
      container,
      previewContainer,
      imageContainer,
      thumbnailContainer,
      textContainer,
      linkPreview,
      linkPreviewLabel,
    },
  } = useLinkPreviewStyles();
  const { translate } = useTranslation();

  return (
    <Grid container direction='column' columnGap={8} className={container}>
      <Grid container item direction='row' rowGap={0} className={linkPreview}>
        <Label variant='text' labelText='Link Preview' className={linkPreviewLabel} />
        <Tooltip arrow placement='top' title={translate('Label.LinkPreviewTooltip')}>
          <IconButton aria-label='affiliate-preview-info-icon' color='default' size='small'>
            <InfoOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
      <Grid container className={previewContainer}>
        <Grid className={imageContainer}>
          <Thumbnail2d
            containerClass={thumbnailContainer}
            type={ThumbnailTypes.universeThumbnail}
            targetId={universeId}
            // eslint-disable-next-line no-underscore-dangle -- This is a valid enum
            size={UniverseThumbnailSize._576x324}
            returnPolicy={ReturnPolicy.PlaceHolder}
            alt={`${name} Thumbnail`}
          />
        </Grid>
        <Grid container className={textContainer}>
          <Typography variant='body2' color='secondary'>
            roblox.com
          </Typography>
          <Typography variant='subtitle1'>{name}</Typography>
          <Typography variant='body2' color='secondary'>
            {description}
          </Typography>
        </Grid>
      </Grid>
    </Grid>
  );
};

const LinkPreview: FunctionComponent<LinkPreviewProps> = ({ universeId }) => {
  const { data } = useGetGameDetails([universeId]);

  if (!data?.data || data.data.length === 0) {
    return null;
  }

  const [details] = data.data;
  const { description, name } = details;

  return <LinkPreviewPresenter universeId={universeId} description={description} name={name} />;
};

export default LinkPreview;
