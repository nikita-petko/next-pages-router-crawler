import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { Typography } from '@rbx/ui';
import { Icon } from '@rbx/foundation-ui';
import { MultiSelect } from '@modules/charts-generic';
import { useTranslationWrapper, translationKey } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useFilterSidebarStyles from '../FilterSidebar.styles';

export interface DropdownSectionProps {
  label: string;
  options: string[];
  displayFormatter?: (option: string) => string;
  setValue: (value: string[]) => void;
  currentValue: string[];
}

const DropdownSection: FunctionComponent<DropdownSectionProps> = ({
  label,
  options,
  displayFormatter,
  setValue,
  currentValue,
}) => {
  const { translate: translateFT } = useTranslationWrapper(useTranslation());
  const { classes } = useFilterSidebarStyles();

  const { dropdownContainer, dropdownIcon } = classes;

  return (
    <div className={dropdownContainer}>
      <Typography variant='captionHeader'>{label}</Typography>
      <MultiSelect
        options={options}
        formatOption={displayFormatter}
        selectedOptions={currentValue}
        onChange={setValue}
        blankValue={translateFT(
          translationKey(
            'ServerListTable.Filter.Dropdown.Placeholder',
            TranslationNamespace.ServerManagement,
          ),
        )}
        size='small'
        SelectProps={{
          IconComponent: (props) => (
            <Icon name='icon-regular-chevron-large-down' className={dropdownIcon} {...props} />
          ),
          MenuProps: {
            disablePortal: true,
          },
          displayEmpty: true,
        }}
      />
    </div>
  );
};

export default DropdownSection;
