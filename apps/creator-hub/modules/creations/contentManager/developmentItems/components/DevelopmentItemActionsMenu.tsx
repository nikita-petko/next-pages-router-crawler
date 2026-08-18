import type { FunctionComponent, SyntheticEvent } from 'react';
import { useCallback, useRef, useState } from 'react';
import {
  clsx,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  type TIconButtonVariant,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { logDevelopmentItemsMenuOpen } from '../developmentItemsAnalytics';
import DevelopmentItemActionsMenuContent from './DevelopmentItemActionsMenuContent';
import type { DevelopmentItemActionsProps } from './DevelopmentItemActionsMenuContent';

export type { DevelopmentItemArchiveStateChangeHandler } from './DevelopmentItemActionsMenuContent';

export type DevelopmentItemActionsMenuProps = DevelopmentItemActionsProps & {
  variant?: TIconButtonVariant;
};

const DevelopmentItemActionsMenu: FunctionComponent<DevelopmentItemActionsMenuProps> = ({
  isArchivable,
  item,
  onArchiveStateChange,
  onConfigureAsset,
  onViewAssetDetails,
  toolboxIds,
  variant = 'Utility',
}) => {
  const intl = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(intl);
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const assetActionsLabel = tPendingTranslation(
    'Asset actions',
    'Accessible label for a Development Item actions menu.',
    translationKey('Label.DevelopmentItems.AssetActions', TranslationNamespace.Creations),
  );
  const stopPropagation = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      const wasOpen = isOpenRef.current;
      isOpenRef.current = open;
      setIsOpen(open);
      if (open) {
        if (!wasOpen) {
          logDevelopmentItemsMenuOpen(item, 'overflow');
        }
      } else {
        // Drop focus/active styles that Radix leaves on the trigger after dismiss.
        requestAnimationFrame(() => {
          triggerRef.current?.blur();
        });
      }
    },
    [item],
  );

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
          <DevelopmentItemActionsMenuContent
            isArchivable={isArchivable}
            item={item}
            menuSource='overflow'
            onArchiveStateChange={onArchiveStateChange}
            onClose={() => handleOpenChange(false)}
            onConfigureAsset={onConfigureAsset}
            onViewAssetDetails={onViewAssetDetails}
            toolboxIds={toolboxIds}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DevelopmentItemActionsMenu;
