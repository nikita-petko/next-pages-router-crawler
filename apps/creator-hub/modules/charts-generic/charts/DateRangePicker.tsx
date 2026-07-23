import React, { useCallback } from 'react';
import { PickersUtilsProvider } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

import {
  translationKey,
  useTranslationWrapper,
  withNamespaceSwitchedTranslation,
} from '@modules/analytics-translations';
import LocalizingDatePicker from './LocalizingDatePicker';
import useDateRangePickerStyles from '../DateRangePicker.styles';

const DateRangePicker = ({
  endDate,
  startDate,
  onChangeEndDate,
  onChangeStartDate,
  maxEndDate,
  minStartDate,
  setDatePickerPopoverOpen,
}: {
  endDate: Date;
  startDate: Date;
  onChangeEndDate: (date: Date | null) => Promise<void>;
  onChangeStartDate: (date: Date | null) => Promise<void>;
  maxEndDate: Date;
  minStartDate: Date;
  setDatePickerPopoverOpen: (open: boolean) => void;
}) => {
  const {
    classes: { startEndPickerLayout },
  } = useDateRangePickerStyles();
  const { translate } = useTranslationWrapper(useTranslation());

  const onPopoverOpen = useCallback(() => {
    setDatePickerPopoverOpen(true);
  }, [setDatePickerPopoverOpen]);

  const onPopoverClose = useCallback(() => {
    setDatePickerPopoverOpen(false);
  }, [setDatePickerPopoverOpen]);

  return (
    <PickersUtilsProvider>
      <div className={startEndPickerLayout}>
        <LocalizingDatePicker
          label={translate(translationKey('Label.StartDate', TranslationNamespace.Analytics))}
          value={startDate}
          onChange={onChangeStartDate}
          minDate={minStartDate}
          maxDate={endDate}
          onOpen={onPopoverOpen}
          onClose={onPopoverClose}
        />
        <LocalizingDatePicker
          label={translate(translationKey('Label.EndDate', TranslationNamespace.Analytics))}
          value={endDate}
          onChange={onChangeEndDate}
          minDate={startDate}
          maxDate={maxEndDate}
          onOpen={onPopoverOpen}
          onClose={onPopoverClose}
        />
      </div>
    </PickersUtilsProvider>
  );
};

export default withNamespaceSwitchedTranslation(DateRangePicker, [TranslationNamespace.Analytics]);
