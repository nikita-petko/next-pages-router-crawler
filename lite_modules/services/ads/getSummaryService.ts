import adsClient from '@clients/ads';
import { UNIFIED_ATTRIBUTION_TRACING_HEADERS } from '@constants/debugging';
import { EntityType } from '@constants/entity';
import ReportingViewType from '@constants/reportingViewType';
import { AdAccountSummary, AdAccountSummaryRequest } from '@type/reportingStats';

export const getAdAccountSummary = async ({
  abortSignal,
  reportingView,
  requestTimestamp,
  timePeriod,
  universeId,
}: AdAccountSummaryRequest) => {
  let universeIdSection = '';
  if (universeId) {
    universeIdSection = `&universe_id=${universeId}`;
  }
  const headers =
    reportingView !== undefined &&
    reportingView !== ReportingViewType.REPORTING_VIEW_TYPE_UNSPECIFIED
      ? UNIFIED_ATTRIBUTION_TRACING_HEADERS
      : undefined;

  const response = await adsClient.get<AdAccountSummary>({
    abortSignal,
    headers,
    url: `/v2/native/adAccountSummary/dateFilter?entity_type=${EntityType.ENTITY_TYPE_CAMPAIGN}&request_timestamp=${requestTimestamp}&time_period=${timePeriod}&reporting_view=${reportingView}${universeIdSection}`,
  });
  return response.data;
};
