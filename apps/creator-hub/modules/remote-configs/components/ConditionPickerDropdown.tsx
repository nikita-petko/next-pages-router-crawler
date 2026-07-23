import type { FC } from 'react';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';

type ConditionOption = { name: string; disabled?: boolean };

type ConditionPickerDropdownProps = {
  conditionOptions: ReadonlyArray<ConditionOption>;
  value: string | undefined;
  onValueChange: (name: string) => void;
  isDisabled?: boolean;
  label: string;
  placeholder: string;
};

const ConditionPickerDropdown: FC<ConditionPickerDropdownProps> = ({
  conditionOptions,
  value,
  onValueChange,
  isDisabled,
  label,
  placeholder,
}) => (
  <Dropdown
    size='Large'
    label={label}
    value={value}
    placeholder={placeholder}
    isDisabled={isDisabled}
    onValueChange={onValueChange}>
    <Menu>
      {conditionOptions.map((option) => (
        <MenuItem
          key={option.name}
          value={option.name}
          title={option.name}
          disabled={option.disabled}
        />
      ))}
    </Menu>
  </Dropdown>
);

export default ConditionPickerDropdown;
