import { memo, useCallback, useState } from 'react';
import NextLink from 'next/link';
import type { Category } from '@rbx/client-shops-api/v1';
import {
  Badge,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes } from '@rbx/thumbnails';
import { Avatar, TableCell, TableRow } from '@rbx/ui';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { Tooltip } from '@modules/monetization-shared/tooltip';
import { FROM_SHOP } from '../../constants';
import { isVisibilityEditable, type ShopItem } from '../../types';
import { openHideListingDialog } from '../dialogs/HideListingDialog';
import ShopItemRowCategoryDropdown from './ShopItemRowCategoryDropdown';
import { ShopItemsTableRowCheckbox } from './ShopItemsTableCheckbox';

type Props = {
  item: ShopItem;
  universeId: number;
  availableCategories: readonly Category[];
  onToggleVisibility?: (item: ShopItem) => void;
  onChangeCategory?: (item: ShopItem, nextCategory: Category) => void;
  onRenameCategory?: (categoryId: string, newName: string) => void;
  onAddCategory?: (item: ShopItem, name: string) => void;
  disabled?: boolean;
};

function getItemDetailsUrl(item: ShopItem, universeId: number): string {
  const assetId = Number(item.id);
  switch (item.type) {
    case 'GamePass':
      return dashboard.getConfigurePassUrl(universeId, assetId);
    case 'DeveloperProduct':
      return dashboard.getConfigureDeveloperProductUrl(universeId, assetId);
    default:
      return '';
  }
}

type ShopItemRowOptionsMenuProps = {
  item: ShopItem;
  detailsUrl: string;
  onToggleVisibility?: (item: ShopItem) => void;
  disabled?: boolean;
};

// Owns its own `isMenuOpen` state so opening/closing the popover doesn't
// rerender the rest of the row (checkbox subscription, badge, avatar, etc.).
const ShopItemRowOptionsMenu = memo(
  ({ item, detailsUrl, onToggleVisibility, disabled }: ShopItemRowOptionsMenuProps) => {
    const { translate } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const moreOptionsLabel = translate('Label.AriaLabel.ItemOptions', {
      itemName: item.name,
    });
    const isListed = item.isVisibleInShop;
    const toggleVisibilityLabel = isListed
      ? translate('Action.HideFromShop')
      : translate('Action.ShowInShop');
    const isVisibilityToggleDisabled = (disabled ?? false) || !isVisibilityEditable(item);

    const handleToggleVisibility = useCallback(() => {
      setIsMenuOpen(false);
      // Hiding is gated through a confirmation dialog; showing toggles directly.
      if (isListed) {
        openHideListingDialog({
          count: 1,
          onConfirm: () => onToggleVisibility?.(item),
        });
        return;
      }
      onToggleVisibility?.(item);
    }, [isListed, onToggleVisibility, item]);

    return (
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <IconButton
            as='button'
            variant='Utility'
            size='Small'
            isCircular
            icon='icon-filled-three-dots-vertical'
            ariaLabel={moreOptionsLabel}
          />
        </PopoverTrigger>
        <PopoverContent side='bottom' align='end' ariaLabel={moreOptionsLabel}>
          <Menu size='Medium'>
            <MenuSection>
              <Tooltip
                title={translate('Message.ListItemsTooltip')}
                disabled={!isVisibilityToggleDisabled}
                addTriggerSlot>
                <MenuItem
                  value='toggle-visibility'
                  disabled={isVisibilityToggleDisabled}
                  leading={
                    <Icon
                      name={isListed ? 'icon-regular-eye-slash' : 'icon-regular-eye'}
                      size='Medium'
                    />
                  }
                  title={toggleVisibilityLabel}
                  onSelect={handleToggleVisibility}
                />
              </Tooltip>
              <MenuItem
                asChild
                value='item-details'
                title={translate('Label.ItemDetails')}
                // Spacer keeps the label aligned with the visibility toggle's leading icon.
                leading={<span aria-hidden='true' className='size-[var(--icon-size-medium)]' />}>
                <NextLink
                  href={{ pathname: detailsUrl, query: { from: FROM_SHOP } }}
                  as={detailsUrl}
                  className='no-underline'
                />
              </MenuItem>
            </MenuSection>
          </Menu>
        </PopoverContent>
      </Popover>
    );
  },
);

function ShopItemsTableRow({
  item,
  universeId,
  availableCategories,
  onToggleVisibility,
  onChangeCategory,
  onRenameCategory,
  onAddCategory,
  disabled,
}: Props) {
  const { translate } = useTranslation();
  const detailsUrl = getItemDetailsUrl(item, universeId);
  const typeLabel =
    item.type === 'GamePass' ? translate('Label.Pass') : translate('Label.DeveloperProduct');

  return (
    <TableRow hover>
      <TableCell padding='checkbox' align='center' className='padding-xlarge'>
        <ShopItemsTableRowCheckbox
          item={item}
          aria-label={translate('Label.AriaLabel.SelectItem', {
            itemName: item.name,
          })}
        />
      </TableCell>

      <TableCell className='max-width-0'>
        {detailsUrl ? (
          <NextLink
            href={{ pathname: detailsUrl, query: { from: FROM_SHOP } }}
            as={detailsUrl}
            className='flex items-center min-width-0 gap-small content-inherit no-underline hover:underline'>
            <Avatar variant='rounded' alt={item.name}>
              <Thumbnail2d
                targetId={item.thumbnailAssetId}
                type={ThumbnailTypes.assetThumbnail}
                returnPolicy={ReturnPolicy.PlaceHolder}
                alt=''
              />
            </Avatar>
            <span className='text-body-medium text-no-wrap text-truncate-end'>{item.name}</span>
          </NextLink>
        ) : (
          <div className='flex items-center min-width-0 gap-small'>
            <Avatar variant='rounded' alt={item.name} />
            <span className='text-body-medium text-no-wrap text-truncate-end'>{item.name}</span>
          </div>
        )}
      </TableCell>

      <TableCell>
        <span className='text-body-medium'>{typeLabel}</span>
      </TableCell>

      <TableCell>
        <Badge
          label={item.isVisibleInShop ? translate('Label.Listed') : translate('Label.Unlisted')}
          variant={item.isVisibleInShop ? 'Neutral' : 'Warning'}
          className='flex justify-center min-width-1600'
        />
      </TableCell>

      <TableCell>
        <ShopItemRowCategoryDropdown
          item={item}
          availableCategories={availableCategories}
          onChangeCategory={onChangeCategory}
          onRenameCategory={onRenameCategory}
          onAddCategory={onAddCategory}
          disabled={disabled}
        />
      </TableCell>

      <TableCell padding='checkbox' align='center'>
        <ShopItemRowOptionsMenu
          item={item}
          detailsUrl={detailsUrl}
          onToggleVisibility={onToggleVisibility}
          disabled={disabled}
        />
      </TableCell>
    </TableRow>
  );
}

export default memo(ShopItemsTableRow);
