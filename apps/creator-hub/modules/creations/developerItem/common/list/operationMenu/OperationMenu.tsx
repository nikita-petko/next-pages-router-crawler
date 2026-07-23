import React, {
  Dispatch,
  Fragment,
  FunctionComponent,
  MouseEventHandler,
  ReactNode,
  SetStateAction,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { Divider, IconButton, Menu, MoreHorizIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useOperationMenuStyles from './OperationMenu.styles';

export type TOperationMenuProps = {
  iconClass?: string;
  menuItems: Array<Array<ReactNode>>;
  menuOpen: boolean;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
};

const OperationMenu: FunctionComponent<React.PropsWithChildren<TOperationMenuProps>> = (props) => {
  const { iconClass, menuOpen, menuItems, setMenuOpen } = props;
  const visibility = useMemo<boolean>(() => {
    if ('ontouchstart' in document.documentElement) {
      return true;
    }
    return menuOpen;
  }, [menuOpen]);
  const {
    classes: { operationIcon },

    cx,
  } = useOperationMenuStyles({ visible: visibility });
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const { translate } = useTranslation();
  const handleIconClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen((open) => !open);
    },
    [setMenuOpen],
  );

  const handleMenuClose = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(false);
    },
    [setMenuOpen],
  );
  const menuChildren = useMemo(
    () =>
      menuItems.reduce<Array<ReactNode>>((previousValue, currentValue, currentIndex) => {
        if (previousValue.length === 0) {
          return [...currentValue];
        }
        return [
          ...previousValue,
          // Use Index is fine here since its immutable
          // eslint-disable-next-line react/no-array-index-key
          <Divider key={`__menu_divider_${currentIndex}`} />,
          ...currentValue,
        ];
      }, []),
    [menuItems],
  );
  return (
    <Fragment>
      <IconButton
        ref={triggerRef}
        data-testid='trigger-icon'
        className={cx(operationIcon, iconClass)}
        size='small'
        color='onMediaDark'
        onClick={handleIconClick}
        aria-label={translate('label.MoreOptions')}
        tabIndex={0}>
        <MoreHorizIcon color='inherit' />
      </IconButton>
      <Menu
        open={menuOpen}
        anchorEl={triggerRef.current}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}>
        {menuChildren}
      </Menu>
    </Fragment>
  );
};

export default OperationMenu;
