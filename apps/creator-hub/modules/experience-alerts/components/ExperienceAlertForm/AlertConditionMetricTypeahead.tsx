import { FC, useCallback, useMemo } from 'react';
import { ComboboxTypeahead, ComboboxTypeaheadOption } from '@modules/charts-generic';
import {
  getAnalyticsMetricDisplayConfig,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { FormattedText } from '@modules/analytics-translations';
import type { TAlertConditionMetric } from '../../constants/types';

export type AlertConditionMetricTypeaheadProps = {
  options: TAlertConditionMetric[];
  value: TAlertConditionMetric | null;
  onChange: (value: TAlertConditionMetric | null) => void;
  label: string;
  placeholder: string;
  hasError?: boolean;
  error?: string;
  onBlur?: () => void;
};

const AlertConditionMetricTypeahead: FC<AlertConditionMetricTypeaheadProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder,
  hasError,
  error,
  onBlur,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const metricsWithLabels = useMemo(() => {
    const rows: Array<{ metric: TAlertConditionMetric; label: FormattedText }> = [];
    options.forEach((metric) => {
      const { localizedName } = getAnalyticsMetricDisplayConfig(metric);
      const translatedLabel = localizedName ? translate(localizedName) : null;
      if (translatedLabel) {
        rows.push({ metric, label: translatedLabel });
      }
    });
    return rows;
  }, [options, translate]);

  const selectedLabel = useMemo(() => {
    if (!value) return '';
    const match = metricsWithLabels.find((m) => m.metric === value);
    return match ? match.label : '';
  }, [value, metricsWithLabels]);

  const handleSelect = useCallback(
    (metric: TAlertConditionMetric, close: () => void) => {
      onChange(metric);
      close();
    },
    [onChange],
  );

  return (
    <ComboboxTypeahead
      label={label}
      placeholder={placeholder}
      selectedLabel={selectedLabel}
      hasResults={metricsWithLabels.length > 0}
      hasError={hasError}
      error={error}
      onBlur={onBlur}>
      {({ searchText, close }) => {
        const query = searchText.trim().toLowerCase();
        const filtered = query
          ? metricsWithLabels.filter((metricsWithLabel) =>
              metricsWithLabel.label.toLowerCase().includes(query),
            )
          : metricsWithLabels;
        return filtered.map(({ metric, label: metricLabel }) => (
          <ComboboxTypeaheadOption
            key={metric}
            label={metricLabel}
            isSelected={value === metric}
            onClick={() => handleSelect(metric, close)}
          />
        ));
      }}
    </ComboboxTypeahead>
  );
};

export default AlertConditionMetricTypeahead;
