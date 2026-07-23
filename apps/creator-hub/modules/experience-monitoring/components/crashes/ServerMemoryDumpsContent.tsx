import type { FC } from 'react';
import { useCallback, useState, useMemo } from 'react';
import type { TreemapRootNodeChangedEvent, SingleChartCardContainerProps } from '@rbx/analytics-ui';
import { useFlag } from '@rbx/flags';
import { Grid, WarningIcon } from '@rbx/ui';
import { isTreemapColorBySiblingProportionEnabled as isTreemapColorBySiblingProportionEnabledFlag } from '@generated/flags/creatorAnalytics';
import { TranslationKeyOrFormattedTextType } from '@modules/analytics-translations/types';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { formatNumberWithSpec } from '@modules/charts-generic/charts/numberFormatters';
import GenericTreemapChart from '@modules/experience-analytics-shared/components/RAQIV2/GenericTreemapChart';
import useRAQIV2TranslationDependencies from '@modules/experience-analytics-shared/hooks/useRAQIV2TranslationDependencies';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useServerMemoryDumpsData } from './ServerMemoryDumpsDataProvider';
import ServerMemoryDumpsTable from './ServerMemoryDumpsTable';

type ChartSummarySpecs = SingleChartCardContainerProps['chartSummarySpecs'];
const EMPTY_CHART_SUMMARY_SPECS: ChartSummarySpecs = [];

/**
 * Threshold (in percent of root total) below which the treemap collapses
 * sibling nodes into a single "Other" tile. Surfaced both to the chart and to
 * the warning copy so the two stay in lockstep.
 */
const MIN_DISPLAY_PERCENTAGE = 0.5;

const ServerMemoryDumpsContent: FC = () => {
  const translationDependencies = useRAQIV2TranslationDependencies();
  const { selectedCrashDumpFile, selectedCrashDumpFileState } = useServerMemoryDumpsData();
  const {
    ready: isTreemapColorBySiblingProportionReady,
    value: isTreemapColorBySiblingProportionEnabledValue,
  } = useFlag(isTreemapColorBySiblingProportionEnabledFlag);
  const isTreemapColorBySiblingProportionEnabled =
    isTreemapColorBySiblingProportionReady && isTreemapColorBySiblingProportionEnabledValue;
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
          className='margin-right-[5px] text-align-y-[text-bottom]'
        />
        {translationDependencies.translate(
          translationKey('Warning.ServerMemoryDumpApproximations', TranslationNamespace.Analytics),
        )}
      </span>,
      <span key='memoryDumpSmallNodesGroupedWarning'>
        <WarningIcon
          fontSize='small'
          color='inherit'
          className='margin-right-[5px] text-align-y-[text-bottom]'
        />
        {translationDependencies.translate(
          translationKey(
            'Warning.ServerMemoryDumpSmallNodesGrouped',
            TranslationNamespace.Analytics,
          ),
          { percentage: String(MIN_DISPLAY_PERCENTAGE) },
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
          minDisplayPercentage={MIN_DISPLAY_PERCENTAGE}
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
