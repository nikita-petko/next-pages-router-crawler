import { Select, MenuItem } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { DateRange } from '../types';

export interface DateRangeSelectorProps {
  value: string;
  dateRangeSpan: DateRange[];
  onSelectDateRange: (value: DateRange) => void;
}

const DateRangeSelector: FunctionComponent<React.PropsWithChildren<DateRangeSelectorProps>> = ({
  value,
  dateRangeSpan,
  onSelectDateRange,
}) => {
  const { translate } = useTranslation();

  return (
    <Select helperText={translate('Label.SelectDate')} value={value}>
      {dateRangeSpan.map((rangeItem) => (
        <MenuItem
          key={rangeItem.id}
          value={rangeItem.id}
          onClick={() => onSelectDateRange(rangeItem)}>
          {rangeItem.label}
        </MenuItem>
      ))}
    </Select>
  );
};

export default DateRangeSelector;
