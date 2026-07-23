import type { FunctionComponent } from 'react';
import React, { useCallback } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { Divider, Grid, Typography, IconButton, ListItemButton, Tooltip } from '@rbx/ui';
import ItemCardActivity from '../../../../common/components/ItemCardActivity';
import OverviewThumbnailContainer from '../../../../common/containers/OverviewThumbnailContainer';
import useDraggableListEntryStyles from './DraggableBadgeListEntry.style';

export interface BadgesListEntryParameters {
  isReordering: boolean;
  index: number;
  badge: {
    id: number;
    name: string;
    isActive: boolean;
  };
  isInBatch?: boolean;
  // When true the per-save reorder cap is reached and this row is not part of the batch, so
  // it is locked from dragging entirely (rather than allowing a drop that would be reverted).
  isDragDisabled?: boolean;
}

const BadgesList: FunctionComponent<React.PropsWithChildren<BadgesListEntryParameters>> = (
  props,
) => {
  const { classes: styles, cx } = useDraggableListEntryStyles();
  const { translate } = useTranslation();
  const { badge, index, isReordering, isInBatch = false, isDragDisabled = false } = props;

  const handleDragHandle = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <Draggable
      draggableId={badge.id.toString()}
      key={badge.id.toString()}
      index={index}
      isDragDisabled={isDragDisabled}>
      {(provided) => (
        <ListItemButton
          disabled={isReordering}
          aria-disabled={isDragDisabled || undefined}
          className={cx(styles.entry, {
            [styles.locked]: isDragDisabled,
            [styles.moved]: isInBatch,
          })}
          data-testid={
            isDragDisabled
              ? `badge-row-locked-${badge.id}`
              : isInBatch
                ? `badge-row-moved-${badge.id}`
                : undefined
          }
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}>
          {!isInBatch && <Divider className={styles.divider} />}
          <Grid
            container
            direction='row'
            justifyContent='space-between'
            alignItems='center'
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
                    {/* Same Active/Inactive subtitle component the badges page (ItemCard)
                        uses, so reorder rows match the broader catalog visual treatment. */}
                    <ItemCardActivity isActive={badge.isActive} isLoading={false} />
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
                  <Tooltip
                    title={
                      isDragDisabled
                        ? translate(
                            'Message.ReorderBadgesLockedRow' /* TranslationNamespace.Badges */,
                          )
                        : ''
                    }
                    placement='top'>
                    {/* span wrapper lets the tooltip surface even when the button is disabled */}
                    <span>
                      <IconButton
                        className={styles.dragHandle}
                        data-testid={`drag-handle-${badge.id}`}
                        edge='end'
                        aria-label='drag-handle'
                        disabled={isReordering || isDragDisabled}
                        disableFocusRipple
                        disableRipple
                        disableTouchRipple
                        onClick={handleDragHandle}
                        color='secondary'
                        {...provided.dragHandleProps}
                        size='large'>
                        {/* Foundation drag-affordance glyph (three horizontal bars with up/down
                            triangles) — same icon the condition-rule reorder rows use. */}
                        <Icon
                          name='icon-regular-three-bars-horizontal-triangles-vertical'
                          size='Medium'
                        />
                      </IconButton>
                    </span>
                  </Tooltip>
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
