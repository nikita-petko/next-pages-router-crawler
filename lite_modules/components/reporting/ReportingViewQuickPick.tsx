import { Dropdown, Menu, MenuItem } from '@rbx/foundation-ui';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import DismissibleTooltip from '@components/common/DismissibleTooltip';
import useReportingViewQuickPickStyles from '@components/reporting/ReportingViewQuickPick.styles';
import { TranslationNamespace } from '@constants/localization';
import ReportingViewType from '@constants/reportingViewType';
import { Tooltips } from '@constants/tooltips';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
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

  const handleValueChange = (nextValue: string) => {
    applyReportingViewChange(parseInt(nextValue, 10));
  };

  return (
    <DismissibleTooltip
      anchorElement={
        <div className={reportingViewQuickPickContainer} data-testid='reportingViewSelect'>
          <Dropdown
            hasError={reportingViewState.isError}
            hint={
              reportingViewState.isError
                ? translateCampaign('Description.FailedToFetch')
                : undefined
            }
            isDisabled={campaignsIsLoading || summaryStatsIsLoading}
            label={translateReport('Label.ReportingView')}
            onValueChange={handleValueChange}
            placeholder=''
            size='Medium'
            value={reportingViewState.currentSelection.toString()}>
            <Menu>
              {reportingViewMenuItems.map(({ label, value }) => (
                <MenuItem key={value} title={translateReport(label)} value={value.toString()} />
              ))}
            </Menu>
          </Dropdown>
        </div>
      }
      tooltip={Tooltips.REPORTING_VIEW}
    />
  );
};

export default ReportingViewQuickPick;
