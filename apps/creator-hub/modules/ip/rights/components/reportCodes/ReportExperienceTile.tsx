import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import { AssetThumbnailSize, ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Button, Card, CircularProgress, Grid, Typography, makeStyles, useTheme } from '@rbx/ui';
import { CARD_BORDER_RADIUS, TILE_MEDIA_PADDING } from './contentTileStyles';

const useStyles = makeStyles()({
  thumbnailContainer: {
    display: 'block',
  },
  thumbnailImg: {
    objectFit: 'contain',
  },
});

export interface ReportExperienceTileProps {
  rootPlaceId: number;
  experienceName: string;
  isLoading: boolean;
  onReportExperience: () => void;
}

const ReportExperienceTile: FunctionComponent<ReportExperienceTileProps> = ({
  rootPlaceId,
  experienceName,
  isLoading,
  onReportExperience,
}) => {
  const theme = useTheme();
  const { classes } = useStyles();
  const { translate, ready } = useTranslation(); // assumes CreatorDashboard.RightsPortal namespace.

  if (isLoading || !ready) {
    return (
      <Grid
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
        }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: CARD_BORDER_RADIUS,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
      <Grid
        sx={{
          paddingTop: TILE_MEDIA_PADDING,
          paddingLeft: TILE_MEDIA_PADDING,
          paddingRight: TILE_MEDIA_PADDING,
          overflow: 'hidden',
          display: 'flex',
        }}
        direction='row'
        alignItems='center'
        justifyContent='center'>
        {rootPlaceId ? (
          <Grid
            sx={{
              width: '100px',
              height: '100px',
            }}>
            <Thumbnail2d
              targetId={rootPlaceId}
              // Use assetThumbnail for consistency with ContentGrid
              type={ThumbnailTypes.assetThumbnail}
              // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
              size={AssetThumbnailSize._512x512}
              alt={experienceName}
              returnPolicy={ReturnPolicy.PlaceHolder}
              includeBackground={false}
              containerClass={classes.thumbnailContainer}
              imgClassName={classes.thumbnailImg}
            />
          </Grid>
        ) : null}
      </Grid>
      <Grid
        container
        direction='column'
        alignItems='center'
        sx={{
          backgroundColor: theme.palette.surface[200],
          padding: 1.5,
          flexGrow: 1,
          textAlign: 'center',
        }}>
        <Grid
          item
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flexGrow: 1,
            gap: 1,
          }}>
          <Typography variant='h6' color='primary'>
            {translate('Title.ReportCodeCantFindContent')}
          </Typography>
          <Typography variant='caption' color='secondary' sx={{ lineHeight: 1.4 }}>
            {translate('Description.ReportCodeCantFindContent')}
          </Typography>
        </Grid>
        <Button
          variant='contained'
          color='secondary'
          size='medium'
          onClick={onReportExperience}
          disabled={!rootPlaceId}
          sx={{ mt: 1 }}>
          {translate('Action.ReportExperience')}
        </Button>
      </Grid>
    </Card>
  );
};

export default ReportExperienceTile;
