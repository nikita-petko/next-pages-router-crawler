import { memo } from 'react';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import type { ShopItem } from '../../types';

type Props = {
  item: ShopItem;
};

function ExternalEligibilityReportTableRow({ item }: Props) {
  return (
    <TableRow hover>
      <TableCell className='max-width-0'>
        <div className='flex items-center min-width-0 gap-small'>
          <Avatar variant='rounded' alt={item.name}>
            <Thumbnail2d
              targetId={item.thumbnailAssetId}
              type={ThumbnailTypes.assetThumbnail}
              returnPolicy={ReturnPolicy.PlaceHolder}
              alt=''
            />
          </Avatar>
          <span className='text-body-medium text-no-wrap text-truncate-end'>{item.name}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className='text-body-medium content-emphasis'>{item.id}</span>
      </TableCell>
    </TableRow>
  );
}

export default memo(ExternalEligibilityReportTableRow);
