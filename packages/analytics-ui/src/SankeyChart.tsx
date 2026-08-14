import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Chart, Options, Point, SeriesSankeyOptions } from 'highcharts';
import { IconButton } from '@rbx/foundation-ui';
import { useTheme } from '@rbx/ui';
import SankeyOverview, {
  DefaultOverviewMaxHeight,
  DefaultOverviewMaxWidth,
} from './charts/sankey/SankeyOverview';
import { useSankeyViewport } from './charts/sankey/useSankeyViewport';
import { ExtendedCategoricalChartColors, getChartThemedColors } from './color';
import GenericSeriesChart from './GenericSeriesChart';
import { useSankeyChartOptions } from './highchart-options/chartOptions';
import { useSankeyTooltipOptions } from './highchart-options/tooltipOptions';
import { ChartStyleMode, ChartType } from './types/BaseChart';
import type {
  SankeyChartProps,
  SankeyLink,
  SankeyNode,
  SankeyZoomAction,
} from './types/SankeyChart';
import { applySankeyNodePresentation } from './utils/applySankeyNodePresentation';
import { computeSankeyContentSize } from './utils/computeSankeyContentSize';
import {
  extractSankeyOverviewModel,
  type SankeyOverviewModel,
} from './utils/extractSankeyOverviewModel';
import {
  buildSankeyNodes,
  densifySankeyNodeColumns,
  resolveSankeyNodeLabel,
} from './utils/sankeyUtils';

/** Matches the other chart types in `ChartStyleMode.Normal` so cards line up. */
const DefaultHeight = 360;
const DefaultMaxHeight = 640;
const DefaultNodePadding = 16;
const DefaultNodeWidth = 8;
const DefaultNodeRadius = 4;
const DefaultLabelFontSize = 12;
const DefaultMaxZoom = 8;
const DefaultMinNodeThickness = 0;
const DefaultMinColumnWidth = 0;
/** Soft ribbons so gradients don't overpower the stage bars (design idle). */
const DefaultLinkOpacity = 0.2;
/** Hovered ribbon opacity (design on-hover). */
const HoverLinkOpacity = 1;
/**
 * Dimmed ribbon opacity when another node/link is hovered. Slightly above
 * Highcharts' 0.1 default so inactive paths stay readable as muted color.
 */
const InactiveLinkOpacity = 0.12;
const InactiveNodeOpacity = 0.25;
/** Pinned-focus opacities (click-to-focus). */
const FocusActiveLinkOpacity = 0.75;
const FocusDimmedLinkOpacity = 0.1;
const FocusDimmedNodeOpacity = 0.25;
/**
 * Background-colored stroke around stage bars. Half sits outside the fill
 * (via paint-order) so ribbons appear to stop short of the bar.
 */
const DefaultNodeBorderWidth = 4;
const DefaultOverviewHideDelayMs = 1200;

/**
 * Chrome classes rely on Creator Hub scanning `packages/analytics-ui` in
 * `tailwind.config.ts`. Keep that content path if these classes move or grow.
 *
 * Foundation Tailwind has no utilities for overflow, box-sizing, opacity or
 * transform-origin, and no tokens for absolute offsets, so those stay arbitrary.
 */
const RootClassName = 'relative width-full [overflow:hidden] [min-width:0]';
const ScrollContainerClassName =
  'relative width-full [overflow:auto] [overscroll-behavior:contain]';
/**
 * Applied only while zoom is on, where pointer handlers drive panning and the
 * browser must not claim the gesture. Without zoom the canvas scrolls natively.
 */
const PanTouchActionClassName = '[touch-action:none]';
const ZoomControlsClassName = 'absolute flex flex-col gap-xsmall top-[8px] right-[8px] [z-index:2]';
const OverviewContainerClassName =
  'absolute transition-opacity ease-standard-out bottom-[8px] left-[8px] [z-index:2]';
const OverviewVisibleClassName = 'pointer-events-auto [opacity:1]';
const OverviewHiddenClassName = 'pointer-events-none [opacity:0]';
/** Equal top/bottom padding centers short diagrams, so padding must not shrink the box. */
const CenteringWrapperClassName = '[box-sizing:content-box]';
const ClipClassName = '[overflow:hidden]';
const ChartStageClassName = '[overflow:hidden] [transform-origin:0_0]';

const ViewportTestId = 'sankey-viewport';

const ZoomAction = {
  ZoomIn: 'zoomIn',
  ZoomOut: 'zoomOut',
  ResetView: 'resetView',
} as const satisfies Record<string, SankeyZoomAction>;

/** Sankey points carry node identity that Highcharts' `Point` type omits. */
type SankeyPointContext = Point & {
  isNode?: boolean;
  id?: string;
};

const SankeyChart = ({
  data,
  tooltipFormatter,
  formatDataLabel,
  chartStyleMode = ChartStyleMode.Normal,
  height = DefaultHeight,
  onChartLoad,
  containerHeight: containerHeightProp,
  zoomLabelsFormatter,
}: SankeyChartProps) => {
  const { nodes: givenNodes, links } = data;
  const nodes = useMemo(() => densifySankeyNodeColumns(givenNodes), [givenNodes]);
  // The frame renders even while empty so the card keeps its height and the
  // ResizeObserver stays attached, leaving a measured width ready for data.
  // Highcharts itself only mounts once there is something to draw.
  const hasSeries = nodes.length > 0 && links.length > 0;
  const theme = useTheme();
  const { dataLabelText } = getChartThemedColors(theme);
  const nodeBorderColor = theme.palette.surface[0];

  const outerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const overviewHoverHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [focusedNodeId, setFocusedNodeId] = useState<string | undefined>(undefined);
  const [overviewModel, setOverviewModel] = useState<SankeyOverviewModel | undefined>(undefined);
  const [isOverviewHovered, setIsOverviewHovered] = useState(false);

  const { contentWidth, contentHeight } = useMemo(
    () =>
      computeSankeyContentSize({
        nodes,
        links,
        measuredWidth,
        height,
        nodeWidth: DefaultNodeWidth,
        nodePadding: DefaultNodePadding,
        minNodeThickness: DefaultMinNodeThickness,
        minColumnWidth: DefaultMinColumnWidth,
      }),
    [nodes, links, measuredWidth, height],
  );

  // Highcharts' `chart.update()` with `oneToOne` leaves stale sankey nodes
  // behind and skips relayout on size changes, so remounting on a key change
  // is the only reliable way to pick up new data or a new stage size.
  const chartKey = useMemo(
    () =>
      `${nodes.map((n: SankeyNode) => n.id).join(',')}|${links.map((l: SankeyLink) => `${l.from}:${l.to}`).join(',')}|${contentWidth}x${contentHeight}`,
    [nodes, links, contentWidth, contentHeight],
  );

  // Zoom is opt-in: without labels for the controls there is no affordance to
  // undo a gesture zoom, so gestures and the minimap stay off as well.
  const isZoomEnabled = zoomLabelsFormatter !== undefined;

  // Small funnels keep a zoom floor of 1; larger canvases can zoom out to fit.
  const fitZoom =
    measuredWidth > 0
      ? Math.min(1, measuredWidth / contentWidth, DefaultMaxHeight / contentHeight)
      : 1;

  const {
    scrollRef,
    zoom,
    viewport,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
    scrollTo,
    signalPanActivity,
    wasDraggedRef,
  } = useSankeyViewport({
    contentWidth,
    contentHeight,
    enabled: true,
    zoomEnabled: isZoomEnabled,
    minZoom: fitZoom,
    maxZoom: DefaultMaxZoom,
    panHideDelayMs: DefaultOverviewHideDelayMs,
  });

  const applyPresentation = useCallback(
    (chart: Chart) => {
      applySankeyNodePresentation(chart, {
        nodeRadius: DefaultNodeRadius,
        borderWidth: DefaultNodeBorderWidth,
        borderColor: nodeBorderColor,
        focusedNodeId,
        idleLinkOpacity: DefaultLinkOpacity,
        activeLinkOpacity: FocusActiveLinkOpacity,
        dimmedLinkOpacity: FocusDimmedLinkOpacity,
        dimmedNodeOpacity: FocusDimmedNodeOpacity,
      });
    },
    [focusedNodeId, nodeBorderColor],
  );

  const refreshOverviewModel = useCallback(
    (chart: Chart) => {
      if (!isZoomEnabled) {
        return;
      }
      const nextModel = extractSankeyOverviewModel(chart);
      setOverviewModel((previous) =>
        previous?.width === nextModel?.width &&
        previous?.height === nextModel?.height &&
        previous?.nodes.length === nextModel?.nodes.length &&
        previous?.links.length === nextModel?.links.length
          ? previous
          : nextModel,
      );
    },
    [isZoomEnabled],
  );

  const nodesById = useMemo(() => {
    const map = new Map<string, SankeyNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  const nodeFormatter = useCallback(
    function sankeyNodeLabelFormatter(this: SankeyPointContext): string | undefined {
      return resolveSankeyNodeLabel({
        nodeId: this.id ?? this.name,
        nodeName: this.name,
        nodesById,
        formatDataLabel,
      });
    },
    [formatDataLabel, nodesById],
  );

  const toggleFocus = useCallback((nodeId: string) => {
    setFocusedNodeId((current) => (current === nodeId ? undefined : nodeId));
  }, []);

  const clearFocus = useCallback(() => setFocusedNodeId(undefined), []);

  const series: SeriesSankeyOptions[] = useMemo(() => {
    if (links.length === 0 || nodes.length === 0) {
      return [];
    }

    return [
      {
        type: ChartType.Sankey,
        data: links,
        nodes: buildSankeyNodes({ nodes, colors: ExtendedCategoricalChartColors, theme }),
        nodePadding: DefaultNodePadding,
        nodeWidth: DefaultNodeWidth,
        linkOpacity: DefaultLinkOpacity,
        linkColorMode: 'gradient',
        // Highcharts uses minLinkWidth as a floor for both link and node thickness.
        minLinkWidth: DefaultMinNodeThickness,
        borderWidth: DefaultNodeBorderWidth,
        borderColor: nodeBorderColor,
        states: {
          hover: {
            linkOpacity: HoverLinkOpacity,
            opacity: 1,
          },
          inactive: {
            // When focus is pinned, presentation owns dimming; keep hover soft.
            linkOpacity: focusedNodeId ? DefaultLinkOpacity : InactiveLinkOpacity,
            opacity: focusedNodeId ? 1 : InactiveNodeOpacity,
          },
        },
        point: {
          events: {
            click(this: SankeyPointContext) {
              if (!this.isNode) {
                return;
              }
              const nodeId = this.id ?? this.name;
              if (nodeId) {
                toggleFocus(nodeId);
              }
            },
          },
        },
        dataLabels: {
          enabled: true,
          crop: false,
          overflow: 'allow',
          allowOverlap: true,
          verticalAlign: 'top',
          color: dataLabelText,
          padding: DefaultNodePadding,
          style: {
            textOutline: 'none',
            fontSize: `${DefaultLabelFontSize}px`,
            fontWeight: '400',
          },
          nodeFormatter,
        },
      },
    ];
  }, [
    links,
    nodes,
    theme,
    nodeBorderColor,
    focusedNodeId,
    toggleFocus,
    dataLabelText,
    nodeFormatter,
  ]);

  const chartOptions = useSankeyChartOptions({
    chartStyleMode,
    height: contentHeight,
    onChartLoad,
  });

  const chartOptionsWithPresentation = useMemo(
    () => ({
      ...chartOptions,
      width: contentWidth,
      events: {
        ...chartOptions.events,
        load(this: Chart, event: Event) {
          chartRef.current = this;
          chartOptions.events?.load?.call(this, event);
          applyPresentation(this);
          refreshOverviewModel(this);
        },
        render(this: Chart, event: Event) {
          chartRef.current = this;
          chartOptions.events?.render?.call(this, event);
          applyPresentation(this);
          refreshOverviewModel(this);
        },
      },
    }),
    [applyPresentation, refreshOverviewModel, chartOptions, contentWidth],
  );
  const tooltipOptions = useSankeyTooltipOptions(tooltipFormatter);

  const highchartsOptions: Options = useMemo(
    () => ({
      series,
      chart: chartOptionsWithPresentation,
      tooltip: tooltipOptions,
      title: { text: undefined },
      credits: { enabled: false },
    }),
    [series, chartOptionsWithPresentation, tooltipOptions],
  );

  // Observe the outer wrapper rather than the scroll viewport: inside a flex
  // card an overflow:auto viewport can report 0 width until Highcharts mounts.
  // The 1px threshold ignores jitter that would cause a re-measure loop.
  useLayoutEffect(() => {
    const element = outerRef.current;
    if (!element) {
      return undefined;
    }
    let lastWidth = 0;
    const applyWidth = (nextWidth: number) => {
      if (nextWidth > 0 && Math.abs(nextWidth - lastWidth) >= 1) {
        lastWidth = nextWidth;
        setMeasuredWidth(nextWidth);
      }
    };
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      applyWidth(entry.contentRect.width);
    });
    observer.observe(element);
    applyWidth(element.clientWidth);
    return () => observer.disconnect();
  }, []);

  // Re-apply presentation when focus changes without waiting for a Highcharts redraw.
  useLayoutEffect(() => {
    const chart = chartRef.current;
    if (chart) {
      applyPresentation(chart);
    }
  }, [applyPresentation]);

  // Clear focus when clicking empty canvas; ignore the click that ends a drag-pan.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element) {
      return undefined;
    }
    const handleClick = (event: MouseEvent): void => {
      if (wasDraggedRef.current) {
        wasDraggedRef.current = false;
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const nodeGroup = target?.closest('[data-sankey-node], [data-node-id]');
      if (nodeGroup) {
        return;
      }
      // Highcharts point click already toggles; background clears.
      if (!target?.closest('.highcharts-point')) {
        clearFocus();
      }
    };
    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, [scrollRef, clearFocus, wasDraggedRef]);

  const scaledWidth = contentWidth * zoom;
  const scaledHeight = contentHeight * zoom;
  // Fixed viewport when containerHeight is set; otherwise shrink-to-content with a cap.
  const viewportHeight = containerHeightProp ?? Math.min(scaledHeight, DefaultMaxHeight);
  const verticalCenterOffset =
    scaledHeight + 1 < viewportHeight ? (viewportHeight - scaledHeight) / 2 : 0;
  const clientWidth = viewport.clientWidth || measuredWidth;
  const overflows = scaledWidth > clientWidth + 1 || scaledHeight > viewportHeight + 1;
  const overviewMounted = isZoomEnabled && overflows && overviewModel !== undefined;
  const overviewVisible = overviewMounted && (isPanning || isOverviewHovered);

  const handleOverviewMouseEnter = useCallback(() => {
    if (overviewHoverHideTimerRef.current) {
      clearTimeout(overviewHoverHideTimerRef.current);
      overviewHoverHideTimerRef.current = null;
    }
    setIsOverviewHovered(true);
  }, []);

  const handleOverviewMouseLeave = useCallback(() => {
    if (overviewHoverHideTimerRef.current) {
      clearTimeout(overviewHoverHideTimerRef.current);
    }
    overviewHoverHideTimerRef.current = setTimeout(() => {
      setIsOverviewHovered(false);
      overviewHoverHideTimerRef.current = null;
    }, DefaultOverviewHideDelayMs);
  }, []);

  useLayoutEffect(
    () => () => {
      if (overviewHoverHideTimerRef.current) {
        clearTimeout(overviewHoverHideTimerRef.current);
      }
    },
    [],
  );

  return (
    <div
      ref={outerRef}
      className={RootClassName}
      onMouseEnter={overviewMounted ? handleOverviewMouseEnter : undefined}
      onMouseLeave={overviewMounted ? handleOverviewMouseLeave : undefined}>
      <div
        ref={scrollRef}
        data-testid={ViewportTestId}
        className={
          isZoomEnabled
            ? `${ScrollContainerClassName} ${PanTouchActionClassName}`
            : ScrollContainerClassName
        }
        style={{
          height: viewportHeight,
          maxHeight: containerHeightProp !== undefined ? undefined : DefaultMaxHeight,
        }}>
        <div
          className={CenteringWrapperClassName}
          style={{
            // Equal top/bottom padding centers short diagrams in a fixed
            // viewport; when overflowing the offset is 0 and content scrolls.
            width: scaledWidth,
            height: scaledHeight,
            paddingTop: verticalCenterOffset,
            paddingBottom: verticalCenterOffset,
          }}>
          <div
            className={ClipClassName}
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}>
            <div
              className={ChartStageClassName}
              style={{
                width: contentWidth,
                height: contentHeight,
                transform: `scale(${zoom})`,
              }}>
              {hasSeries ? (
                <GenericSeriesChart
                  key={chartKey}
                  options={highchartsOptions}
                  showLocalizedTime={false}
                  chartUpdatePolicy='non-animated'
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {zoomLabelsFormatter ? (
        <div className={ZoomControlsClassName}>
          <IconButton
            icon='icon-filled-magnifying-glass-plus'
            ariaLabel={zoomLabelsFormatter(ZoomAction.ZoomIn)}
            onClick={zoomIn}
            variant='OverMedia'
            size='Small'
          />
          <IconButton
            icon='icon-filled-magnifying-glass-minus'
            ariaLabel={zoomLabelsFormatter(ZoomAction.ZoomOut)}
            onClick={zoomOut}
            variant='OverMedia'
            size='Small'
          />
          <IconButton
            icon='icon-filled-arrow-spin-counter-clockwise'
            ariaLabel={zoomLabelsFormatter(ZoomAction.ResetView)}
            onClick={reset}
            variant='OverMedia'
            size='Small'
          />
        </div>
      ) : null}

      {overviewMounted ? (
        <div
          className={`${OverviewContainerClassName} ${
            overviewVisible ? OverviewVisibleClassName : OverviewHiddenClassName
          }`}>
          <SankeyOverview
            model={overviewModel}
            viewport={viewport}
            zoom={zoom}
            maxWidth={DefaultOverviewMaxWidth}
            maxHeight={DefaultOverviewMaxHeight}
            onNavigate={scrollTo}
            onPanActivity={signalPanActivity}
          />
        </div>
      ) : null}
    </div>
  );
};

SankeyChart.displayName = 'SankeyChart';
export default React.memo(SankeyChart);
