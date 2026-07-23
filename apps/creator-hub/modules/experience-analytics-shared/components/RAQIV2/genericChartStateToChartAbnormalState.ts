import { ChartAbnormalStatus } from '@rbx/analytics-ui';
import type {
  TranslationKeyToFormattedText,
  TPendingTranslationFunction,
} from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { GenericChartState } from '@modules/charts-generic/charts/types/ChartTypes';
import {
  isRAQIQueryError,
  RAQIQueryErrorCode,
  RAQIQueryValidationField,
} from '@modules/clients/analytics';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { isAceDagExecutionError } from '../../utils/AceDagExecutionError';
import { isComputedMetricDagExecutionError } from '../../utils/computedMetrics/ComputedMetricDagExecutionError';
import {
  RAQIV2ValidationError,
  RAQIV2ValidationErrorType,
} from '../../utils/validateRAQIV2Request';

/**
 * Compile-time exhaustiveness guard for switch statements. Called from a
 * `default:` branch with a value the type system should have narrowed to
 * `never`; if a new enum variant is added without a matching case, the
 * argument won't be `never` and the call site fails to compile. The
 * runtime throw is defensive — it's genuinely unreachable for current
 * proto variants because `parseValidationFieldFromWire` funnels unknown
 * wire tokens through `undefined` (which has its own case). Surfacing
 * the assertion as a Sentry error beats silently rendering incorrect
 * copy if something ever bypasses the type system.
 */
const assertExhaustive = (value: never): never => {
  throw new Error(`Unhandled RAQIQueryValidationField variant: ${String(value)}`);
};

const isKnownRAQIQueryErrorCode = (code: number): code is RAQIQueryErrorCode =>
  code in RAQIQueryErrorCode;

/** Figma Custom Dashboards 2384-62450 empty/error copy helpers. */
const noDataForSelectedFilter = (tPendingTranslation: TPendingTranslationFunction) => ({
  status: ChartAbnormalStatus.NoData as const,
  description: tPendingTranslation(
    'No data for selected filter',
    'Chart empty-state title when the selected filter yields no data or is unsupported',
    translationKey('Message.NoDataForSelectedFilterTitle', TranslationNamespace.Analytics),
  ),
  secondaryDescription: tPendingTranslation(
    'Try changing the filters or search',
    'Chart empty-state secondary guidance when the selected filter yields no data',
    translationKey('Message.NoDataForSelectedFilterSecondary', TranslationNamespace.Analytics),
  ),
});

const noDataForSelectedBreakdown = (tPendingTranslation: TPendingTranslationFunction) => ({
  status: ChartAbnormalStatus.NoData as const,
  description: tPendingTranslation(
    'No data for selected breakdown',
    'Chart empty-state title when the selected breakdown yields no data or is unsupported',
    translationKey('Message.NoDataForSelectedBreakdownTitle', TranslationNamespace.Analytics),
  ),
  secondaryDescription: tPendingTranslation(
    'Try changing the breakdown',
    'Chart empty-state secondary guidance when the selected breakdown yields no data',
    translationKey('Message.NoDataForSelectedBreakdownSecondary', TranslationNamespace.Analytics),
  ),
});

const noDataForSelectedTimeInterval = (tPendingTranslation: TPendingTranslationFunction) => ({
  status: ChartAbnormalStatus.NoData as const,
  description: tPendingTranslation(
    'No data for selected time interval',
    'Chart empty-state title when the selected time interval yields no data or is unsupported',
    translationKey('Message.NoDataForSelectedTimeIntervalTitle', TranslationNamespace.Analytics),
  ),
  secondaryDescription: tPendingTranslation(
    'Try changing the interval',
    'Chart empty-state secondary guidance when the selected time interval yields no data',
    translationKey(
      'Message.NoDataForSelectedTimeIntervalSecondary',
      TranslationNamespace.Analytics,
    ),
  ),
});

const requestFailed = (tPendingTranslation: TPendingTranslationFunction) => ({
  status: ChartAbnormalStatus.Error as const,
  description: tPendingTranslation(
    'Request failed',
    'Chart error-state title when a data request fails',
    translationKey('Message.RequestFailedTitle', TranslationNamespace.Analytics),
  ),
  secondaryDescription: tPendingTranslation(
    'Please try again later',
    'Chart error-state secondary guidance when a data request fails',
    translationKey('Message.RequestFailedSecondary', TranslationNamespace.Analytics),
  ),
});

const noAccess = (tPendingTranslation: TPendingTranslationFunction) => ({
  status: ChartAbnormalStatus.NoAccess as const,
  description: tPendingTranslation(
    'No access',
    'Chart empty-state title when the user lacks permission to view the chart',
    translationKey('Message.NoAccessTitle', TranslationNamespace.Analytics),
  ),
  secondaryDescription: tPendingTranslation(
    'Contact the owner to grant you permission or switch accounts',
    'Chart empty-state secondary guidance when the user lacks permission to view the chart',
    translationKey('Message.NoAccessSecondary', TranslationNamespace.Analytics),
  ),
});

const genericChartStateToChartAbnormalState = ({
  state,
  hasNoData,
  translate,
  tPendingTranslation,
}: {
  state: GenericChartState;
  hasNoData?: boolean;
  translate: TranslationKeyToFormattedText;
  tPendingTranslation: TPendingTranslationFunction;
}) => {
  const { isDataLoading, isUserForbidden, isResponseFailed, error } = state;
  if (isDataLoading) {
    return {
      status: ChartAbnormalStatus.Loading,
    };
  }
  if (isUserForbidden) {
    return noAccess(tPendingTranslation);
  }
  if (isResponseFailed) {
    if (error instanceof RAQIV2ValidationError) {
      switch (error.type) {
        case RAQIV2ValidationErrorType.UnsupportedGranularity:
          return noDataForSelectedTimeInterval(tPendingTranslation);
        case RAQIV2ValidationErrorType.UnsupportedBreakdown:
          return noDataForSelectedBreakdown(tPendingTranslation);
        case RAQIV2ValidationErrorType.UnsupportedFilter:
        case RAQIV2ValidationErrorType.UnsupportedFilterValue:
          return noDataForSelectedFilter(tPendingTranslation);
        default:
          return requestFailed(tPendingTranslation);
      }
    }
    if (isComputedMetricDagExecutionError(error)) {
      // Generic ACE execution error copy. Per-kind copy (formula too deep
      // vs too many nodes vs too costly) lands in a follow-up PR after the
      // typed `ComplexityExceededDetails` proto sub-message arrives on the
      // wire (DSA-5742); shipping a single recoverable error message now
      // is enough to prevent the page crash from DSA-5741 without coupling
      // the user-visible fix to backend codegen.
      return {
        status: ChartAbnormalStatus.Error,
        description: tPendingTranslation(
          'Unable to compute this formula. Check the formula and metric sources, then try again.',
          'Chart error message when computed metric formula execution fails',
          translationKey('Message.ComputedMetricExecutionFailed', TranslationNamespace.Analytics),
        ),
      };
    }
    if (isAceDagExecutionError(error)) {
      // Any other ACE DAG execution failure (e.g. metric variant fanout,
      // DSA-5784). Falls back to the generic recoverable request-failure copy
      // rather than the computed-metric formula message above, which would
      // misdescribe a non-formula failure.
      return requestFailed(tPendingTranslation);
    }
    if (isRAQIQueryError(error)) {
      // Codes are the bounded public contract; internal details stay in
      // Sentry + backend logs.
      const errorCode =
        error.isKnownCode && isKnownRAQIQueryErrorCode(error.code) ? error.code : undefined;
      switch (errorCode) {
        case RAQIQueryErrorCode.QueryValidationFailed: {
          // When the backend attributed the validation failure to a specific
          // request field (see QueryError.validation_details in
          // shared.proto), render copy that matches the field so the user
          // knows which selection to adjust. Dimension names / values are
          // intentionally not interpolated into the copy — they aren't
          // localized at this layer; the structured details still land on
          // the RAQIQueryError for programmatic consumers and Sentry. When
          // the field is absent or unknown we fall back to the "no data for
          // filter" copy the UI has always used for opaque validation
          // failures.
          //
          // The client-side early-fail validator
          // (`validateRAQIV2Request`) renders parallel copy for the same
          // classes of failure. The two paths intentionally mirror each
          // other: the client catches what it can from codegen'd config
          // for zero-round-trip feedback, and the backend stays the source
          // of truth for anything dynamic or config-lagging.
          const field = error.validationDetails?.field;
          switch (field) {
            case RAQIQueryValidationField.Filter:
              return noDataForSelectedFilter(tPendingTranslation);
            case RAQIQueryValidationField.Granularity:
              return noDataForSelectedTimeInterval(tPendingTranslation);
            case RAQIQueryValidationField.TimeRange:
              return {
                status: ChartAbnormalStatus.NoData,
                description: tPendingTranslation(
                  "The selected time range isn't supported for this chart. Adjust the range and try again.",
                  'Empty state message when the requested time range was rejected by the backend',
                  translationKey(
                    'Message.UnsupportedTimeRangeForChart',
                    TranslationNamespace.Analytics,
                  ),
                ),
              };
            case RAQIQueryValidationField.Breakdown:
              return noDataForSelectedBreakdown(tPendingTranslation);
            case RAQIQueryValidationField.Metric:
            case undefined:
              return noDataForSelectedFilter(tPendingTranslation);
            default:
              // Adding a new RAQIQueryValidationField variant without a
              // matching case above is a compile error here — see
              // `assertExhaustive`.
              return assertExhaustive(field);
          }
        }
        case RAQIQueryErrorCode.QueryTransientFailure:
          return {
            status: ChartAbnormalStatus.Error,
            description: tPendingTranslation(
              "Couldn't load this chart. Please try again in a moment.",
              'Empty state message for charts that failed due to a transient backend issue',
              translationKey('Message.QueryTransientFailure', TranslationNamespace.Analytics),
            ),
          };
        case undefined:
        case RAQIQueryErrorCode.QueryFailed:
        default:
          return requestFailed(tPendingTranslation);
      }
    }
    return requestFailed(tPendingTranslation);
  }
  // NOTE(gperkins@ 20220907): meaning there are no *time series*, not merely no data points in one series
  if (hasNoData) {
    return {
      status: ChartAbnormalStatus.NoData,
      description: translate(
        translationKey('Message.NoDataReturn', TranslationNamespace.Analytics),
      ),
    };
  }
  return undefined;
};

export default genericChartStateToChartAbnormalState;
