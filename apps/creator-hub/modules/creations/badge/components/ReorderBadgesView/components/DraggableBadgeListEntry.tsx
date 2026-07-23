import React, { FunctionComponent, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { Divider, Grid, Typography, IconButton, DragHandleIcon, ListItemButton } from '@rbx/ui';

import { OverviewThumbnailContainer } from '@modules/creations/common';
import { Draggable } from '@hello-pangea/dnd';
import useDraggableListEntryStyles from './DraggableBadgeListEntry.style';

export interface BadgesListEntryParameters {
  isReordering: boolean;
  index: number;
  badge: {
    id: number;
    name: string;
    isActive: boolean;
  };
}

const BadgesList: FunctionComponent<React.PropsWithChildren<BadgesListEntryParameters>> = (
  props,
) => {
  const { translate } = useTranslation();
  const { classes: styles } = useDraggableListEntryStyles();
  const { badge, index, isReordering } = props;

  const handleDragHandle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    [],
  );

  return (
    <Draggable draggableId={badge.id.toString()} key={badge.id.toString()} index={index}>
      {(provided) => (
        <ListItemButton
          disabled={isReordering}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}>
          <Divider className={styles.divider} />
          <Grid
            container
            direction='row'
            justifyContent='space-between'
            sx={{ display: 'flex', flexWrap: 'nowrap' }}>
            <Grid item>
              <Grid container direction='row' sx={{ display: 'flex', flexWrap: 'nowrap' }}>
                <Grid item width={50} className={styles.icon}>
                  <OverviewThumbnailContainer
                    type={ThumbnailTypes.badgeIcon}
                    targetId={badge.id ?? 0}
                    alt={badge.name ?? ''}
                  />
                </Grid>
                <Grid item alignContent='center'>
                  <Grid item>
                    <Typography className={styles.badgeNameTypography} noWrap variant='body2'>
                      {badge.name}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant='body2' color={badge.isActive ? 'success' : 'secondary'}>
                      {translate(badge.isActive ? 'Label.Active' : 'Label.Inactive')}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
            <Grid item>
              <Grid
                container
                justifyContent='space-between'
                direction='row'
                alignContent='center'
                sx={{ display: 'flex', flexWrap: 'nowrap' }}>
                <Grid item>
                  <IconButton
                    data-testid={`drag-handle-${badge.id}`}
                    edge='end'
                    aria-label='drag-handle'
                    disableFocusRipple
                    disableRipple
                    disableTouchRipple
                    onClick={handleDragHandle}
                    color='secondary'
                    {...provided.dragHandleProps}
                    size='large'>
                    <DragHandleIcon />
                  </IconButton>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </ListItemButton>
      )}
    </Draggable>
  );
};

export default BadgesList;
