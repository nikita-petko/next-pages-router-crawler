import type { FC } from 'react';
import React, { useCallback, useMemo } from 'react';
import { Divider } from '@rbx/foundation-ui';
import type { TLabelTooltipConfig } from '@rbx/foundation-ui';
import ComboboxTypeahead, {
  ComboboxTypeaheadOption,
} from '@modules/charts-generic/components/ComboboxTypeahead';
import {
  groupMetricsByCategory,
  type MetricGroup,
} from '@modules/experience-analytics-shared/components/chartConfigurator/utils/chartConfiguratorMetricGrouping';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import type { TAlertConditionMetric } from '../../constants/types';

function filterGroups(groups: MetricGroup[], query: string): MetricGroup[] {
  if (!query) {
    return groups;
  }
  const lowerQuery = query.toLowerCase();
  return groups
    .map((group) => {
      const groupMatches = group.groupLabel.toLowerCase().includes(lowerQuery);
      return {
        ...group,
        metrics: groupMatches
          ? group.metrics
          : group.metrics.filter((m) => m.label.toLowerCase().includes(lowerQuery)),
      };
    })
    .filter((group) => group.metrics.length > 0);
}

export type AlertConditionMetricTypeaheadProps = {
  options: TAlertConditionMetric[];
  value: TAlertConditionMetric | null;
  onChange: (value: TAlertConditionMetric | null) => void;
  label: string;
  labelTooltip?: TLabelTooltipConfig;
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
  labelTooltip,
  placeholder,
  hasError,
  error,
  onBlur,
}) => {
  const { translate } = useRAQIV2TranslationDependencies();

  const groups = useMemo(() => groupMetricsByCategory(options, translate), [options, translate]);

  const selectedLabel = useMemo(() => {
    if (!value) {
      return '';
    }
    const match = groups.flatMap((group) => group.metrics).find((m) => m.metric === value);
    return match ? match.label : '';
  }, [value, groups]);

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
      labelTooltip={labelTooltip}
      placeholder={placeholder}
      selectedLabel={selectedLabel}
      hasResults={groups.length > 0}
      hasError={hasError}
      error={error}
      onBlur={onBlur}>
      {({ searchText, close }) => {
        const filtered = filterGroups(groups, searchText);
        return filtered.map((group, idx) => (
          <React.Fragment key={group.groupKey.key}>
            {idx > 0 && <Divider variant='Standard' />}
            <div className='padding-y-small'>
              <div
                role='none'
                className='padding-x-medium padding-y-small text-caption-medium content-default bg-surface-100 sticky top-[0px] [z-index:1]'>
                {group.groupLabel}
              </div>
              {group.metrics.map(({ metric, label: metricLabel }) => (
                <ComboboxTypeaheadOption
                  key={metric}
                  label={metricLabel}
                  isSelected={value === metric}
                  onClick={() => handleSelect(metric, close)}
                />
              ))}
            </div>
          </React.Fragment>
        ));
      }}
    </ComboboxTypeahead>
  );
};

export default AlertConditionMetricTypeahead;
