import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { IconButton, Menu, MenuItem, MenuSection } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import type { Action } from '@modules/charts-generic/types/Action';
import type { RemoteConfigAction } from '../../hooks/useConfigEntriesActions';
import { RemoteConfigActionInfo } from '../../hooks/useConfigEntriesActions';

const ActionMenu = <TActionType extends RemoteConfigAction, TActionOn>({
  widgetRef,
  iconButtonRef,
  closeMenu,
  actions,
}: {
  widgetRef: React.RefObject<HTMLDivElement | null>;
  iconButtonRef: React.RefObject<HTMLButtonElement | null>;
  closeMenu: () => void;
  actions: Array<Action<TActionType, TActionOn>>;
}) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuHeight, setMenuHeight] = useState(0);
  const [positionNonce, setPositionNonce] = useState(0);

  // Monitor menu height changes
  useLayoutEffect(() => {
    if (menuRef.current) {
      setMenuHeight(menuRef.current.offsetHeight);
    }
  }, []);

  // Monitor widget resize
  useEffect(() => {
    if (!widgetRef.current) {
      return () => {};
    }

    const updatePosition = () => {
      setPositionNonce((prev) => prev + 1);
    };

    // Use ResizeObserver to monitor element size/position changes
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(widgetRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [widgetRef]);

  // Handle click outside to close menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target !== null && !(event.target instanceof Node)) {
        return;
      }

      if (iconButtonRef.current && iconButtonRef.current.contains(event.target)) {
        // do nothing, let onClick handler on icon button to handle it
      } else if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [closeMenu, iconButtonRef]);

  const positionStyle: Pick<React.CSSProperties, 'top' | 'right'> = useMemo(() => {
    if (!widgetRef.current || !iconButtonRef.current) {
      return {};
    }

    const {
      top: iconButtonTop,
      right: iconButtonRight,
      height: iconButtonHeight,
    } = iconButtonRef.current.getBoundingClientRect();
    const {
      top: widgetTop,
      right: widgetRight,
      height: widgetHeight,
    } = widgetRef.current.getBoundingClientRect();

    // Anchor menu to the icon button's bottom right corner by default
    // If the menu is too tall, anchor it to the top right corner so it appears above
    // the icon button.
    const shouldMenuAppearAtBottom =
      iconButtonTop + iconButtonHeight + menuHeight <= widgetTop + widgetHeight;

    return {
      top: shouldMenuAppearAtBottom
        ? iconButtonTop + iconButtonHeight - widgetTop
        : iconButtonTop - widgetTop - menuHeight,
      right: widgetRight - iconButtonRight,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- relies on postion key
  }, [menuHeight, positionNonce]);

  if (!widgetRef.current) {
    return null;
  }

  return ReactDOM.createPortal(
    <div className='absolute' style={positionStyle} ref={menuRef}>
      <Menu size='XSmall'>
        <MenuSection>
          {actions.map(({ actionType, disabled, actionOn, onActionInvoked }) => {
            const { labelKey } = RemoteConfigActionInfo[actionType];
            const onSelect = () => {
              onActionInvoked(actionOn);
              closeMenu();
            };
            return (
              <MenuItem
                key={actionType}
                title={translate(labelKey)}
                value={actionType}
                onSelect={onSelect}
                disabled={disabled}
              />
            );
          })}
        </MenuSection>
      </Menu>
    </div>,
    widgetRef.current,
  );
};

const MoreOptionActionButton = <TActionType extends RemoteConfigAction, TActionOn>({
  widgetRef,
  actions,
}: {
  widgetRef: React.RefObject<HTMLDivElement | null>;
  actions: Array<Action<TActionType, TActionOn>>;
}) => {
  const iconButtonRef = useRef<HTMLButtonElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);
  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <>
      <IconButton
        size='XSmall'
        variant='Utility'
        icon='icon-filled-three-dots-horizontal'
        ariaLabel='three-dots'
        onClick={toggleMenu}
        ref={iconButtonRef}
      />
      {isOpen && (
        <ActionMenu
          widgetRef={widgetRef}
          iconButtonRef={iconButtonRef}
          closeMenu={closeMenu}
          actions={actions}
        />
      )}
    </>
  );
};

export default MoreOptionActionButton;
