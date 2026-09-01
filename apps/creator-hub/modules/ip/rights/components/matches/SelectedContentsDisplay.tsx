import React from 'react';
import { Grid, CancelIcon, IconButton, Typography } from '@rbx/ui';
import type Match from './Match';
import SmallContentThumbnail from './SmallContentThumbnail';

interface SelectedContentTileProps {
  match: Match;
  removeFromCart: (item: Match) => void;
}

const MAX_TILE_WIDTH = 25; // rem

const SelectedContentTile = React.memo(({ match, removeFromCart }: SelectedContentTileProps) => {
  return (
    <Grid item container spacing={1} sx={{ maxWidth: `${MAX_TILE_WIDTH}rem` }}>
      <Grid item XSmall='auto'>
        <SmallContentThumbnail content={match.searchContent} />
      </Grid>
      <Grid item container XSmall direction='column' sx={{ flexBasis: 0, overflow: 'hidden' }}>
        <Grid item>
          <Typography
            sx={{
              display: 'block',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            variant='body1'>
            {match.searchContent.contentName}
          </Typography>
        </Grid>
        <Grid item>
          <Typography
            sx={{
              display: 'block',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            variant='body2'>{`@${match.searchContent.creator?.displayName}`}</Typography>
        </Grid>
      </Grid>
      <Grid container item XSmall='auto'>
        <IconButton
          aria-label='delete search content'
          color='secondary'
          onClick={() => {
            removeFromCart(match);
          }}>
          <CancelIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
});
SelectedContentTile.displayName = 'SelectedContentTile';

const SelectedContentsDisplay = ({
  numPerRow,
  cartItems,
  removeFromCart,
}: {
  numPerRow: number;
  cartItems: Match[];
  removeFromCart: (item: Match) => void;
}) => {
  const cartNodes = cartItems.map((match) => {
    return (
      <Grid
        item
        XSmall={1}
        Large={1}
        key={`${match.searchContent.contentId}${match.searchContent.contentType}`}>
        <SelectedContentTile match={match} removeFromCart={removeFromCart} />
      </Grid>
    );
  });
  return (
    <div style={{ maxWidth: `${numPerRow * MAX_TILE_WIDTH}rem` }}>
      <Grid
        container
        columnSpacing={6}
        rowSpacing={3}
        columns={{ xs: 1, md: Math.ceil((numPerRow * 2) / 3), lg: numPerRow }}>
        {cartNodes}
      </Grid>
    </div>
  );
};

export default SelectedContentsDisplay;
