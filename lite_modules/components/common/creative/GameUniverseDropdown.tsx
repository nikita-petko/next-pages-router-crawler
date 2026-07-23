import { Dropdown, Menu, MenuItem, type TDropdownSize } from '@rbx/foundation-ui';
import { type FC } from 'react';

import UniverseThumbnail from '@components/common/creative/UniverseThumbnail';
import { type AdvertisedUniverse } from '@type/universe';

/** Sentinel for optional "no game" selections. Foundation Dropdown keys by string. */
export const NO_GAME_DROPDOWN_VALUE = 'no-game';

interface GameUniverseDropdownStaticOption {
  label: string;
  value: string;
}

interface GameUniverseDropdownProps {
  advertisableUniverses: ReadonlyArray<AdvertisedUniverse>;
  className?: string;
  hint?: string;
  isDisabled?: boolean;
  label?: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  size?: TDropdownSize;
  /** Options rendered before the universe list (e.g. None, All games). */
  staticOptions?: ReadonlyArray<GameUniverseDropdownStaticOption>;
  value?: string;
}

/**
 * Foundation Dropdown for picking an advertisable universe, with Figma-aligned
 * menu rows (20px thumbnail leading accessory + game name).
 */
const GameUniverseDropdown: FC<GameUniverseDropdownProps> = ({
  advertisableUniverses,
  className,
  hint,
  isDisabled,
  label,
  onValueChange,
  placeholder,
  size = 'Medium',
  staticOptions = [],
  value,
}) => (
  <Dropdown
    className={className}
    hint={hint}
    isDisabled={isDisabled}
    label={label}
    onValueChange={onValueChange}
    placeholder={placeholder}
    size={size}
    value={value}>
    <Menu>
      {staticOptions.map((option) => (
        <MenuItem key={option.value} title={option.label} value={option.value} />
      ))}
      {advertisableUniverses.map((universe) => (
        <MenuItem
          key={universe.universe_id}
          leading={<UniverseThumbnail universeId={universe.universe_id} />}
          title={universe.universe_name}
          value={String(universe.universe_id)}
        />
      ))}
    </Menu>
  </Dropdown>
);

export default GameUniverseDropdown;
