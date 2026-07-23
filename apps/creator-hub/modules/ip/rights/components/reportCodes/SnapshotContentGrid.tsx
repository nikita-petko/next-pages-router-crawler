import React, { FunctionComponent } from 'react';
import { CircularProgress, Grid, Typography, HelpIcon, Link as UILink } from '@rbx/ui';
import Link from 'next/link';
import type { SnapshotContent } from '@rbx/clients/rightsV1';
import useCreatorInfo from '../../hooks/useCreatorInfo';
import SnapshotMediaPreview from './SnapshotMediaPreview';

const contentBlockSx = { overflow: 'hidden', justifyContent: 'center' } as const;
const contentTextSx = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
} as const;

interface SnapshotContentGridTileProps {
  item: SnapshotContent;
}

const SnapshotContentGridTile: FunctionComponent<SnapshotContentGridTileProps> = ({ item }) => {
  const {
    name: creatorName,
    url: creatorUrl,
    isPending,
  } = useCreatorInfo(item.creatorType ?? '', item.creatorId ?? '');

  const thumbnail = (
    <Grid item>
      <SnapshotMediaPreview
        contentUri={item.contentUri}
        assetType={item.assetType}
        contentId={item.contentId}
        variant='mini'
        fallback={<HelpIcon />}
      />
    </Grid>
  );

  if (isPending) {
    return <CircularProgress />;
  }

  return (
    <Grid container spacing={2} flexWrap='nowrap'>
      {thumbnail}
      <Grid item container direction='column' XSmall sx={contentBlockSx}>
        <Grid item sx={contentTextSx}>
          <Typography noWrap variant='body2'>
            {item.name}
          </Typography>
        </Grid>
        {creatorName && (
          <Grid item sx={contentTextSx}>
            <Link href={creatorUrl} passHref legacyBehavior>
              <UILink
                variant='body2'
                color='inherit'
                target='_blank'
                onClick={(event) => event.stopPropagation()}>
                @{creatorName}
              </UILink>
            </Link>
          </Grid>
        )}
      </Grid>
    </Grid>
  );
};

export default SnapshotContentGridTile;
