import type { FunctionComponent, SyntheticEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import {
  clsx,
  Icon,
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
  type TIconButtonVariant,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type { DevelopmentItemsInventoryItem } from '../developmentItemsInventoryUtils';

export type DevelopmentItemActionsMenuProps = {
  item: DevelopmentItemsInventoryItem;
  onOpenDetails: (item: DevelopmentItemsInventoryItem) => void;
  variant?: TIconButtonVariant;
};

const DevelopmentItemActionsMenu: FunctionComponent<DevelopmentItemActionsMenuProps> = ({
  item,
  onOpenDetails,
  variant = 'Utility',
}) => {
  const intl = useTranslation();
  const { translate } = intl;
  const { tPendingTranslation } = useTranslationWrapper(intl);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const assetActionsLabel = tPendingTranslation(
    'Asset actions',
    'Accessible label for a Development Item actions menu.',
    translationKey('Label.DevelopmentItems.AssetActions', TranslationNamespace.Creations),
  );
  const copyAssetIdLabel = translate('Action.CopyAssetID');
  const openAssetDetailsLabel = translate('Action.OpenAssetDetails');
  const stopPropagation = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Drop focus/active styles that Radix leaves on the trigger after dismiss.
      requestAnimationFrame(() => {
        triggerRef.current?.blur();
      });
    }
  }, []);
  const handleOpenDetails = useCallback(() => {
    handleOpenChange(false);
    onOpenDetails(item);
  }, [handleOpenChange, item, onOpenDetails]);
  const handleCopyAssetId = useCallback(() => {
    handleOpenChange(false);
    void navigator.clipboard.writeText(item.assetId.toString());
  }, [handleOpenChange, item.assetId]);

  return (
    <div
      className={clsx(
        isOpen
          ? 'visible'
          : [
              '[@media(hover:hover)]:invisible',
              '[@media(hover:hover)]:group-hover:visible',
              '[@media(hover:hover)]:group-focus-within:visible',
            ],
      )}
      onClick={stopPropagation}
      onKeyDown={stopPropagation}
      role='presentation'>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <IconButton
            ariaLabel={assetActionsLabel}
            as='button'
            icon='icon-filled-three-dots-vertical'
            isCircular
            isSelected={isOpen}
            ref={triggerRef}
            size='Small'
            variant={variant}
          />
        </PopoverTrigger>
        <PopoverContent align='end' ariaLabel={assetActionsLabel} side='bottom'>
          <Menu className='padding-small' size='Medium'>
            <MenuSection>
              <MenuItem
                leading={<Icon name='icon-regular-arrow-up-right-from-square' size='Medium' />}
                onSelect={handleOpenDetails}
                title={openAssetDetailsLabel}
                value='open-asset-details'
              />
              <MenuItem
                onSelect={handleCopyAssetId}
                title={copyAssetIdLabel}
                value='copy-asset-id'
              />
            </MenuSection>
          </Menu>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DevelopmentItemActionsMenu;
