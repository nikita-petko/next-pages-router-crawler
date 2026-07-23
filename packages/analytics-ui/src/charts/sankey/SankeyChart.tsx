import React, {
  type FC,
  memo,
  useCallback,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTheme } from '@rbx/ui';
import { ExtendedCategoricalChartColors, getChartColorHexString } from '../../color';
import type { SankeyChartProps } from '../../types/SankeyChart';
import {
  type LayoutLink,
  type LayoutNode,
  buildLinkRibbonPath,
  buildNodeBarPath,
  computeSankeyLayout,
} from './sankeyLayout';
import SankeyOverview, {
  DefaultOverviewMaxHeight,
  DefaultOverviewMaxWidth,
} from './SankeyOverview';
import { useSankeyViewport } from './useSankeyViewport';

const DefaultHeight = 444;
const DefaultMaxHeight = 640;
const DefaultNodePadding = 16;
const DefaultNodeWidth = 8;
const DefaultNodeRadius = 4;
const DefaultMaxZoom = 8;
const DefaultLabelFontSize = 12;
const LabelGap = 12;
/** Line-height multiple used both for placing labels and deciding if one fits. */
const LabelLineHeightRatio = 1.5;
/**
 * Below this zoom the diagram is in "overview" territory: labels would be too
 * small to read and only add noise, so they're hidden (except the hovered /
 * focused one) leaving a clean shape. They fade back in as you zoom toward the
 * natural scale.
 */
const LabelMinZoom = 0.75;
/** Rough average glyph width as a fraction of font size (for truncation). */
const AvgGlyphRatio = 0.58;

/** Truncate `text` to roughly `availablePx`, adding an ellipsis when clipped. */
const truncateToWidth = (text: string, availablePx: number, fontSize: number): string => {
  const maxChars = Math.floor(availablePx / (fontSize * AvgGlyphRatio));
  if (maxChars >= text.length) {
    return text;
  }
  if (maxChars < 2) {
    return '';
  }
  return `${text.slice(0, maxChars - 1).trimEnd()}\u2026`;
};

const ActiveLinkOpacity = 0.75;
const IdleLinkOpacity = 0.4;
const DimmedLinkOpacity = 0.1;
const DimmedNodeOpacity = 0.25;

/** Idle delay before the minimap hides after hover or pan ends. */
const DefaultOverviewHideDelayMs = 1200;

const LabelColor = '#d5d7dd'; // Foundation content/default
const RootClassName = 'relative';
const ScrollContainerClassName = 'relative width-full [overflow:auto]';
const SvgClassName = 'block';
const InteractiveLinkClassName =
  'cursor-pointer transition-[fill-opacity] [transition-duration:150ms] [transition-timing-function:ease-out]';
const ZoomControlsClassName = 'absolute flex flex-col [top:8px] [right:8px] [gap:4px]';
const ZoomButtonClassName =
  'flex items-center justify-center cursor-pointer [width:28px] [height:28px] [background:rgba(18,18,21,0.92)] [border:1px_solid_rgba(255,255,255,0.12)] [border-radius:6px] [color:#f7f7f8] [font-size:16px] [line-height:1] [padding:0]';
const ResetZoomButtonClassName = `${ZoomButtonClassName} [font-size:13px]`;
const OverviewContainerClassName =
  'absolute transition-opacity [transition-duration:150ms] [transition-timing-function:ease-out] [bottom:8px] [left:8px]';
const TooltipClassName =
  'absolute [transform:translate(12px,-50%)] pointer-events-none flex items-center text-no-wrap [gap:12px] [background:#f7f7f8] [color:#1b1b1f] [font-size:12px] [line-height:18px] [padding:6px_10px] [border-radius:8px] [box-shadow:0_4px_12px_rgba(0,0,0,0.32)] [z-index:2]';

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: 'percent',
  maximumFractionDigits: 1,
});

const defaultFormatNodeCount = (value: number): string =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);

type Selection = { type: 'link'; id: string } | { type: 'node'; id: string } | undefined;

type TooltipState =
  | {
      type: 'node';
      x: number;
      y: number;
      label: string;
      valueLabel: string;
    }
  | {
      type: 'link';
      x: number;
      y: number;
      sourceLabel: string;
      targetLabel: string;
      valueLabel: string;
      percentLabel: string;
    };

const SankeyChart: FC<SankeyChartProps> = ({
  nodes,
  links,
  height = DefaultHeight,
  maxHeight = DefaultMaxHeight,
  nodePadding = DefaultNodePadding,
  nodeWidth = DefaultNodeWidth,
  nodeRadius = DefaultNodeRadius,
  minNodeThickness = 0,
  minColumnWidth = 0,
  labelFontSize = DefaultLabelFontSize,
  enableZoom = true,
  maxZoom = DefaultMaxZoom,
  colors = ExtendedCategoricalChartColors,
  showZoomControls = true,
  zoomControlLabels,
  showOverview = true,
  overviewMaxWidth = DefaultOverviewMaxWidth,
  overviewMaxHeight = DefaultOverviewMaxHeight,
  overviewHideDelayMs = DefaultOverviewHideDelayMs,
  enableNodeFocus = true,
  formatNodeLabel,
  formatNodeCount = defaultFormatNodeCount,
  ariaLabel,
  className,
  'data-testid': dataTestId,
}) => {
  const theme = useTheme();
  const outerRef = useRef<HTMLDivElement>(null);
  const overviewHoverHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactId = useId();
  const gradientIdPrefix = reactId.replaceAll(':', '');
  const [measuredWidth, setMeasuredWidth] = useState(0);
  const [isOverviewHovered, setIsOverviewHovered] = useState(false);
  const [hover, setHover] = useState<Selection>(undefined);
  const [focus, setFocus] = useState<Selection>(undefined);
  const [tooltip, setTooltip] = useState<TooltipState | undefined>(undefined);

  const resolveChartColor = useCallback(
    (color: NonNullable<SankeyChartProps['colors']>[number]) =>
      getChartColorHexString(color, theme),
    [theme],
  );

  const resolvedColors = useMemo(
    () => colors.map((color) => resolveChartColor(color)),
    [colors, resolveChartColor],
  );

  const resolveNodeLabel = useCallback(
    (node: LayoutNode): string => (formatNodeLabel ? formatNodeLabel(node.source) : node.name),
    [formatNodeLabel],
  );

  const layout = useMemo(() => {
    if (measuredWidth <= 0 || nodes.length === 0 || links.length === 0) {
      return undefined;
    }
    try {
      return computeSankeyLayout(nodes, links, {
        width: measuredWidth,
        height,
        nodeWidth,
        nodePadding,
        minNodeThickness,
        minColumnWidth,
        colors: resolvedColors,
        resolveColor: resolveChartColor,
      });
    } catch {
      return undefined;
    }
  }, [
    nodes,
    links,
    measuredWidth,
    height,
    nodeWidth,
    nodePadding,
    minNodeThickness,
    minColumnWidth,
    resolvedColors,
    resolveChartColor,
  ]);

  const contentWidth = layout?.width ?? measuredWidth;
  const contentHeight = layout?.height ?? height;

  // Small funnels keep a zoom floor of 1; larger funnels can zoom out to fit.
  const fitZoom =
    layout && measuredWidth > 0
      ? Math.min(1, measuredWidth / contentWidth, maxHeight / contentHeight)
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
    enabled: enableZoom,
    minZoom: fitZoom,
    maxZoom,
    panHideDelayMs: overviewHideDelayMs,
  });

  // Measure the scroll container's content width (excludes any scrollbar) and
  // drive the layout from it so the diagram fits at zoom 1.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setMeasuredWidth(entry.contentRect.width);
      }
    });
    observer.observe(element);
    if (element.clientWidth > 0) {
      setMeasuredWidth(element.clientWidth);
    }
    return () => observer.disconnect();
  }, [scrollRef]);

  const selection = hover ?? focus;

  // Resolve which links/nodes are highlighted for the current selection.
  const activeSets = useMemo(() => {
    if (!selection || !layout) {
      return undefined;
    }
    const activeLinks = new Set<string>();
    const activeNodes = new Set<string>();
    if (selection.type === 'link') {
      const link = layout.links.find((candidate) => candidate.id === selection.id);
      if (link) {
        activeLinks.add(link.id);
        activeNodes.add(link.source.id);
        activeNodes.add(link.target.id);
      }
    } else {
      activeNodes.add(selection.id);
      for (const link of layout.links) {
        if (link.source.id === selection.id || link.target.id === selection.id) {
          activeLinks.add(link.id);
          activeNodes.add(link.source.id);
          activeNodes.add(link.target.id);
        }
      }
    }
    return { activeLinks, activeNodes };
  }, [selection, layout]);

  // Nodes whose labels are shown regardless of decluttering. Only the directly
  // hovered/focused node — link hovers already name both ends in the tooltip,
  // and forcing endpoint labels on top looks redundant.
  const forcedLabelIds = useMemo(() => {
    const ids = new Set<string>();
    if (selection?.type === 'node') {
      ids.add(selection.id);
    }
    return ids;
  }, [selection]);

  const tooltipFromEvent = useCallback((event: { clientX: number; clientY: number }) => {
    const element = outerRef.current;
    if (!element) {
      return { x: 0, y: 0 };
    }
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  const updateTooltipPosition = useCallback(
    (event: { clientX: number; clientY: number }) => {
      setTooltip((current) => (current ? { ...current, ...tooltipFromEvent(event) } : current));
    },
    [tooltipFromEvent],
  );

  const handleLinkEnter = useCallback(
    (link: LayoutLink, event: { clientX: number; clientY: number }) => {
      setHover({ type: 'link', id: link.id });
      setTooltip({
        ...tooltipFromEvent(event),
        type: 'link',
        sourceLabel: resolveNodeLabel(link.source),
        targetLabel: resolveNodeLabel(link.target),
        valueLabel: formatNodeCount(link.value),
        percentLabel: percentFormatter.format(link.fractionOfSource),
      });
    },
    [formatNodeCount, resolveNodeLabel, tooltipFromEvent],
  );

  const handleNodeEnter = useCallback(
    (node: LayoutNode, event: { clientX: number; clientY: number }) => {
      setHover({ type: 'node', id: node.id });
      setTooltip({
        ...tooltipFromEvent(event),
        type: 'node',
        label: resolveNodeLabel(node),
        valueLabel: formatNodeCount(node.value),
      });
    },
    [formatNodeCount, resolveNodeLabel, tooltipFromEvent],
  );

  const clearHover = useCallback(() => {
    setHover(undefined);
    setTooltip(undefined);
  }, []);

  const toggleFocus = useCallback(
    (nodeId: string) => {
      if (!enableNodeFocus) {
        return;
      }
      setFocus((current) =>
        current?.type === 'node' && current.id === nodeId
          ? undefined
          : { type: 'node', id: nodeId },
      );
    },
    [enableNodeFocus],
  );

  const clearFocus = useCallback(() => setFocus(undefined), []);

  // Clear node focus when clicking empty canvas (clicks on a node are ignored
  // here and handled by the node's own toggle). Done natively to avoid putting
  // click handlers on non-interactive SVG/`div` elements.
  useLayoutEffect(() => {
    const element = scrollRef.current;
    if (!element || !enableNodeFocus) {
      return undefined;
    }
    const handleClick = (event: MouseEvent): void => {
      // Ignore the click that ends a drag-pan.
      if (wasDraggedRef.current) {
        wasDraggedRef.current = false;
        return;
      }
      const target = event.target instanceof Element ? event.target : null;
      const nodeGroup = target?.closest('[data-sankey-node]');
      const nodeId = nodeGroup?.getAttribute('data-node-id');
      if (nodeId) {
        toggleFocus(nodeId);
      } else {
        clearFocus();
      }
    };
    element.addEventListener('click', handleClick);
    return () => element.removeEventListener('click', handleClick);
  }, [scrollRef, enableNodeFocus, clearFocus, toggleFocus, wasDraggedRef]);

  const labelLineHeight = labelFontSize * LabelLineHeightRatio;
  // Horizontal room available for a label: the gap between two columns, minus
  // the bar width and the label's leading gap. Geometry scales uniformly with
  // zoom, so this content-space budget is what keeps labels inside their lane.
  const columnGap =
    layout && layout.columnCount > 1
      ? (contentWidth - nodeWidth) / (layout.columnCount - 1)
      : contentWidth;
  const labelAvailable = Math.max(0, columnGap - nodeWidth - LabelGap * 2);

  const scaledWidth = contentWidth * zoom;
  const scaledHeight = contentHeight * zoom;
  const containerHeight = Math.min(scaledHeight, maxHeight);
  const clientWidth = viewport.clientWidth || measuredWidth;
  const overflows = scaledWidth > clientWidth + 1 || scaledHeight > containerHeight + 1;
  const overviewVisible = showOverview && overflows && !!layout && (isPanning || isOverviewHovered);
  const zoomControlsVisible =
    enableZoom && showZoomControls && !!layout && zoomControlLabels !== undefined;

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
    }, overviewHideDelayMs);
  }, [overviewHideDelayMs]);

  useLayoutEffect(
    () => () => {
      if (overviewHoverHideTimerRef.current) {
        clearTimeout(overviewHoverHideTimerRef.current);
      }
    },
    [],
  );

  const linkOpacity = useCallback(
    (link: LayoutLink): number => {
      if (!activeSets) {
        return IdleLinkOpacity;
      }
      return activeSets.activeLinks.has(link.id) ? ActiveLinkOpacity : DimmedLinkOpacity;
    },
    [activeSets],
  );

  const nodeOpacity = useCallback(
    (node: LayoutNode): number => {
      if (!activeSets) {
        return 1;
      }
      return activeSets.activeNodes.has(node.id) ? 1 : DimmedNodeOpacity;
    },
    [activeSets],
  );

  return (
    <div
      ref={outerRef}
      className={className ? `${RootClassName} ${className}` : RootClassName}
      data-testid={dataTestId}
      onMouseEnter={showOverview && overflows ? handleOverviewMouseEnter : undefined}
      onMouseLeave={showOverview && overflows ? handleOverviewMouseLeave : undefined}>
      <div
        ref={scrollRef}
        className={ScrollContainerClassName}
        style={{
          height: layout ? containerHeight : height,
          touchAction: enableZoom ? 'none' : 'pan-x pan-y',
        }}>
        {layout ? (
          <svg
            width={scaledWidth}
            height={scaledHeight}
            viewBox={`0 0 ${contentWidth} ${contentHeight}`}
            aria-label={ariaLabel}
            className={SvgClassName}>
            <defs>
              {layout.links.map((link) => (
                <linearGradient
                  key={link.id}
                  id={`${gradientIdPrefix}-sankey-gradient-${link.id}`}
                  gradientUnits='userSpaceOnUse'
                  x1={link.source.x1}
                  x2={link.target.x0}
                  y1={0}
                  y2={0}>
                  <stop offset='0%' stopColor={link.source.color} />
                  <stop offset='100%' stopColor={link.target.color} />
                </linearGradient>
              ))}
            </defs>

            <g>
              {layout.links.map((link) => (
                <path
                  key={link.id}
                  d={buildLinkRibbonPath(link, nodeRadius)}
                  fill={`url(#${gradientIdPrefix}-sankey-gradient-${link.id})`}
                  fillOpacity={linkOpacity(link)}
                  className={InteractiveLinkClassName}
                  onMouseEnter={(event) => handleLinkEnter(link, event)}
                  onMouseMove={updateTooltipPosition}
                  onMouseLeave={clearHover}
                />
              ))}
            </g>

            <g>
              {layout.nodes.map((node) => {
                const label = resolveNodeLabel(node);
                const labelX = node.isLastColumn ? node.x0 - LabelGap : node.x1 + LabelGap;
                const labelAnchor = node.isLastColumn ? 'end' : 'start';
                const forced = forcedLabelIds.has(node.id);
                // Declutter: only draw a label when zoomed in enough to read it
                // and its node has at least a line's worth of vertical room (so
                // neighbors don't collide), truncating to the lane width.
                // Hovered/focused labels always show in full, on top.
                const hasRoom = zoom >= LabelMinZoom && node.y1 - node.y0 >= labelLineHeight;
                const labelText = forced
                  ? label
                  : hasRoom
                    ? truncateToWidth(label, labelAvailable, labelFontSize)
                    : '';
                return (
                  <g
                    key={node.id}
                    data-sankey-node=''
                    data-node-id={node.id}
                    opacity={nodeOpacity(node)}
                    onMouseEnter={(event) => handleNodeEnter(node, event)}
                    onMouseMove={updateTooltipPosition}
                    onMouseLeave={clearHover}
                    className={enableNodeFocus ? 'cursor-pointer' : 'cursor-default'}>
                    <path d={buildNodeBarPath(node, nodeRadius)} fill={node.color} />
                    {labelText ? (
                      <text
                        x={labelX}
                        y={node.y0 + labelLineHeight / 2}
                        textAnchor={labelAnchor}
                        dominantBaseline='middle'
                        fontSize={labelFontSize}
                        fill={LabelColor}
                        className='pointer-events-none select-none'>
                        {labelText}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>
        ) : null}
      </div>

      {zoomControlsVisible && zoomControlLabels ? (
        <div className={ZoomControlsClassName}>
          <button
            type='button'
            aria-label={zoomControlLabels.zoomIn}
            onClick={zoomIn}
            className={ZoomButtonClassName}>
            +
          </button>
          <button
            type='button'
            aria-label={zoomControlLabels.zoomOut}
            onClick={zoomOut}
            className={ZoomButtonClassName}>
            &minus;
          </button>
          <button
            type='button'
            aria-label={zoomControlLabels.resetView}
            onClick={reset}
            className={ResetZoomButtonClassName}>
            &#8634;
          </button>
        </div>
      ) : null}

      {showOverview && overflows && layout ? (
        <div
          className={OverviewContainerClassName}
          style={{
            opacity: overviewVisible ? 1 : 0,
            pointerEvents: overviewVisible ? 'auto' : 'none',
          }}>
          <SankeyOverview
            layout={layout}
            viewport={viewport}
            zoom={zoom}
            maxWidth={overviewMaxWidth}
            maxHeight={overviewMaxHeight}
            onNavigate={scrollTo}
            onPanActivity={signalPanActivity}
          />
        </div>
      ) : null}

      {tooltip ? (
        <div
          className={TooltipClassName}
          style={{
            left: tooltip.x,
            top: tooltip.y,
          }}>
          {tooltip.type === 'link' ? (
            <>
              <span>
                {tooltip.sourceLabel} &rarr; {tooltip.targetLabel}
              </span>
              <span className='[font-weight:600]'>{tooltip.valueLabel}</span>
              <span>{tooltip.percentLabel}</span>
            </>
          ) : (
            <>
              <span>{tooltip.label}</span>
              <span className='[font-weight:600]'>{tooltip.valueLabel}</span>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
};

SankeyChart.displayName = 'SankeyChart';
export default memo(SankeyChart);
