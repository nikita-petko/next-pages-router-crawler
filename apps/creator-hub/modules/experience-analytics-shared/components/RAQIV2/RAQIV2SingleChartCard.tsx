import type { ComponentProps, ReactNode } from 'react';
import { SingleChartCardContainer, type SingleChartCardContainerProps } from '@rbx/analytics-ui';
import type { TSystemBannerProps } from '@rbx/foundation-ui';
import ChartFooter from '@modules/charts-generic/charts/ChartFooter';
import type GenericCsvExporter from '@modules/charts-generic/charts/exporters/GenericCsvExporter';
import type { TimeSeriesAnnotation } from '@modules/charts-generic/charts/types/Annotations';
import type { ChartLocation } from '@modules/charts-generic/context/ChartLocation';
import type { ChartConfigOrPredefinedKey } from '../../constants/RAQIV2PredefinedChartConfig';
import type RAQIV2ChartSpec from '../../types/RAQIV2ChartSpec';
import ChartActionsSlot from './ChartActionsSlot';
import type { ChartHeaderActionLayout } from './composeChartHeaderActions';

export type RAQIV2ChartActionLayout = ChartHeaderActionLayout;

type RAQIV2SingleChartCardProps = {
  readonly titleLabel: string;
  readonly titleTooltipLabel?: string;
  readonly chartSummarySpecs: SingleChartCardContainerProps['chartSummarySpecs'];
  readonly chartKeyOrConfig: ChartConfigOrPredefinedKey | null;
  readonly spec: RAQIV2ChartSpec;
  readonly kpiType: string;
  readonly exporter: GenericCsvExporter;
  readonly chartLocation?: ChartLocation;
  readonly visibleTimeSeriesAnnotations?: readonly TimeSeriesAnnotation[];
  readonly chartControl?: React.JSX.Element | null;
  readonly chartBanner?: TSystemBannerProps;
  readonly chartWarnings?: ReactNode[];
  readonly footerProps?: Partial<ComponentProps<typeof ChartFooter>>;
  readonly alwaysRenderFooter?: boolean;
  readonly abnormalState?: SingleChartCardContainerProps['abnormalState'];
  readonly slots?: SingleChartCardContainerProps['slots'];
  readonly actionLayout?: RAQIV2ChartActionLayout;
  readonly children: ReactNode;
};

export const downloadOnlyChartActionLayout = {
  showExploreAction: false,
} satisfies RAQIV2ChartActionLayout;

export default function RAQIV2SingleChartCard({
  titleLabel,
  titleTooltipLabel,
  chartSummarySpecs,
  chartKeyOrConfig,
  spec,
  kpiType,
  exporter,
  chartLocation,
  visibleTimeSeriesAnnotations,
  chartControl,
  chartBanner,
  chartWarnings,
  footerProps,
  alwaysRenderFooter = false,
  abnormalState,
  slots,
  actionLayout,
  children,
}: RAQIV2SingleChartCardProps) {
  return (
    <ChartActionsSlot
      chartKeyOrConfig={chartKeyOrConfig}
      spec={spec}
      kpiType={kpiType}
      exporter={exporter}
      chartLocation={chartLocation}
      visibleTimeSeriesAnnotations={visibleTimeSeriesAnnotations}
      actionLayout={actionLayout}
      downloadDisabled={!!abnormalState}>
      {({ headerActionItems }) => (
        <SingleChartCardContainer
          titleLabel={titleLabel}
          titleTooltipLabel={titleTooltipLabel}
          chartSummarySpecs={chartSummarySpecs}
          headerActionItems={headerActionItems}
          chartControl={chartControl}
          chartBanner={chartBanner}
          footerContent={
            alwaysRenderFooter || chartWarnings?.length || footerProps?.actionLink ? (
              <ChartFooter warnings={chartWarnings ?? []} {...footerProps} />
            ) : undefined
          }
          abnormalState={abnormalState}
          slots={slots}>
          {children}
        </SingleChartCardContainer>
      )}
    </ChartActionsSlot>
  );
}
