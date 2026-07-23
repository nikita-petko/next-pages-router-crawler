/* istanbul ignore file */
import { memo } from 'react';
import { Button, clsx, Icon, IconButton } from '@rbx/foundation-ui';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import type { HardCodedPriceInstance } from '../types';
import MiniCodeBlock from './MiniCodeBlock';

type Props = HardCodedPriceInstance & {
  onOpenInStudio: () => void;
  onDismiss: (id: number) => void;
};

function HardCodedPricesTableRow({
  id,
  iconAssetId,
  filename,
  line,
  codeSnippet,
  onOpenInStudio,
  onDismiss,
}: Props) {
  return (
    <TableRow hover>
      <TableCell>
        <Button
          type='button'
          variant='ActionUtility'
          onClick={onOpenInStudio}
          className={clsx(
            'group content-emphasis hover:content-link',
            'margin-left-[-12px] [&>div]:[background:transparent_!important]', // Button overrides for link styles
          )}>
          <span className='flex flex-row items-center gap-small'>
            <Avatar variant='rounded' alt={filename}>
              <Thumbnail2d
                targetId={iconAssetId}
                type={ThumbnailTypes.assetThumbnail}
                returnPolicy={ReturnPolicy.PlaceHolder}
                alt=''
              />
            </Avatar>
            <span className='text-body-medium underline text-truncate-end'>{filename}</span>
          </span>
        </Button>
      </TableCell>

      <TableCell>
        <span className='content-emphasis text-body-medium'>{line}</span>
      </TableCell>

      <TableCell>
        <MiniCodeBlock code={codeSnippet} />
      </TableCell>

      <TableCell>
        <Button
          type='button'
          variant='ActionUtility'
          onClick={onOpenInStudio}
          className={clsx(
            'content-emphasis hover:content-link transition-colors',
            'margin-left-[-12px] [&>div]:[background:transparent_!important]', // Button overrides for link styles
          )}>
          <span className='flex flex-row items-center gap-small'>
            <Icon name='icon-regular-studio' size='Medium' />
            <span className='text-label-medium underline'>Open in Studio</span>
          </span>
        </Button>
      </TableCell>

      <TableCell padding='checkbox' align='center'>
        <IconButton
          as='button'
          variant='Utility'
          size='Small'
          isCircular
          icon='icon-filled-x-small'
          ariaLabel='Dismiss'
          onClick={() => onDismiss(id)}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(HardCodedPricesTableRow);
