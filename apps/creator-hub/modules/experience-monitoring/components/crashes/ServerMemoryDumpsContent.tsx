import React, { FC, useCallback, useState, useMemo } from 'react';
import { Grid, WarningIcon } from '@rbx/ui';
import { translationKey, TranslationKeyOrFormattedTextType } from '@modules/analytics-translations';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import {
  GenericTreemapChart,
  useRAQIV2TranslationDependencies,
} from '@modules/experience-analytics-shared';
import { formatNumberWithSpec } from '@modules/charts-generic';
import type { TreemapRootNodeChangedEvent, SingleChartCardContainerProps } from '@rbx/analytics-ui';
import { FeatureFlagNamespace } from '@modules/feature-flags/namespaces';
import { useFeatureFlagsForNamespace } from '@modules/feature-flags/context/FeatureFlagsProvider';
import ServerMemoryDumpsTable from './ServerMemoryDumpsTable';
import { useServerMemoryDumpsData } from './ServerMemoryDumpsDataProvider';

type ChartSummarySpecs = SingleChartCardContainerProps['chartSummarySpecs'];
const EMPTY_CHART_SUMMARY_SPECS: ChartSummarySpecs = [];

const ServerMemoryDumpsContent: FC = () => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { selectedCrashDumpFile, selectedCrashDumpFileState } = useServerMemoryDumpsData();
  const { isTreemapColorBySiblingProportionEnabled } = useFeatureFlagsForNamespace(
    ['isTreemapColorBySiblingProportionEnabled'],
    FeatureFlagNamespace.Analytics,
  );
  const [chartSummarySpecs, setChartSummarySpecs] =
    useState<ChartSummarySpecs>(EMPTY_CHART_SUMMARY_SPECS);

  const handleOnRootNodeChanged = useCallback(
    (event: TreemapRootNodeChangedEvent) => {
      const { newRootId } = event;

      // An empty newRootId means we're at the top level; use 'root' to find first-layer children.
      const effectiveRootId = newRootId || 'root';

      const children = selectedCrashDumpFile.filter((point) => point.parent === effectiveRootId);
      if (children.length === 0) {
        setChartSummarySpecs(EMPTY_CHART_SUMMARY_SPECS);
        return;
      }

      const largestChild = children.reduce((max, child) => (child.value > max.value ? child : max));
      setChartSummarySpecs([
        {
          key: largestChild.id,
          summaryValue: largestChild.name,
          description: translationDependencies.translate(
            translationKey('Description.ServerMemorySnapshot', TranslationNamespace.Analytics),
          ),
        },
      ]);
    },
    [selectedCrashDumpFile, translationDependencies],
  );

  const dataLabelFormatter = useCallback(
    (value: number) =>
      String(
        formatNumberWithSpec(
          value,
          {
            abbreviate: false,
            suffix: {
              type: TranslationKeyOrFormattedTextType.PredefinedTranslationKey,
              key: translationKey('Label.BytesSuffix', TranslationNamespace.Analytics),
            },
            numberFormatOptions: {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            },
          },
          translationDependencies,
        ),
      ),
    [translationDependencies],
  );

  const warnings = useMemo(
    () => [
      <span key='memoryDumpApproximationsWarning'>
        <WarningIcon
          fontSize='small'
          color='inherit'
          style={{ marginRight: '5px', verticalAlign: 'text-bottom' }}
        />
        {translationDependencies.translate(
          translationKey('Warning.ServerMemoryDumpApproximations', TranslationNamespace.Analytics),
        )}
      </span>,
    ],
    [translationDependencies],
  );

  return (
    <Grid container spacing={2}>
      <Grid item XSmall={12} Medium={5}>
        <ServerMemoryDumpsTable />
      </Grid>
      <Grid item XSmall={12} Medium={7}>
        <GenericTreemapChart
          data={selectedCrashDumpFile}
          rootName={translationDependencies.translate(
            translationKey('Title.MemorySnapshot', TranslationNamespace.Analytics),
          )}
          minDisplayPercentage={0.5}
          requestStatus={selectedCrashDumpFileState}
          titleKey={translationKey('Title.MemorySnapshot', TranslationNamespace.Analytics)}
          noDataMessage={translationKey(
            'Message.SelectSnapshotToView',
            TranslationNamespace.Analytics,
          )}
          dataLabelFormatter={dataLabelFormatter}
          chartHeight={495}
          onRootNodeChanged={handleOnRootNodeChanged}
          chartSummarySpecs={chartSummarySpecs}
          colorBySiblingProportion={isTreemapColorBySiblingProportionEnabled}
          exportFileName={translationDependencies.translate(
            translationKey('Title.MemorySnapshot', TranslationNamespace.Analytics),
          )}
          chartWarnings={warnings}
        />
      </Grid>
    </Grid>
  );
};

export default ServerMemoryDumpsContent;
