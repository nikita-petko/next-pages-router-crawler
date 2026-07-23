import { FunctionComponent } from 'react';
import { Flex } from '@modules/miscellaneous/common/components';
import { Avatar, Typography } from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';

interface RevSplitRowProps {
  /** The color of the split in the chart as a hex value */
  color: string;
  /** The asset ID of the thumbnail */
  assetId: number;
  /** The type of asset thumbnail to fetch */
  assetThumbnailType: ThumbnailTypes;
  /** The label to use to identify the split on the chart */
  splitName: string;
  /** The percentage of the split (0-100) */
  percentage: number;
}

/** A row in the the revenue split chart's legend */
const RevSplitRow: FunctionComponent<RevSplitRowProps> = ({
  color,
  assetId,
  assetThumbnailType,
  splitName,
  percentage,
}) => {
  return (
    <Flex justifyContent='space-between'>
      <Flex gap={8} alignItems='center'>
        <div style={{ backgroundColor: color, width: '4px', height: '100%' }} />
        <Avatar variant='rounded' alt='avatar'>
          <Thumbnail2d
            targetId={assetId}
            type={assetThumbnailType}
            alt='thumbnail'
            returnPolicy={ReturnPolicy.PlaceHolder}
            includeBackground={false}
          />
        </Avatar>
        <Typography variant='body1'>{splitName}</Typography>
      </Flex>

      <Flex alignItems='center'>
        <Typography variant='h6' component='span'>
          {formatRoyaltyRate(percentage)}
        </Typography>
      </Flex>
    </Flex>
  );
};

export default RevSplitRow;
