/* istanbul ignore file */
import { memo } from 'react';
import { Checkbox } from '@rbx/foundation-ui';
import { Skeleton, TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import { useTranslation } from '@rbx/intl';
import ManagedProductsActionBar from './ManagedProductsActionBar';

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

      {/* Avatar + Name + Type */}
      <TableCell>
        <div className='flex items-center gap-small'>
          <Skeleton animate variant='rectangular' width={40} height={40} />
          <div className='flex flex-col gap-xsmall'>
            <Skeleton animate variant='text' width={140} height={16} />
            <Skeleton animate variant='text' width={90} height={14} />
          </div>
        </div>
      </TableCell>

      {/* Managed Pricing status */}
      <TableCell>
        <Skeleton animate variant='rectangular' width={64} height={24} />
      </TableCell>

      {/* Current Price */}
      <TableCell>
        <div className='flex items-center gap-xsmall'>
          <Skeleton animate variant='rectangular' width={16} height={16} />
          <Skeleton animate variant='text' width={48} height={16} />
        </div>
      </TableCell>

      {/* Last Updated */}
      <TableCell>
        <Skeleton animate variant='text' width={80} height={16} />
      </TableCell>
    </TableRow>
  );
}

function ManagedProductsTableSkeleton({ rowCount = DEFAULT_ROW_COUNT }: { rowCount?: number }) {
  const { translate } = useTranslation();

  return (
    <section className='margin-bottom-large'>
      <ManagedProductsActionBar
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

            <TableCell width='37.5%' sx={{ minWidth: '270px' }}>
              <span className='text-label-medium'>
                {translate('Label.Name' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>

            <TableCell sx={{ minWidth: '170px' }}>
              <span className='text-label-medium'>
                {translate('Label.ManagedPricing' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>

            <TableCell sx={{ minWidth: '145px' }}>
              <span className='text-label-medium'>
                {translate('Label.CurrentPrice' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>

            <TableCell sx={{ minWidth: '145px' }}>
              <span className='text-label-medium'>
                {translate('Label.LastUpdated' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {Array.from({ length: rowCount }, (_, i) => (
            // eslint-disable-next-line react/no-array-index-key -- static skeleton rows
            <SkeletonRow key={i} />
          ))}
        </TableBody>
      </TableBase>
    </section>
  );
}

export default memo(ManagedProductsTableSkeleton);
