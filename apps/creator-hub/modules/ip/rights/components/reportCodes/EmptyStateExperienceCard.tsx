import React, { FunctionComponent } from 'react';
import { Grid, Typography, CircularProgress, makeStyles } from '@rbx/ui';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';

const useStyles = makeStyles()({
  thumbnailContainer: {
    display: 'block',
    width: '100%',
    height: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  thumbnailImg: {
    objectFit: 'contain',
    borderRadius: '8px',
  },
});

export interface EmptyStateExperienceCardProps {
  rootPlaceId: number;
  experienceName?: string;
  creatorName?: string;
  isLoading: boolean;
}

const EmptyStateExperienceCard: FunctionComponent<EmptyStateExperienceCardProps> = ({
  rootPlaceId,
  experienceName,
  creatorName,
  isLoading,
}) => {
  const { classes } = useStyles();

  if (isLoading) {
    return (
      <Grid
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid container direction='column' alignItems='center' spacing={2} sx={{ py: 4 }}>
      <Grid
        item
        sx={{
          width: 280,
          height: 280,
        }}>
        {rootPlaceId ? (
          <Thumbnail2d
            targetId={rootPlaceId}
            // Use assetThumbnail for consistency with ContentGrid
            type={ThumbnailTypes.assetThumbnail}
            // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
            size={AssetThumbnailSize._250x250}
            alt={experienceName ?? ''}
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
            containerClass={classes.thumbnailContainer}
            imgClassName={classes.thumbnailImg}
          />
        ) : null}
      </Grid>
      <Grid item sx={{ textAlign: 'center' }}>
        <Typography variant='h5' display='block'>
          {experienceName}
        </Typography>
        {creatorName && (
          <Typography variant='body2' color='secondary' display='block' sx={{ mt: 0.5 }}>
            {creatorName}
          </Typography>
        )}
      </Grid>
    </Grid>
  );
};

export default EmptyStateExperienceCard;
