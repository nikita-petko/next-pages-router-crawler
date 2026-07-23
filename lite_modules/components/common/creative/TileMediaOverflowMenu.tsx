import {
  IconButton,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import {
  type ComponentProps,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  useState,
} from 'react';

import styles from '@components/common/creative/SelectableMediaTile.module.css';
import { TILE_OVERFLOW_ICON } from '@constants/creativeTiles';

interface TileOverflowMenuItem {
  leading?: ReactNode;
  onSelect: () => void;
  title: string;
  value: string;
}

type IconButtonIcon = ComponentProps<typeof IconButton>['icon'];

interface TileMediaOverflowMenuProps {
  ariaLabel: string;
  icon?: IconButtonIcon;
  iconButtonSize?: 'Small' | 'XSmall';
  isDisabled?: boolean;
  items: TileOverflowMenuItem[];
  /** When true, the trigger is hidden until the parent tile is hovered or focused. */
  showOnHover?: boolean;
  /** Optional custom trigger (e.g. table-row Utility IconButton). */
  trigger?: ReactElement;
}

const TileMediaOverflowMenu = ({
  ariaLabel,
  icon = TILE_OVERFLOW_ICON,
  iconButtonSize = 'Small',
  isDisabled = false,
  items,
  showOnHover = false,
  trigger,
}: TileMediaOverflowMenuProps): ReactElement => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const stopMenuEvent = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  };

  const popoverTrigger = trigger ?? (
    <IconButton
      ariaLabel={ariaLabel}
      icon={icon}
      isCircular
      onClick={stopMenuEvent}
      size={iconButtonSize}
      variant='OverMedia'
    />
  );

  const menu = (
    <Popover onOpenChange={setMenuOpen} open={menuOpen}>
      <PopoverTrigger asChild disabled={isDisabled}>
        {popoverTrigger}
      </PopoverTrigger>
      <PopoverContent align='end' ariaLabel={ariaLabel} side='bottom'>
        <Menu className='flex flex-col gap-xxsmall padding-small'>
          {items.map(({ leading, onSelect, title, value }) => (
            <MenuItem
              key={value}
              leading={leading}
              onSelect={() => {
                setMenuOpen(false);
                onSelect();
              }}
              title={title}
              value={value}
            />
          ))}
        </Menu>
      </PopoverContent>
    </Popover>
  );

  if (trigger) {
    return (
      <span
        className='pointer-events-auto shrink-0'
        onClick={stopMenuEvent}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.stopPropagation();
          }
        }}
        role='presentation'>
        {menu}
      </span>
    );
  }

  return (
    <div
      className={`${styles.overflowAnchor} ${
        showOnHover ? styles.overflowAnchorRevealOnHover : ''
      }`.trim()}
      onClick={stopMenuEvent}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.stopPropagation();
        }
      }}
      role='presentation'>
      <span className='pointer-events-auto shrink-0'>{menu}</span>
    </div>
  );
};

export default TileMediaOverflowMenu;
