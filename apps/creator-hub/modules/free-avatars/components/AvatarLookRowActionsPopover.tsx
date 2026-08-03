import { useCallback, useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  MenuSection,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import {
  getLookIdString,
  getLookOpenInNewTabUrl,
  writeTextToClipboard,
} from '../utils/avatarLooksRowUtils';

export type TAvatarLookRowActionsLabels = {
  openInNewTab: string;
  copyLookId: string;
  remove: string;
  rowActionsAriaLabel: string;
};

export type AvatarLookRowActionsPopoverProps = {
  row: { lookId?: string | null };
  labels: TAvatarLookRowActionsLabels;
  onRemove?: (lookId: string) => void;
  onCopySuccess?: () => void;
};

export function AvatarLookRowActionsPopover({
  row,
  labels,
  onRemove,
  onCopySuccess,
}: AvatarLookRowActionsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const lookId = getLookIdString(row);
  const openInNewTabUrl = getLookOpenInNewTabUrl(row);

  const handleOpenInNewTab = useCallback(() => {
    if (openInNewTabUrl == null) {
      return;
    }
    unifiedLoggerClient.logClickEvent({ eventName: 'clickActionMenuItem.openInNewTab' });
    window.open(openInNewTabUrl, '_blank');
    setIsOpen(false);
  }, [openInNewTabUrl]);

  const handleCopyLookId = useCallback(() => {
    if (lookId === '') {
      return;
    }
    unifiedLoggerClient.logClickEvent({ eventName: 'clickActionMenuItem.copyLookId' });
    void writeTextToClipboard(lookId).then(() => {
      onCopySuccess?.();
    });
    setIsOpen(false);
  }, [lookId, onCopySuccess]);

  const handleRemove = useCallback(() => {
    onRemove?.(lookId);
    setIsOpen(false);
  }, [lookId, onRemove]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <IconButton
          as='button'
          icon='icon-filled-three-dots-vertical'
          size='Large'
          variant='Utility'
          isCircular={false}
          ariaLabel={labels.rowActionsAriaLabel}
        />
      </PopoverTrigger>
      <PopoverContent side='bottom' align='end' ariaLabel={labels.rowActionsAriaLabel}>
        <Menu size='Medium'>
          <MenuSection>
            <MenuItem
              value='openInNewTab'
              title={labels.openInNewTab}
              onSelect={handleOpenInNewTab}
              disabled={openInNewTabUrl == null}
            />
            <MenuItem
              value='copyLookId'
              title={labels.copyLookId}
              onSelect={handleCopyLookId}
              disabled={lookId === ''}
            />
            <MenuItem value='remove' onSelect={handleRemove} asChild>
              <button type='button'>
                <span className='content-action-alert'>{labels.remove}</span>
              </button>
            </MenuItem>
          </MenuSection>
        </Menu>
      </PopoverContent>
    </Popover>
  );
}
