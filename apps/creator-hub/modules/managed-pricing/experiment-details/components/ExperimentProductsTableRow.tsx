import { memo } from 'react';
import NextLink from 'next/link';
import { Icon } from '@rbx/foundation-ui';
import type { Locale } from '@rbx/intl';
import { useLocalization, useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import type { ExperimentProduct } from '../../types';

type Props = {
  universeId: number;
  product: ExperimentProduct;
  showOptimization: boolean;
};

const getConfigureDeveloperProductLink = dashboard.getConfigureDeveloperProductUrl;
const getConfigurePassSalesLink = dashboard.getConfigurePassSalesUrl;

function getProductConfigureLink(universeId: number, product: ExperimentProduct) {
  if (product.type === 'DeveloperProduct') {
    return getConfigureDeveloperProductLink(universeId, Number(product.id));
  }
  return getConfigurePassSalesLink(universeId, Number(product.id));
}

function formatOptimizationPercentage(percentage: number, locale?: Locale | null): string {
  // 1. Convert percent to a base decimal (e.g., 10 -> 0.10)
  const decimalValue = percentage / 100;

  // 2. Set up the formatter
  const formatter = new Intl.NumberFormat(locale ?? undefined, {
    style: 'percent',
    signDisplay: 'exceptZero', // Show signs except for zero
    minimumFractionDigits: 0, // No decimal places
    maximumFractionDigits: 0, // No decimal places
  });

  // 3. Format and return
  return formatter.format(decimalValue);
}

function ExperimentProductsTableRow({ product, universeId, showOptimization }: Props) {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const configureLink = getProductConfigureLink(universeId, product);

  const typeLabel =
    product.type === 'DeveloperProduct'
      ? translate('Label.DeveloperProduct' /* TranslationNamespace.ManagedPricing */)
      : translate('Label.GamePass' /* TranslationNamespace.ManagedPricing */);

  const hasOptimizedPrice =
    product.optimizedPriceInRobux != null && product.optimizedPriceInRobux > 0;

  return (
    <TableRow hover>
      <TableCell className='max-width-0'>
        <NextLink
          href={configureLink}
          className='flex items-center min-width-0 gap-small content-inherit no-underline hover:underline'>
          <Avatar variant='rounded' alt={product.name}>
            <Thumbnail2d
              targetId={product.imageAssetId}
              type={ThumbnailTypes.assetThumbnail}
              returnPolicy={ReturnPolicy.PlaceHolder}
              alt=''
            />
          </Avatar>
          <div className='flex flex-col min-width-0'>
            <span className='text-body-medium text-no-wrap text-truncate-end'>{product.name}</span>
            <span className='text-body-small content-muted'>
              {translate('Label.ID', { id: product.id })}
            </span>
          </div>
        </NextLink>
      </TableCell>

      <TableCell>
        <span className='text-body-medium'>{typeLabel}</span>
      </TableCell>

      {showOptimization && (
        <TableCell>
          <span className='text-body-medium'>
            {product.optimizationPercentage != null
              ? formatOptimizationPercentage(product.optimizationPercentage, locale)
              : ''}
          </span>
        </TableCell>
      )}

      <TableCell>
        <span className='flex items-center justify-start gap-xsmall'>
          <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
          {product.originalPriceInRobux}
        </span>
      </TableCell>

      <TableCell className='bg-shift-200'>
        <span className='flex items-center justify-start gap-xsmall'>
          <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
          <span>{hasOptimizedPrice ? product.optimizedPriceInRobux : '-'}</span>
        </span>
      </TableCell>
    </TableRow>
  );
}

export default memo(ExperimentProductsTableRow);
