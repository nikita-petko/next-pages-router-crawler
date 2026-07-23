import { memo, useCallback, useEffect, useRef, useState } from 'react';
import NextLink from 'next/link';
import {
  Badge,
  clsx,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { dashboard } from '@modules/miscellaneous/common/urls/creatorHub';
import { useIsHovered } from '@modules/monetization-shared/useIsHovered';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { DeveloperProductConfig } from '../types';
import { DeveloperProductsTableRowCheckbox } from './DeveloperProductsTableCheckbox';

type Props = DeveloperProductConfig & {
  universeId: number;
  showPriceOptimization?: boolean;
  onToggleRegionalPricing: (productId: number, enabled: boolean) => void;
  disableToggleRegionalPricing?: boolean;
};

const getConfigureDeveloperProductLink = dashboard.getConfigureDeveloperProductUrl;

function ProductIdCell({
  productId,
  cellRef,
}: {
  productId: number;
  cellRef: React.RefObject<HTMLTableCellElement | null>;
}) {
  const { translate } = useTranslation();

  const copyButtonRef = useRef<HTMLButtonElement>(null);
  const isCopyButtonHovered = useIsHovered(copyButtonRef);
  const isProductIdHovered = useIsHovered(cellRef);
  const [isProductIdCopied, setIsProductIdCopied] = useState(false);

  const handleCopyProductId = useCallback(() => {
    navigator.clipboard.writeText(productId.toString());
    setIsProductIdCopied(true);
  }, [productId]);

  useEffect(() => {
    if (!isProductIdHovered) {
      setIsProductIdCopied(false);
    }
  }, [isProductIdHovered]);

  return (
    <div className='flex items-center justify-start gap-xsmall'>
      <span className='content-default'>{productId}</span>
      <Tooltip
        title={isProductIdCopied ? translate('Message.Copied') : translate('Action.CopyProductID')}
        delayDurationMs={0}
        open={isCopyButtonHovered}>
        <IconButton
          ref={copyButtonRef}
          as='button'
          icon='icon-regular-two-stacked-squares'
          size='Small'
          variant='Utility'
          className={clsx(
            `transition-all duration-100 ease-[ease-in]`,
            isProductIdHovered ? 'visible opacity-[1]' : 'invisible opacity-[0]',
          )}
          onClick={handleCopyProductId}
          ariaLabel={translate('Action.CopyProductID')}
        />
      </Tooltip>
    </div>
  );
}

function MoreItemOptionsMenu({
  configureUrl,
  onToggleRegionalPricing,
  disableToggleRegionalPricing,
  ...product
}: Omit<Props, 'universeId' | 'showPriceOptimization'> & { configureUrl: string }) {
  const { translate } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyProductId = useCallback(() => {
    navigator.clipboard.writeText(product.productId.toString());
    setIsOpen(false);
  }, [product.productId]);

  const handleToggleRegionalPricing = useCallback(() => {
    onToggleRegionalPricing(product.productId, !product.isRegionalPricingEnabled);
    setIsOpen(false);
  }, [onToggleRegionalPricing, product.isRegionalPricingEnabled, product.productId]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <IconButton
          as='button'
          icon='icon-filled-three-dots-vertical'
          size='Small'
          variant='Utility'
          isCircular
          ariaLabel={translate('Action.MoreOptions')}
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='end' ariaLabel={translate('Action.MoreOptions')}>
        <Menu size='Medium'>
          <MenuSection>
            <MenuItem asChild value='settings' title={translate('Action.EditSettings')}>
              <NextLink href={configureUrl} target='_blank' className='no-underline' />
            </MenuItem>
            <MenuItem
              value='copy-product-id'
              title={translate('Action.CopyProductID')}
              onSelect={handleCopyProductId}
            />
            {product.isSelectableForRegionalPricing ? (
              <MenuItem
                disabled={disableToggleRegionalPricing}
                value='toggle-regional-pricing'
                onSelect={handleToggleRegionalPricing}
                title={
                  product.isRegionalPricingEnabled
                    ? translate('Action.DisableRegionalPricing')
                    : translate('Action.EnableRegionalPricing')
                }
              />
            ) : null}
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

function DeveloperProductsTableRow({
  universeId,
  showPriceOptimization,
  onToggleRegionalPricing,
  disableToggleRegionalPricing,
  ...product
}: Props) {
  const { translate } = useTranslation();

  const productIdCellRef = useRef<HTMLTableCellElement>(null);

  const configureDeveloperProductLink = getConfigureDeveloperProductLink(
    universeId,
    product.productId,
  );

  return (
    <TableRow hover>
      <TableCell padding='checkbox' align='center' className='padding-xlarge'>
        <DeveloperProductsTableRowCheckbox
          aria-label={translate('Action.SelectProduct', { productName: product.name })}
          {...product}
        />
      </TableCell>

      <TableCell className='max-width-0'>
        <NextLink
          href={configureDeveloperProductLink}
          className='flex items-center min-width-0 gap-small content-inherit no-underline hover:underline'>
          <Avatar variant='rounded' className='radius-circle' alt={product.name}>
            <Thumbnail2d
              targetId={product.iconImageAssetId}
              type={ThumbnailTypes.assetThumbnail}
              returnPolicy={ReturnPolicy.PlaceHolder}
              alt=''
            />
          </Avatar>
          <span className='text-body-medium text-no-wrap text-truncate-end'>{product.name}</span>
        </NextLink>
      </TableCell>

      <TableCell ref={productIdCellRef}>
        <ProductIdCell productId={product.productId} cellRef={productIdCellRef} />
      </TableCell>

      <TableCell>
        {product.isForSale ? (
          <span className='flex items-center justify-start gap-xsmall'>
            <Icon name='icon-filled-robux' size='Small' aria-label='Robux' />
            {product.defaultPriceInRobux}
          </span>
        ) : (
          <span className='content-muted'>{translate('Label.Offsale')}</span>
        )}
      </TableCell>

      <TableCell>
        {/* For now, assume immutability will disallow other features */}
        {product.isForSale && !product.isImmutable && (
          <Badge
            label={
              product.isRegionalPricingEnabled
                ? translate('Label.Enabled')
                : translate('Label.Disabled')
            }
            variant={product.isRegionalPricingEnabled ? 'Neutral' : 'Warning'}
            className='flex justify-center min-width-1600'
          />
        )}
      </TableCell>

      {showPriceOptimization && (
        <TableCell>
          {/* For now, assume immutability will disallow other features */}
          {product.isForSale && !product.isImmutable && (
            <Badge
              label={
                product.isInActivePriceOptimizationExperiment
                  ? translate('Label.Active')
                  : translate('Label.Inactive')
              }
              variant={product.isInActivePriceOptimizationExperiment ? 'Contrast' : 'Neutral'}
            />
          )}
        </TableCell>
      )}

      <TableCell padding='checkbox' align='center'>
        <MoreItemOptionsMenu
          configureUrl={configureDeveloperProductLink}
          onToggleRegionalPricing={onToggleRegionalPricing}
          disableToggleRegionalPricing={disableToggleRegionalPricing}
          {...product}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(DeveloperProductsTableRow);
