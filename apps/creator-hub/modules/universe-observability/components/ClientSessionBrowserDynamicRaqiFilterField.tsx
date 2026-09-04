import { useMemo, type FC } from 'react';
import { useController, useFormContext } from 'react-hook-form';
import {
  RAQIV2APIMetric,
  RAQIV2Dimension,
  RAQIV2Metric,
  type TRAQIV2APIMetric,
} from '@rbx/creator-hub-analytics-config';
import { Alert } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import type { FormattedText } from '@modules/analytics-translations/types';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import {
  brandUntranslatableText,
  translationKey,
} from '@modules/analytics-translations/wrapperFunctions';
import MultiComboboxTypeahead from '@modules/charts-generic/components/MultiComboboxTypeahead';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useSessionBrowserRaqiDimensionValues, {
  type SessionBrowserRaqiDimensionValueSort,
} from '../hooks/useSessionBrowserRaqiDimensionValues';
import type { SessionBrowserDrawerFilters } from '../types/SessionBrowserFilters';

const EMPTY_SELECTED_OPTIONS: string[] = [];
const FUNNEL_CONTEXT_METRICS: readonly TRAQIV2APIMetric[] = [RAQIV2Metric.FunnelUserTotalCount];
const CUSTOM_EVENT_CONTEXT_METRICS: readonly TRAQIV2APIMetric[] = [
  RAQIV2APIMetric.CustomEventCount,
];

const DYNAMIC_RAQI_FILTER_FIELDS = {
  funnelTags: {
    dimension: RAQIV2Dimension.FunnelName,
    contextMetrics: FUNNEL_CONTEXT_METRICS,
    sortMode: 'dimensionConfig',
  },
  customTags: {
    dimension: RAQIV2Dimension.CustomEventName,
    contextMetrics: CUSTOM_EVENT_CONTEXT_METRICS,
    sortMode: 'localeCompare',
  },
} as const satisfies Record<
  'funnelTags' | 'customTags',
  {
    readonly dimension: RAQIV2Dimension;
    readonly contextMetrics: readonly TRAQIV2APIMetric[];
    readonly sortMode: SessionBrowserRaqiDimensionValueSort;
  }
>;

/** Option values are creator-authored event names, so they render as-is. */
const formatOptionLiteral = (option: string): FormattedText => brandUntranslatableText(option);

export type ClientSessionBrowserDynamicRaqiFilterFieldProps = {
  readonly name: keyof typeof DYNAMIC_RAQI_FILTER_FIELDS;
  readonly universeId: number;
  readonly label: FormattedText;
  readonly searchPlaceholder: FormattedText;
  readonly noValuesAvailableLabel: FormattedText;
  readonly loadErrorLabel: FormattedText;
};

const ClientSessionBrowserDynamicRaqiFilterField: FC<
  ClientSessionBrowserDynamicRaqiFilterFieldProps
> = ({ name, universeId, label, searchPlaceholder, noValuesAvailableLabel, loadErrorLabel }) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const retryLabel = translate(translationKey('Action.TryAgain', TranslationNamespace.Analytics));
  const { control } = useFormContext<SessionBrowserDrawerFilters>();
  const {
    field: { value: selectedValues, onChange },
  } = useController({ control, name });
  const { dimension, contextMetrics, sortMode } = DYNAMIC_RAQI_FILTER_FIELDS[name];
  const { options, isLoading, isError, refresh } = useSessionBrowserRaqiDimensionValues(
    universeId,
    dimension,
    contextMetrics,
    sortMode,
  );
  const selectedOptions = selectedValues ?? EMPTY_SELECTED_OPTIONS;
  const displayedOptions = useMemo(() => {
    const optionSet = new Set(options);
    return [...options, ...selectedOptions.filter((option) => !optionSet.has(option))];
  }, [options, selectedOptions]);
  const hasNoOptions = !isLoading && displayedOptions.length === 0;

  // A finished request with no usable options cannot open a listbox, so surface
  // retry instead of an empty combobox. Keep the combobox when options remain
  // (a later refresh failed or a selected value is stale) so existing choices
  // stay visible and removable.
  if (isError && displayedOptions.length === 0) {
    return (
      <Alert
        severity='Error'
        variant='Feedback'
        hasCloseAffordance={false}
        primaryActionLabel={retryLabel}
        onPrimaryAction={refresh}>
        {loadErrorLabel}
      </Alert>
    );
  }

  return (
    <MultiComboboxTypeahead
      size='Small'
      label={label}
      placeholder={hasNoOptions ? noValuesAvailableLabel : searchPlaceholder}
      options={displayedOptions}
      value={selectedOptions}
      setValue={onChange}
      getOptionLabel={formatOptionLiteral}
      isLoading={isLoading}
      error={isError ? loadErrorLabel : undefined}
      // The drawer body scrolls, so an inline listbox would be clipped.
      renderListboxInPortal
    />
  );
};

export default ClientSessionBrowserDynamicRaqiFilterField;
