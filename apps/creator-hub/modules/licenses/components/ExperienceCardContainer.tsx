import type { FunctionComponent } from 'react';
import React, { useContext, useCallback } from 'react';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes, UniverseThumbnailSize } from '@rbx/thumbnails';
import { Grid, Skeleton, Typography, makeStyles } from '@rbx/ui';
import SelectedExperienceContext from '../context/SelectedExperienceContext';
import type { ExperienceData } from '../utils/loadExperiences';

interface ExperienceCardContainerProps {
  item: ExperienceData;
  isLoading: boolean;
}

const useStyles = makeStyles()((theme) => ({
  thumbnailContainer: {
    width: '100%',
  },
  thumbnail: {
    display: 'inline-block',
  },
  itemContainer: {
    ...theme.border.radius.small,
    backgroundColor: theme.palette.components.media.fill,
    overflow: 'hidden',
  },
  itemContainerSelected: {
    ...theme.border.radius.small,
    backgroundColor: theme.palette.components.media.fill,
    overflow: 'hidden',
    position: 'relative',

    '&:after': {
      content: '""',
      position: 'absolute',
      borderRadius: 'inherit',
      border: `4px solid ${theme.palette.actionV2.primaryBrand.containedHoverFocus}`,
      inset: '0px',
    },
  },
}));

const ExperienceCardContainer: FunctionComponent<
  React.PropsWithChildren<ExperienceCardContainerProps>
> = ({ item, isLoading }) => {
  const { selectedExperienceId, setSelectedExperienceId } = useContext(SelectedExperienceContext);
  const onClickCard = useCallback(() => {
    if (setSelectedExperienceId === null || !item.universeId) {
      return;
    }
    setSelectedExperienceId(item.universeId);
  }, [setSelectedExperienceId, item.universeId]);
  const {
    classes: { thumbnailContainer, thumbnail, itemContainer, itemContainerSelected },
  } = useStyles();

  const isSelected = selectedExperienceId === item.universeId;

  return (
    <Grid
      container
      flexDirection='column'
      className={isSelected ? itemContainerSelected : itemContainer}
      onClick={onClickCard}
      data-testid={`apply-to-license-experience-card-${item.universeId}`}>
      <Grid item className={thumbnailContainer}>
        <Thumbnail2d
          containerClass={thumbnail}
          type={ThumbnailTypes.universeThumbnail}
          // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
          size={UniverseThumbnailSize._256x144}
          targetId={item.universeId ?? 0}
          returnPolicy={ReturnPolicy.PlaceHolder}
          alt={item.name ?? ''}
          isPendingNewTarget={isLoading}
          skeletonVariant='rectangular'
          includeBackground
        />
      </Grid>
      <Grid
        item
        container
        flexDirection='column'
        paddingTop={1}
        paddingBottom={1.5}
        paddingLeft={1.5}
        paddingRight={1.5}
        height='62px'>
        <Grid item>
          {isLoading && <Skeleton animate variant='text' data-testid='Skeleton' />}
          {!isLoading && <Typography variant='h6'>{item.name}</Typography>}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ExperienceCardContainer;
