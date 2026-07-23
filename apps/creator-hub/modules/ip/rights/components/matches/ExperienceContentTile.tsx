import React from 'react';
import type { SearchContent } from '@rbx/client-rights/v1';
import { Grid, Typography, Link } from '@rbx/ui';
import SmallContentThumbnail from './SmallContentThumbnail';

interface ExperienceContentTileProps {
  content: SearchContent;
  url: string;
  inRow?: boolean;
}

const MAX_TILE_WIDTH = 25; // rem

/**
 * ExperienceContentTile displays a single experience content item without removal capability
 */
const ExperienceContentTile = React.memo(({ content, url, inRow }: ExperienceContentTileProps) => {
  const textSize = inRow ? 'body2' : 'body1';
  return (
    <Grid
      item
      container
      spacing={1}
      sx={{ maxWidth: `${MAX_TILE_WIDTH}rem`, alignItems: 'center' }}>
      <Grid item XSmall='auto'>
        <Link
          href={url}
          rel='noopener noreferrer'
          target='_blank'
          color='inherit'
          onClick={(event) => event.stopPropagation()}>
          <SmallContentThumbnail content={content} />
        </Link>
      </Grid>
      <Grid
        item
        container
        spacing={inRow ? 0.5 : 0}
        XSmall
        direction='column'
        sx={{ flexBasis: 0, overflow: 'hidden' }}>
        <Grid item>
          <Link
            href={url}
            rel='noopener noreferrer'
            target='_blank'
            color='inherit'
            sx={{
              display: 'block',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            variant={textSize}
            onClick={(event) => event.stopPropagation()}>
            {content.contentName}
          </Link>
        </Grid>
        <Grid item>
          <Typography
            sx={{
              display: 'block',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
            color='secondary'
            variant={textSize}>{`@${content.creator?.displayName}`}</Typography>
        </Grid>
      </Grid>
    </Grid>
  );
});
ExperienceContentTile.displayName = 'ExperienceContentTile';

export default ExperienceContentTile;
