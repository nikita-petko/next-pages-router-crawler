import React, { ReactNode, useMemo } from 'react';
import { TRAQIV2UIMetric } from '@rbx/creator-hub-analytics-config';
import { WarningIcon } from '@rbx/ui';
import useRAQIV2TranslationDependencies from './useRAQIV2TranslationDependencies';
import { useChartWarningConfiguration } from './useStatusConfiguration';

const useStatusConfigChartWarning = (
  metrics: TRAQIV2UIMetric[],
  universeId?: number,
): ReactNode[] => {
  const { translate } = useRAQIV2TranslationDependencies();
  const chartWarningConfigs = useChartWarningConfiguration(metrics, universeId);

  return useMemo(
    () =>
      chartWarningConfigs.map((config) => {
        return (
          <span key={config.descriptionKey.key}>
            <WarningIcon
              fontSize='small'
              color='inherit'
              style={{ marginRight: '5px', verticalAlign: 'text-bottom' }}
            />
            {translate(config.descriptionKey)}
          </span>
        );
      }),
    [chartWarningConfigs, translate],
  );
};

export default useStatusConfigChartWarning;
