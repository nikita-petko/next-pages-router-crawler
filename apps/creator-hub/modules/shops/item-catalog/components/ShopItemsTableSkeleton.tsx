import { memo } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Skeleton, TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import ShopItemsActionBar from './ShopItemsActionBar';

const DEFAULT_ROW_COUNT = 10;

function SkeletonRow() {
  return (
    <TableRow>
      <TableCell padding='checkbox' align='center' className='padding-xlarge'>
        <Checkbox
          placement='Start'
          color='secondary'
          isChecked={false}
          aria-disabled
          isDisabled
          aria-label=''
          size='Medium'
        />
      </TableCell>

      {/* Avatar + Name */}
      <TableCell>
        <div className='flex items-center gap-small'>
          <Skeleton animate variant='rectangular' width={40} height={40} />
          <Skeleton animate variant='text' width={160} height={16} />
        </div>
      </TableCell>

      {/* Type */}
      <TableCell>
        <Skeleton animate variant='text' width={96} height={16} />
      </TableCell>

      {/* Shop visibility badge */}
      <TableCell>
        <Skeleton animate variant='rectangular' width={88} height={24} />
      </TableCell>

      {/* Category dropdown */}
      <TableCell>
        <Skeleton animate variant='rectangular' width={140} height={32} />
      </TableCell>

      {/* Row actions */}
      <TableCell padding='checkbox' align='center'>
        <Skeleton animate variant='rectangular' width={24} height={24} />
      </TableCell>
    </TableRow>
  );
}

function ShopItemsTableSkeleton({ rowCount = DEFAULT_ROW_COUNT }: { rowCount?: number }) {
  const { translate } = useTranslation();

  return (
    <section className='margin-bottom-large'>
      <ShopItemsActionBar
        className='margin-bottom-medium'
        disableSearch
        disableFilter
        hideBulkAction
      />
      <TableBase>
        <TableHead>
          <TableRow>
            <TableCell
              padding='checkbox'
              align='center'
              className='padding-x-xlarge padding-y-large'>
              <Checkbox
                placement='Start'
                color='secondary'
                isChecked={false}
                aria-disabled
                isDisabled
                aria-label=''
                size='Medium'
              />
            </TableCell>

            <TableCell width='37.5%' sx={{ minWidth: '240px' }}>
              <span className='text-label-medium'>{translate('Label.Name')}</span>
            </TableCell>

            <TableCell sx={{ minWidth: '160px' }}>
              <span className='text-label-medium'>{translate('Label.Type')}</span>
            </TableCell>

            <TableCell sx={{ minWidth: '200px' }}>
              <span className='text-label-medium'>{translate('Label.Listed')}</span>
            </TableCell>

            <TableCell sx={{ minWidth: '160px' }}>
              <span className='text-label-medium'>{translate('Label.Category')}</span>
            </TableCell>

            <TableCell padding='checkbox' sx={{ minWidth: '52px' }} align='center' />
          </TableRow>
        </TableHead>

        <TableBody>
          {Array.from({ length: rowCount }, (_, i) => (
            <SkeletonRow key={i} />
          ))}
        </TableBody>
      </TableBase>
    </section>
  );
}

export default memo(ShopItemsTableSkeleton);
