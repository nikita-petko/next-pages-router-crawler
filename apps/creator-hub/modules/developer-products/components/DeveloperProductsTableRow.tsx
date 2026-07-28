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
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { useIsHovered } from '@modules/monetization-shared/useIsHovered';
import type { DeveloperProductConfig } from '../types';
import { openDeveloperProductArchiveDialog } from './DeveloperProductArchiveDialog';
import { DeveloperProductsTableRowCheckbox } from './DeveloperProductsTableCheckbox';

type Props = DeveloperProductConfig & {
  universeId: number;
  showManagedPricing?: boolean;
  showPriceOptimization?: boolean;
  /** `undefined` = archive feature off; `false` = active tab; `true` = archived tab. */
  showArchived?: boolean;
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
    void navigator.clipboard.writeText(productId.toString());
    setIsProductIdCopied(true);
  }, [productId]);

  /* oxlint-disable react/react-compiler -- resetting copy state on hover-out; setState is intentional here */
  useEffect(() => {
    if (!isProductIdHovered) {
      setIsProductIdCopied(false);
    }
  }, [isProductIdHovered]);
  /* oxlint-enable react/react-compiler */

  return (
    <div className='flex items-center justify-start gap-xsmall'>
      <span className='content-default'>{productId}</span>
      <Tooltip
        title={isProductIdCopied ? translate('Message.Copied') : translate('Action.CopyProductID')}
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

function ArchiveMenuItem({
  universeId,
  productId,
  showArchived,
  onActionSelected,
}: {
  universeId: number;
  productId: number;
  showArchived: boolean;
  onActionSelected: () => void;
}) {
  const unwrapped = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(unwrapped);

  const handleSelect = useCallback(() => {
    openDeveloperProductArchiveDialog({
      universeId,
      itemId: productId,
      isArchived: showArchived,
    });
    onActionSelected();
  }, [universeId, productId, showArchived, onActionSelected]);

  return showArchived ? (
    <MenuItem
      value='unarchive'
      title={tPendingTranslation(
        'Unarchive',
        'Label for the action to unarchive a developer product.',
        translationKey('Action.Unarchive', TranslationNamespace.DeveloperProducts),
      )}
      onSelect={handleSelect}
    />
  ) : (
    <MenuItem
      value='archive'
      title={tPendingTranslation(
        'Archive',
        'Label for the action to archive a developer product.',
        translationKey('Action.Archive', TranslationNamespace.DeveloperProducts),
      )}
      onSelect={handleSelect}
    />
  );
}

function MoreItemOptionsMenu({
  configureUrl,
  universeId,
  showManagedPricing,
  showArchived,
  onToggleRegionalPricing,
  disableToggleRegionalPricing,
  ...product
}: Omit<Props, 'showPriceOptimization'> & { configureUrl: string }) {
  const { translate } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyProductId = useCallback(() => {
    void navigator.clipboard.writeText(product.productId.toString());
    setIsOpen(false);
  }, [product.productId]);

  const handleToggleRegionalPricing = useCallback(() => {
    onToggleRegionalPricing(product.productId, !product.isRegionalPricingEnabled);
    setIsOpen(false);
  }, [onToggleRegionalPricing, product.isRegionalPricingEnabled, product.productId]);

  const handleCloseMenu = useCallback(() => setIsOpen(false), []);

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
            {!showManagedPricing && !showArchived && product.isSelectableForRegionalPricing && (
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
            )}
            {showArchived !== undefined && (
              <ArchiveMenuItem
                universeId={universeId}
                productId={product.productId}
                showArchived={showArchived}
                onActionSelected={handleCloseMenu}
              />
            )}
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}

function DeveloperProductsTableRow({
  universeId,
  showManagedPricing,
  showPriceOptimization,
  showArchived,
  onToggleRegionalPricing,
  disableToggleRegionalPricing,
  ...product
}: Props) {
  const { translate } = useTranslation();
  const { locale } = useLocalization();

  const productIdCellRef = useRef<HTMLTableCellElement>(null);

  const configureDeveloperProductLink = getConfigureDeveloperProductLink(
    universeId,
    product.productId,
  );

  const isManagedPricingEnabled = showManagedPricing
    ? product.isManagedPricingEnabled
    : product.isRegionalPricingEnabled;

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

      {!showArchived && (
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
      )}

      {!showArchived && (
        <TableCell>
          {/* For now, assume immutability will disallow other features */}
          {product.isForSale && !product.isImmutable && (
            <Badge
              label={
                isManagedPricingEnabled ? translate('Label.Enabled') : translate('Label.Disabled')
              }
              variant={isManagedPricingEnabled ? 'Neutral' : 'Warning'}
              className='flex justify-center min-width-1600'
            />
          )}
        </TableCell>
      )}

      {!showArchived && !showManagedPricing && showPriceOptimization && (
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

      {showArchived && (
        <TableCell>
          <span className='content-default'>
            {formatDate(product.updatedTimestamp, locale ?? Locale.English)}
          </span>
        </TableCell>
      )}

      <TableCell padding='checkbox' align='center'>
        <MoreItemOptionsMenu
          configureUrl={configureDeveloperProductLink}
          universeId={universeId}
          showManagedPricing={showManagedPricing}
          showArchived={showArchived}
          onToggleRegionalPricing={onToggleRegionalPricing}
          disableToggleRegionalPricing={disableToggleRegionalPricing}
          {...product}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(DeveloperProductsTableRow);
