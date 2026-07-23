import { type FC, useCallback, useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import { useManagePageTranslations } from '../useManagePageTranslations';

/** Page-level overflow menu (Refresh only for now). Never row-scoped. */
type ManagePageOverflowMenuProps = {
  readonly onRefresh: () => void;
};

const ManagePageOverflowMenu: FC<ManagePageOverflowMenuProps> = ({ onRefresh }) => {
  const t = useManagePageTranslations();
  const [open, setOpen] = useState(false);

  const handleRefresh = useCallback(() => {
    onRefresh();
    setOpen(false);
  }, [onRefresh]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton
          variant='Standard'
          size='Medium'
          ariaLabel={t.pageOverflowMenuLabel}
          icon='icon-regular-three-dots-horizontal'
        />
      </PopoverTrigger>
      <PopoverContent ariaLabel={t.pageOverflowMenuLabel} align='end'>
        <Menu size='Medium'>
          <MenuItem value='refresh' title={t.refreshAction} onSelect={handleRefresh} />
        </Menu>
      </PopoverContent>
    </Popover>
  );
};

export default ManagePageOverflowMenu;
