import type { FunctionComponent, SyntheticEvent } from 'react';
import { useCallback } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import DevelopmentItemActionsMenuContent from './DevelopmentItemActionsMenuContent';
import type { DevelopmentItemActionsProps } from './DevelopmentItemActionsMenuContent';

export type DevelopmentItemContextMenuPosition = {
  x: number;
  y: number;
};

export type DevelopmentItemContextMenuProps = DevelopmentItemActionsProps & {
  onClose: () => void;
  position?: DevelopmentItemContextMenuPosition;
};

const DevelopmentItemContextMenu: FunctionComponent<DevelopmentItemContextMenuProps> = ({
  isArchivable,
  item,
  onArchiveStateChange,
  onClose,
  onOpenDetails,
  position,
  toolboxIds,
}) => {
  const intl = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(intl);
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
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  return (
    <div onClick={stopPropagation} onKeyDown={stopPropagation} role='presentation'>
      <Popover open={position != null} onOpenChange={handleOpenChange}>
        {position != null && (
          <PopoverAnchor asChild>
            <span
              aria-hidden
              className='fixed pointer-events-none size-[1px]'
              style={{
                left: position.x,
                top: position.y,
              }}
            />
          </PopoverAnchor>
        )}
        <PopoverContent align='start' ariaLabel={assetActionsLabel} side='bottom' sideOffset={0}>
          <DevelopmentItemActionsMenuContent
            isArchivable={isArchivable}
            item={item}
            onArchiveStateChange={onArchiveStateChange}
            onClose={onClose}
            onOpenDetails={onOpenDetails}
            toolboxIds={toolboxIds}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DevelopmentItemContextMenu;
