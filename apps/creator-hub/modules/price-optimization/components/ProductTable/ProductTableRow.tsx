import { memo, useState } from 'react';
import { Badge, Button, clsx, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Checkbox, TableCell, TableRow } from '@rbx/ui';
import { useFormatters } from '../../helpers/useFormatters';
import type { Product } from '../../types/product';
import ProductTableRegionalPricingModal from './ProductTableRegionalPricingModal';

type Props = {
  product: Product;
  universeId: number;
  noSelect?: boolean;
  showOptimizedPrice?: boolean;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
};

const getProductTypeDetails = (
  productType: Product['productType'],
): { thumbnailType: ThumbnailTypes; productTypeKey: string } => {
  switch (productType) {
    case 'GamePass':
      return {
        thumbnailType: ThumbnailTypes.assetThumbnail,
        productTypeKey: 'Description.GamePass',
      };
    case 'DeveloperProduct':
      return {
        thumbnailType: ThumbnailTypes.assetThumbnail,
        productTypeKey: 'Description.DeveloperProduct',
      };
    default:
      // Should never happen
      return { thumbnailType: ThumbnailTypes.assetThumbnail, productTypeKey: '' };
  }
};

const getOptimizationPercentage = ({
  optimizationPercentage,
  optimizedPrice,
  defaultPrice,
}: {
  optimizationPercentage?: number | null;
  optimizedPrice?: number | null;
  defaultPrice: number;
}): number => {
  // Early return if prices are missing or the same
  if (!defaultPrice || !optimizedPrice || defaultPrice === optimizedPrice) {
    return 0;
  }

  // Use optimization percentage if available
  if (optimizationPercentage != null) {
    return optimizationPercentage;
  }

  // Calculate percentage manually since prices are different
  const percentageChange = ((optimizedPrice - defaultPrice) / defaultPrice) * 100;
  return Math.round(percentageChange * 10) / 10;
};

function OptimizationPercentageBadge({ percentageChange }: { percentageChange: number }) {
  const { decimalPercentageFormatter } = useFormatters();

  // Format percentage for display (convert from percentage to decimal for formatter)
  const formattedPercentage = decimalPercentageFormatter.format(percentageChange / 100);

  if (percentageChange > 0) {
    return <Badge label={formattedPercentage} variant='Success' />;
  }
  if (percentageChange < 0) {
    return <Badge label={formattedPercentage} variant='Alert' />;
  }
  return <Badge label={formattedPercentage} variant='Neutral' />;
}

function ProductTableRow({
  product,
  universeId,
  noSelect,
  showOptimizedPrice,
  disabled,
  checked,
  onChange,
}: Props) {
  const { translate } = useTranslation();

  const {
    name,
    productId,
    productV3Id,
    iconId,
    productType,
    isRegionalPricingEnabled,
    optimizationPercentage,
    defaultPriceInRobux: defaultPrice,
    recommendedPriceInRobux: optimizedPrice,
  } = product;

  const { thumbnailType, productTypeKey } = getProductTypeDetails(productType);

  // RegionalPricing Related constants
  const [isRegionalPricingAllCountriesModalOpen, setIsRegionalPricingAllCountriesModalOpen] =
    useState(false);
  const showRegionalPricingViewPrices = !!(
    isRegionalPricingEnabled &&
    showOptimizedPrice &&
    optimizedPrice
  );

  // Calculate optimization percentage for display
  const percentageChange = getOptimizationPercentage({
    optimizationPercentage,
    optimizedPrice,
    defaultPrice,
  });

  // Calculate optimized price display value
  const optimizedPriceDisplay = showOptimizedPrice && optimizedPrice ? optimizedPrice : '--';

  const checkbox = noSelect ? null : (
    <TableCell padding='checkbox'>
      <Checkbox
        disabled={disabled}
        checked={checked}
        onChange={onChange}
        color='secondary'
        inputProps={{ 'aria-label': name }}
      />
    </TableCell>
  );

  return (
    <TableRow>
      {checkbox}
      <TableCell className='padding-x-large padding-y-small'>
        <span className='flex items-center gap-small'>
          <Thumbnail2d
            targetId={iconId}
            type={thumbnailType}
            returnPolicy={ReturnPolicy.PlaceHolder}
            containerClass='size-800 radius-small padding-none'
            alt='Product Icon'
          />
          <span className='flex flex-col'>
            <span className='text-body-medium' data-testid='product-name-cell'>
              {name}
            </span>
            {/* Display ProductV3 id instead of product target id if we have it. Relevant for dev products. */}
            <span className='text-body-medium'>
              {translate('Label.Table.ID', { productId: (productV3Id ?? productId).toString() })}
            </span>
          </span>
        </span>
      </TableCell>
      <TableCell data-testid='product-type-cell'>
        {productTypeKey ? translate(productTypeKey) : ''}
      </TableCell>

      <TableCell data-testid='regional-pricing-cell'>
        <span className='flex items-center gap-xsmall'>
          <Badge
            label={
              isRegionalPricingEnabled ? translate('Label.Enabled') : translate('Label.Disabled')
            }
            variant={isRegionalPricingEnabled ? 'Neutral' : 'Warning'}
            className='margin-right-xsmall flex justify-center min-width-1600'
          />

          {showRegionalPricingViewPrices && (
            <Button
              size='Small'
              variant='Link'
              className='!padding-x-xsmall'
              onClick={() => setIsRegionalPricingAllCountriesModalOpen(true)}>
              {translate('Label.ViewPrices')}
            </Button>
          )}
          {showRegionalPricingViewPrices && (
            <ProductTableRegionalPricingModal
              isOpen={isRegionalPricingAllCountriesModalOpen}
              setOpen={setIsRegionalPricingAllCountriesModalOpen}
              universeId={universeId}
              productType={productType}
              currentPrice={defaultPrice}
              optimizedPrice={optimizedPrice}
            />
          )}
        </span>
      </TableCell>

      {showOptimizedPrice && (
        <TableCell>
          <span className='flex items-center justify-end'>
            <OptimizationPercentageBadge percentageChange={percentageChange} />
          </span>
        </TableCell>
      )}

      <TableCell className='content-muted' data-testid='original-price-cell'>
        <span className='flex items-center justify-end gap-xsmall'>
          <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
          {defaultPrice}
        </span>
      </TableCell>
      <TableCell
        className={clsx('bg-shift-200', showOptimizedPrice ? 'content-emphasis' : 'content-muted')}>
        <span
          className='flex items-center justify-end gap-xsmall'
          data-testid='optimized-price-cell'>
          <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
          {optimizedPriceDisplay}
        </span>
      </TableCell>
    </TableRow>
  );
}

export default memo(ProductTableRow);
