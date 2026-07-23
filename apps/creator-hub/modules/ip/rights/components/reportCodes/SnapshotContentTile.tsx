import Link from 'next/link';
import type { FunctionComponent } from 'react';
import type { SnapshotContent } from '@rbx/client-rights/v1';
import { Card, Checkbox, Grid, Link as UILink, Typography, useTheme } from '@rbx/ui';
import { getPrefixedCreatorName } from '../../hooks/useContentDetails';
import useCreatorInfo from '../../hooks/useCreatorInfo';
import { CARD_BORDER_RADIUS, TILE_MEDIA_PADDING } from './contentTileStyles';
import SnapshotMediaPreview from './SnapshotMediaPreview';

export interface SnapshotContentTileProps {
  item: SnapshotContent;
  selected: boolean;
  onToggle: (item: SnapshotContent) => void;
  disabled: boolean;
}

const SnapshotContentTile: FunctionComponent<SnapshotContentTileProps> = ({
  item,
  selected,
  onToggle,
  disabled,
}) => {
  const theme = useTheme();
  const { name: creatorName, url: creatorUrl } = useCreatorInfo(
    item.creatorType ?? '',
    item.creatorId ?? '',
  );

  const backgroundTransition = theme.transitions.create('background-color', {
    duration: theme.transitions.duration.short,
  });

  const textEllipsisSx = {
    display: 'block',
    textOverflow: 'ellipsis',
    width: '180px',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    color: theme.palette.content.standard,
  } as const;

  return (
    <Card
      data-testid='report-code-content-tile'
      sx={{
        borderRadius: CARD_BORDER_RADIUS,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        cursor: disabled ? 'default' : 'pointer',
        ...(selected && {
          border: `2px solid ${theme.palette.content.standard}`,
        }),
      }}
      onClick={() => {
        if (disabled) {
          return;
        }
        onToggle(item);
      }}>
      <Grid
        sx={{
          position: 'relative',
          padding: TILE_MEDIA_PADDING,
          backgroundColor: theme.palette.surface[400],
          transition: backgroundTransition,
        }}>
        <SnapshotMediaPreview
          contentUri={item.contentUri}
          assetType={item.assetType}
          contentId={item.contentId}
        />
        <Checkbox
          sx={{ position: 'absolute', top: '5px', left: '5px' }}
          color='secondary'
          checked={selected}
        />
      </Grid>
      <Grid
        container
        direction='row'
        sx={{
          backgroundColor: theme.palette.surface[200],
          padding: 1,
          flexGrow: 1,
          alignContent: 'center',
        }}>
        <Grid item>
          <Typography sx={textEllipsisSx} component='span' variant='h6' display='block'>
            {item.name}
          </Typography>
        </Grid>
        {creatorName && (
          <Grid item>
            <Link href={creatorUrl} passHref legacyBehavior>
              <UILink
                sx={textEllipsisSx}
                variant='body2'
                color='inherit'
                target='_blank'
                onClick={(event) => event.stopPropagation()}>
                {getPrefixedCreatorName(item.creatorType, creatorName)}
              </UILink>
            </Link>
          </Grid>
        )}
      </Grid>
    </Card>
  );
};

export default SnapshotContentTile;
