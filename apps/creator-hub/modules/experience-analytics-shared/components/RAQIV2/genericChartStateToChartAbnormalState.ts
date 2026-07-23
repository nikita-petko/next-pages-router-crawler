import { GenericChartState } from '@modules/charts-generic';
import {
  translationKey,
  TranslationKeyToFormattedText,
  type FormattedText,
  type TPendingTranslationFunction,
} from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { ChartAbnormalStatus } from '@rbx/analytics-ui';
import {
  RAQIV2ValidationError,
  RAQIV2ValidationErrorType,
} from '../../utils/validateRAQIV2Request';

const genericChartStateToChartAbnormalState = ({
  state,
  hasNoData,
  translate,
  tPendingTranslation,
}: {
  state: GenericChartState;
  hasNoData?: boolean;
  translate: TranslationKeyToFormattedText;
  tPendingTranslation?: TPendingTranslationFunction;
}) => {
  // eslint-disable-next-line deprecation/deprecation -- TODO(shumingxu, 05/19/2025): Remove in DSA-4491
  const { isDataLoading, isUserForbidden, isResponseFailed, isNoDataAvailable, error } = state;
  if (isDataLoading)
    return {
      status: ChartAbnormalStatus.Loading,
    };
  if (isUserForbidden)
    return {
      status: ChartAbnormalStatus.NoAccess,
      description: translate(
        translationKey('Message.UserHasNoPermission', TranslationNamespace.Analytics),
      ),
    };
  if (isResponseFailed) {
    if (error instanceof RAQIV2ValidationError) {
      switch (error.type) {
        case RAQIV2ValidationErrorType.UnsupportedGranularity:
          return {
            status: ChartAbnormalStatus.NoData,
            description: (tPendingTranslation?.(
              'This chart does not support the selected time interval.',
              'Empty state message for charts with unsupported granularity',
              translationKey(
                'Message.UnsupportedGranularityForChart',
                TranslationNamespace.Analytics,
              ),
            ) ?? 'This chart does not support the selected time interval.') as FormattedText,
          };
        case RAQIV2ValidationErrorType.UnsupportedBreakdown:
        case RAQIV2ValidationErrorType.UnsupportedFilter:
          return {
            status: ChartAbnormalStatus.NoData,
            description: translate(
              translationKey('Message.NoDataForSelectedFilter', TranslationNamespace.Analytics),
            ),
          };
        default:
          return {
            status: ChartAbnormalStatus.Error,
            description: translate(
              translationKey('Message.RequestFailure', TranslationNamespace.Analytics),
            ),
          };
      }
    }
    return {
      status: ChartAbnormalStatus.Error,
      description: translate(
        translationKey('Message.RequestFailure', TranslationNamespace.Analytics),
      ),
    };
  }
  if (isNoDataAvailable)
    return {
      status: ChartAbnormalStatus.NoData,
      description: translate(
        translationKey('Message.NoDataForSelectedFilter', TranslationNamespace.Analytics),
      ),
    };
  // NOTE(gperkins@ 20220907): meaning there are no *time series*, not merely no data points in one series
  if (hasNoData)
    return {
      status: ChartAbnormalStatus.NoData,
      description: translate(
        translationKey('Message.NoDataReturn', TranslationNamespace.Analytics),
      ),
    };
  return undefined;
};

export default genericChartStateToChartAbnormalState;
