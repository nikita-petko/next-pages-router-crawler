import { Dropdown, MenuItem as FoundationMenuItem, Menu } from '@rbx/foundation-ui';
import { FormControl, FormHelperText, MenuItem, Select } from '@rbx/ui';
import { ChangeEvent } from 'react';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import DismissibleTooltip from '@components/common/DismissibleTooltip';
import useReportingViewQuickPickStyles from '@components/reporting/ReportingViewQuickPick.styles';
import { TranslationNamespace } from '@constants/localization';
import ReportingViewType from '@constants/reportingViewType';
import { Tooltips } from '@constants/tooltips';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { NewFlowStoreType, useNewFlowStore } from '@stores/newFlowStoreProvider';
import { CaptureException } from '@utils/error';

const IsValidReportingViewType = (reportingView: number) =>
  Object.values(ReportingViewType).includes(reportingView);

const reportingViewMenuItems = [
  { label: 'Label.AllUsers', value: ReportingViewType.REPORTING_VIEW_TYPE_DEFAULT },
  { label: 'Label.NewUsers', value: ReportingViewType.REPORTING_VIEW_TYPE_NEW_USERS },
  { label: 'Label.RecentUsers', value: ReportingViewType.REPORTING_VIEW_TYPE_RECENT_USERS },
  {
    label: 'Label.SevenDayResurrected',
    value: ReportingViewType.REPORTING_VIEW_TYPE_7D_RESURRECTED,
  },
  {
    label: 'Label.ThirtyDayResurrected',
    value: ReportingViewType.REPORTING_VIEW_TYPE_30D_RESURRECTED,
  },
] as const;

const ReportingViewQuickPick = () => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { reportingViewQuickPickContainer },
  } = useReportingViewQuickPickStyles();

  const reportingViewState = useNewFlowStore((state: NewFlowStoreType) => state.reportingViewState);
  const campaignsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.campaignsState.isLoading,
  );
  const summaryStatsIsLoading = useNewFlowStore(
    (state: NewFlowStoreType) => state.summaryStatsState.isLoading,
  );
  const handleReportingViewChange = useNewFlowStore(
    (state: NewFlowStoreType) => state.handleReportingViewChange,
  );
  const isCustomDateRangeEnabled = useAppStore(
    (state: AppStoreType) => state.appMetadataState?.data?.isCustomDateRangeEnabled ?? false,
  );

  const applyReportingViewChange = (newReportingViewSelection: number) => {
    if (
      !Number.isNaN(newReportingViewSelection) &&
      IsValidReportingViewType(newReportingViewSelection)
    ) {
      handleReportingViewChange(newReportingViewSelection);
      logNativeClickEvent(EventName.ReportingViewOptionClicked, {
        reportingViewOption: newReportingViewSelection.toString(),
      });
    } else {
      CaptureException(`invalid reportingViewSelection ${newReportingViewSelection}`);
    }
  };

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    applyReportingViewChange(parseInt(evt?.target?.value, 10));
  };

  const handleValueChange = (nextValue: string) => {
    applyReportingViewChange(parseInt(nextValue, 10));
  };

  const foundationDropdown = (
    <div className={reportingViewQuickPickContainer} data-testid='reportingViewSelect'>
      <Dropdown
        hasError={reportingViewState.isError}
        hint={
          reportingViewState.isError ? translateCampaign('Description.FailedToFetch') : undefined
        }
        isDisabled={campaignsIsLoading || summaryStatsIsLoading}
        label={translateReport('Label.ReportingView')}
        onValueChange={handleValueChange}
        placeholder=''
        size='Medium'
        value={reportingViewState.currentSelection.toString()}>
        <Menu>
          {reportingViewMenuItems.map(({ label, value }) => (
            <FoundationMenuItem
              key={value}
              title={translateReport(label)}
              value={value.toString()}
            />
          ))}
        </Menu>
      </Dropdown>
    </div>
  );

  const muiFormControl = (
    <FormControl
      className={reportingViewQuickPickContainer}
      error={reportingViewState.isError}
      variant='outlined'>
      <Select
        data-testid='reportingViewSelect'
        disabled={campaignsIsLoading || summaryStatsIsLoading}
        inputProps={{
          id: 'outlined-reporting-view',
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
          name: 'reportingView',
        }}
        label={translateReport('Label.ReportingView')}
        onChange={handleChange}
        size='small'
        value={reportingViewState.currentSelection}
        variant='outlined'>
        {reportingViewMenuItems.map(({ label, value }) => (
          <MenuItem key={value} value={value}>
            {translateReport(label)}
          </MenuItem>
        ))}
      </Select>
      {reportingViewState.isError && (
        <FormHelperText data-testid='reportingViewErrorHelperText'>
          {translateCampaign('Description.FailedToFetch')}
        </FormHelperText>
      )}
    </FormControl>
  );

  return (
    <DismissibleTooltip
      anchorElement={isCustomDateRangeEnabled ? foundationDropdown : muiFormControl}
      tooltip={Tooltips.REPORTING_VIEW}
    />
  );
};

export default ReportingViewQuickPick;
