import { memo } from 'react';
import { Skeleton, TextInput } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { TableBody, TableCell, TableHead, TableRow } from '@rbx/ui';
import TableBase from '@modules/monetization-shared/table-v1/TableBase';
import { ExperimentProductsFilterTrigger } from './ExperimentProductsFilterTrigger';

const DEFAULT_ROW_COUNT = 10;

function SkeletonRow({ showOptimization }: { showOptimization: boolean }) {
  return (
    <TableRow>
      <TableCell className='max-width-0'>
        <div className='flex min-width-0 items-center gap-small'>
          <Skeleton variant='Rectangle' width={40} height={40} />
          <div className='flex min-width-0 flex-col gap-xsmall'>
            <Skeleton variant='Text' width={140} height={16} />
            <Skeleton variant='Text' width={72} height={14} />
          </div>
        </div>
      </TableCell>

      <TableCell>
        <Skeleton variant='Text' width={100} height={16} />
      </TableCell>

      {showOptimization && (
        <TableCell>
          <Skeleton variant='Text' width={48} height={16} />
        </TableCell>
      )}

      <TableCell>
        <div className='flex items-center gap-xsmall'>
          <Skeleton variant='Rectangle' width={16} height={16} />
          <Skeleton variant='Text' width={48} height={16} />
        </div>
      </TableCell>

      <TableCell className='bg-shift-200'>
        <div className='flex items-center gap-xsmall'>
          <Skeleton variant='Rectangle' width={16} height={16} />
          <Skeleton variant='Text' width={48} height={16} />
        </div>
      </TableCell>
    </TableRow>
  );
}

type Props = {
  showOptimization: boolean;
  rowCount?: number;
};

function ExperimentProductsTableSkeleton({
  showOptimization,
  rowCount = DEFAULT_ROW_COUNT,
}: Props) {
  const { translate } = useTranslation();

  return (
    <section>
      <div className='flex items-center gap-medium margin-bottom-medium'>
        <TextInput
          className='medium:min-width-[180px] medium:grow-1 medium:max-width-[250px]'
          value=''
          type='search'
          placeholder={translate('Label.Search' /* TranslationNamespace.Creations */)}
          leadingIconName='icon-regular-magnifying-glass'
          isDisabled
          aria-label={translate('Label.SearchItems' /* TranslationNamespace.Creations */)}
          size='Medium'
        />
        <ExperimentProductsFilterTrigger className='min-width-max medium:grow-0' disabled />
      </div>

      <TableBase>
        <TableHead>
          <TableRow>
            <TableCell width='35%' sx={{ minWidth: '270px' }}>
              <span className='text-label-medium'>
                {translate('Label.Name' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>

            <TableCell sx={{ minWidth: '140px' }}>
              <span className='text-label-medium'>
                {translate('Label.Type' /* TranslationNamespace.Creations */)}
              </span>
            </TableCell>

            {showOptimization && (
              <TableCell sx={{ minWidth: '130px' }}>
                <span className='text-label-medium'>
                  {translate('Label.Optimization' /* TranslationNamespace.ManagedPricing */)}
                </span>
              </TableCell>
            )}

            <TableCell sx={{ minWidth: '145px' }}>
              <span className='text-label-medium'>
                {translate('Label.CurrentPrice' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>

            <TableCell className='bg-shift-200' sx={{ minWidth: '160px' }}>
              <span className='text-label-medium'>
                {translate('Label.OptimizedPrice' /* TranslationNamespace.ManagedPricing */)}
              </span>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {Array.from({ length: rowCount }, (_, i) => (
            <SkeletonRow key={i} showOptimization={showOptimization} />
          ))}
        </TableBody>
      </TableBase>
    </section>
  );
}

export default memo(ExperimentProductsTableSkeleton);
