/* istanbul ignore file */
import { memo } from 'react';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';

function PricingEventsTableBase({ children }: React.PropsWithChildren) {
  const { translate } = useTranslation();

  return (
    <TableBase>
      <TableHead>
        <TableRow>
          <TableCell sx={{ minWidth: '120px' }}>
            <span className='text-label-medium'>
              {translate('TableHeading.EventType' /* TranslationNamespace.ManagedPricing */)}
            </span>
          </TableCell>

          <TableCell sx={{ minWidth: '160px' }}>
            <span className='text-label-medium'>
              {translate('TableHeading.EventDate' /* TranslationNamespace.ManagedPricing */)}
            </span>
          </TableCell>

          <TableCell sx={{ minWidth: '140px' }}>
            <span className='text-label-medium'>
              {translate('TableHeading.EventStatus' /* TranslationNamespace.ManagedPricing */)}
            </span>
          </TableCell>

          <TableCell sx={{ minWidth: '140px' }}>
            <span className='text-label-medium'>
              {translate('TableHeading.ItemsUpdated' /* TranslationNamespace.ManagedPricing */)}
            </span>
          </TableCell>

          <TableCell sx={{ minWidth: '140px' }}>
            <span className='text-label-medium'>
              {translate('TableHeading.RevenueImpact' /* TranslationNamespace.ManagedPricing */)}
            </span>
          </TableCell>

          <TableCell padding='checkbox' align='center' sx={{ minWidth: '52px' }} />
        </TableRow>
      </TableHead>

      <TableBody>{children}</TableBody>
    </TableBase>
  );
}

export default memo(PricingEventsTableBase);
