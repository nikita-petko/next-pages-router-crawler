import { memo } from 'react';
import { Link } from '@rbx/foundation-ui';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import type { HardCodedPriceReference } from '../types';
import MiniCodeBlock from './MiniCodeBlock';
import StudioLauncherButton from './StudioLauncherButton';

type Props = HardCodedPriceReference & {
  rootPlaceId: number;
  onOpenInStudio: () => void;
  /* TODO(@jeminpark): currently out of scope, but add dismiss action */
  // onDismiss: (id: number) => void;
};

function HardCodedPricesTableRow({
  filename,
  lineStart,
  snippet,
  rootPlaceId,
  onOpenInStudio,
}: Props) {
  return (
    <TableRow hover>
      <TableCell>
        <Link as='button' color='Standard' onClick={onOpenInStudio}>
          <span className='flex flex-row items-center gap-small'>
            <Avatar variant='rounded'>
              <Thumbnail2d
                targetId={rootPlaceId}
                type={ThumbnailTypes.placeIcon}
                returnPolicy={ReturnPolicy.PlaceHolder}
                alt=''
              />
            </Avatar>
            <span className='text-body-medium underline text-truncate-end'>{filename}</span>
          </span>
        </Link>
      </TableCell>

      <TableCell>
        <span className='content-emphasis text-body-medium'>{lineStart}</span>
      </TableCell>

      <TableCell>
        <MiniCodeBlock code={snippet ?? ''} />
      </TableCell>

      <TableCell>
        <StudioLauncherButton onOpenInStudio={onOpenInStudio} />
      </TableCell>

      {/* TODO(@jeminpark): currently out of scope, but add dismiss action */}
      <TableCell padding='checkbox' align='center' />
      {/* <TableCell padding='checkbox' align='center'>
        <IconButton
          as='button'
          variant='Utility'
          size='Small'
          isCircular
          icon='icon-filled-x-small'
          ariaLabel='Dismiss'
          onClick={() => onDismiss(id)}
        />
      </TableCell> */}
    </TableRow>
  );
}

export default memo(HardCodedPricesTableRow);
