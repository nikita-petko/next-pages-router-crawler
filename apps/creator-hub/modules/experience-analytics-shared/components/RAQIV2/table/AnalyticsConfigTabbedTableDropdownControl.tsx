import type { FC } from 'react';
import { useCallback } from 'react';
import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';
import type { AnalyticsTableWithControlConfig } from '../../../constants/RAQIV2PredefinedTabbedTableConfigs';
import useRAQIV2TranslationDependencies from '../../../hooks/useRAQIV2TranslationDependencies';

type AnalyticsConfigTabbedTableDropdownControlProps = {
  tableWithControl: AnalyticsTableWithControlConfig;
  selectedOptionKey: string;
  onOptionSelected: (optionKey: string) => void;
};

const AnalyticsConfigTabbedTableDropdownControl: FC<
  AnalyticsConfigTabbedTableDropdownControlProps
> = ({ tableWithControl, selectedOptionKey, onOptionSelected }) => {
  const { translate } = useRAQIV2TranslationDependencies();
  const { labelKey, options } = tableWithControl;

  const handleValueChange = useCallback(
    (value: string) => {
      onOptionSelected(value);
    },
    [onOptionSelected],
  );

  return (
    <Dropdown
      size='Medium'
      className='min-width-[200px]'
      label={labelKey ? translate(labelKey) : undefined}
      value={selectedOptionKey}
      placeholder=''
      onValueChange={handleValueChange}>
      <Menu>
        {options.map((option) => (
          <MenuItem key={option.key} value={option.key} title={translate(option.labelKey)} />
        ))}
      </Menu>
    </Dropdown>
  );
};

export default AnalyticsConfigTabbedTableDropdownControl;
