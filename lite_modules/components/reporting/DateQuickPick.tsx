import { FormControl, FormHelperText, MenuItem, Select } from '@rbx/ui';
import { ChangeEvent } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import useDateQuickPickStyles from '@components/reporting/DateQuickPick.styles';
import {
  DATE_FILTERING_TIME_PERIOD_OPTIONS,
  IsValidDateFilteringTimePeriod,
} from '@constants/dateFilteringTimePeriod';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { ConvertDateFilteringEnumToString } from '@utils/enumToString';
import { CaptureException } from '@utils/error';

const DateQuickPick = () => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { dateQuickPickContainer },
  } = useDateQuickPickStyles();

  const dateSelectionState = useNewFlowStore((state: NewFlowStoreType) => state.dateSelectionState);
  const campaignsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignsState.isLoading,
  );
  const summaryStatsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.summaryStatsState.isLoading,
  );
  const handleDateSelectionChange = useNewFlowStore(
    (state: NewFlowStoreType) => state.handleDateSelectionChange,
  );

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    const newDateRangeSelection = parseInt(evt?.target?.value, 10);
    if (
      !Number.isNaN(newDateRangeSelection) &&
      IsValidDateFilteringTimePeriod(newDateRangeSelection)
    ) {
      handleDateSelectionChange(newDateRangeSelection);
      logNativeClickEvent(EventName.DateFilteringOptionClicked, {
        dateFilteringOption: ConvertDateFilteringEnumToString(newDateRangeSelection),
      });
    } else {
      CaptureException(`invalid dateRangeSelection ${newDateRangeSelection}`);
    }
  };

  return (
    <FormControl
      className={dateQuickPickContainer}
      error={dateSelectionState.isError}
      variant='outlined'>
      <Select
        data-testid='dateRangeSelect'
        disabled={campaignsIsLoading || summaryStatsIsLoading}
        inputProps={{
          id: 'outlined-date-range',
          MenuProps: {
            anchorOrigin: {
              horizontal: 'left',
              vertical: 'bottom',
            },
            transformOrigin: {
              horizontal: 'left',
              vertical: 'top',
            },
          },
          name: 'dateRange',
        }}
        label={translateReport('Label.DateRange')}
        onChange={handleChange}
        size='small'
        value={dateSelectionState.currentSelection}
        variant='outlined'>
        {DATE_FILTERING_TIME_PERIOD_OPTIONS.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {translateReport(option.labelKey)}
          </MenuItem>
        ))}
      </Select>
      {dateSelectionState.isError && (
        <FormHelperText data-testid='datePickerErrorHelperText'>
          {translateCampaign('Description.FailedToFetch')}
        </FormHelperText>
      )}
    </FormControl>
  );
};

export default DateQuickPick;
