import type { FunctionComponent } from 'react';
import { useCallback, useState } from 'react';
import {
  clsx,
  Icon,
  Menu,
  MenuItem,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@rbx/foundation-ui';
import {
  BACKGROUND_CLASS_BY_INPUT_VARIANT,
  DROPDOWN_RADIUS_CLASS_BY_SIZE,
  HEIGHT_CLASS_BY_SIZE,
  ICON_SIZE_CLASS_BY_SIZE,
  interactable,
  PADDING_X_CLASS_BY_SIZE,
  StateLayer,
  STROKE_CLASS_BY_INPUT_VARIANT,
  TEXT_CLASS_BY_SIZE,
} from '@modules/monetization-shared/lib/foundation-base-shared';

export type InventoryFilterOption = {
  label: string;
  value: string;
};

export type InventoryFilterDropdownProps = {
  ariaLabel: string;
  className?: string;
  onChange: (value: string) => void;
  options: readonly InventoryFilterOption[];
  value: string;
};

type InventoryFilterMenuItemProps = {
  isSelected: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  option: InventoryFilterOption;
};

const InventoryFilterMenuItem: FunctionComponent<InventoryFilterMenuItemProps> = ({
  isSelected,
  onChange,
  onClose,
  option,
}) => {
  const handleSelect = useCallback(() => {
    onChange(option.value);
    onClose();
  }, [onChange, onClose, option.value]);

  return (
    <MenuItem
      className='width-max min-width-full max-width-full'
      onSelect={handleSelect}
      title={option.label}
      trailing={isSelected ? <Icon name='icon-filled-check' size='Medium' /> : undefined}
      value={option.value}
    />
  );
};

const InventoryFilterDropdown: FunctionComponent<InventoryFilterDropdownProps> = ({
  ariaLabel,
  className,
  onChange,
  options,
  value,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? ariaLabel;
  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button
            aria-expanded={isOpen}
            aria-haspopup='menu'
            aria-label={ariaLabel}
            className={clsx(
              interactable,
              'flex items-center width-full cursor-pointer outline-none',
              BACKGROUND_CLASS_BY_INPUT_VARIANT.Standard,
              STROKE_CLASS_BY_INPUT_VARIANT.Standard,
              DROPDOWN_RADIUS_CLASS_BY_SIZE.Medium,
              HEIGHT_CLASS_BY_SIZE.Medium,
              PADDING_X_CLASS_BY_SIZE.Medium,
              TEXT_CLASS_BY_SIZE.Medium,
              'stroke-default content-default',
            )}
            type='button'>
            <StateLayer />
            <span className='grow-1 min-width-0 text-truncate-split text-align-x-left'>
              {selectedLabel}
            </span>
            <span
              aria-hidden
              className={clsx(
                ICON_SIZE_CLASS_BY_SIZE.Medium,
                'icon content-default icon-regular-chevron-large-down shrink-0 margin-left-small',
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align='start'
          ariaLabel={ariaLabel}
          className='padding-y-small width-max [min-width:192px] [max-width:384px]'
          collisionPadding={8}
          side='bottom'
          sideOffset={0}>
          <Menu className='padding-small width-max min-width-full max-width-full' size='Medium'>
            {options.map((option) => (
              <InventoryFilterMenuItem
                isSelected={option.value === value}
                key={option.value}
                onChange={onChange}
                onClose={handleClose}
                option={option}
              />
            ))}
          </Menu>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default InventoryFilterDropdown;
