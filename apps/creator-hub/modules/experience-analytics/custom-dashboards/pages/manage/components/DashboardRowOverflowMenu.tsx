import { type FC, useCallback, useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  MenuSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import type { CustomDashboardListItem } from '../../../types';
import type { DashboardActionHandlers } from '../hooks/useDashboardActions';
import { useManagePageTranslations } from '../useManagePageTranslations';

/**
 * Per-row overflow menu: Edit, Rename, Duplicate, Delete.
 * Controlled popover so each item can dismiss after firing its handler.
 */
type DashboardRowOverflowMenuProps = {
  readonly dashboard: CustomDashboardListItem;
} & Pick<DashboardActionHandlers, 'onEdit' | 'onRename' | 'onDuplicate' | 'onDelete'>;

const DashboardRowOverflowMenu: FC<DashboardRowOverflowMenuProps> = ({
  dashboard,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
}) => {
  const t = useManagePageTranslations();
  const [open, setOpen] = useState(false);
  // Hybrid server rows are read-only until forked; local copies (and
  // non-hybrid API/local modes, where hybridOrigin is unset) keep full actions.
  const isHybridServerRow = dashboard.hybridOrigin === 'server';

  const onEditSelect = useCallback(() => {
    onEdit(dashboard);
    setOpen(false);
  }, [dashboard, onEdit]);
  const onRenameSelect = useCallback(() => {
    onRename(dashboard);
    setOpen(false);
  }, [dashboard, onRename]);
  const onDuplicateSelect = useCallback(() => {
    onDuplicate(dashboard);
    setOpen(false);
  }, [dashboard, onDuplicate]);
  const onDeleteSelect = useCallback(() => {
    onDelete(dashboard);
    setOpen(false);
  }, [dashboard, onDelete]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton
          variant='Standard'
          size='Small'
          ariaLabel={t.rowOverflowMenuLabel}
          icon='icon-regular-three-dots-vertical'
        />
      </PopoverTrigger>
      <PopoverContent ariaLabel={t.rowOverflowMenuLabel} align='end'>
        <Menu size='Medium'>
          <MenuItem
            value='edit'
            title={isHybridServerRow ? t.rowMenuEditAsLocalCopy : t.rowMenuEdit}
            onSelect={onEditSelect}
          />
          {isHybridServerRow ? null : (
            <>
              <MenuItem value='rename' title={t.rowMenuRename} onSelect={onRenameSelect} />
              <MenuItem value='duplicate' title={t.rowMenuDuplicate} onSelect={onDuplicateSelect} />
              <MenuSeparator />
              <MenuItem
                value='delete'
                title={t.rowMenuDelete}
                onSelect={onDeleteSelect}
                className='content-system-alert'
              />
            </>
          )}
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

export default DashboardRowOverflowMenu;
