import React, { type FC, useCallback, useRef } from 'react';
import type { SankeyLayout } from './sankeyLayout';
import type { SankeyViewport } from './useSankeyViewport';

export const DefaultOverviewMaxWidth = 176;
export const DefaultOverviewMaxHeight = 120;
const OverviewClassName =
  'block cursor-pointer [touch-action:none] [background:rgba(18,18,21,0.5)] [backdrop-filter:blur(4px)] [border:1px_solid_rgba(255,255,255,0.12)] [border-radius:6px]';
const OverviewLinkOpacity = 0.25;
const OverviewNodeOpacity = 0.65;
const OverviewViewportFill = 'rgba(255, 255, 255, 0.1)';
const OverviewViewportStroke = '#f7f7f8';
const OverviewViewportStrokeWidth = 1.5;

type SankeyOverviewProps = {
  layout: SankeyLayout;
  viewport: SankeyViewport;
  zoom: number;
  maxWidth?: number;
  maxHeight?: number;
  /** Pans the main canvas so the viewport is centered on a content point. */
  onNavigate: (scrollLeft: number, scrollTop: number) => void;
  /** Called while the user drags on the minimap so it stays visible. */
  onPanActivity?: () => void;
};

/**
 * A compact whole-diagram overview (minimap) with a draggable viewport
 * rectangle. Provides orientation when the main canvas is zoomed or scrolled,
 * replacing the need for pinned endpoint columns on large funnels.
 */
const SankeyOverview: FC<SankeyOverviewProps> = ({
  layout,
  viewport,
  zoom,
  maxWidth = DefaultOverviewMaxWidth,
  maxHeight = DefaultOverviewMaxHeight,
  onNavigate,
  onPanActivity,
}) => {
  const { width: contentWidth, height: contentHeight } = layout;
  const svgRef = useRef<SVGSVGElement>(null);
  const draggingRef = useRef(false);

  const scale = Math.min(maxWidth / contentWidth, maxHeight / contentHeight, 1);
  const miniWidth = contentWidth * scale;
  const miniHeight = contentHeight * scale;

  // The SVG viewBox is in content units, so the viewport rectangle is expressed
  // in content units too (the viewBox handles scaling to the minimap's size).
  const viewLeft = viewport.scrollLeft / zoom;
  const viewTop = viewport.scrollTop / zoom;
  const viewWidth = viewport.clientWidth / zoom;
  const viewHeight = viewport.clientHeight / zoom;

  const navigateToClientPoint = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) {
        return;
      }
      const rect = svg.getBoundingClientRect();
      const miniX = clientX - rect.left;
      const miniY = clientY - rect.top;
      // Convert minimap point to content coords, center the viewport on it.
      const contentX = miniX / scale;
      const contentY = miniY / scale;
      onNavigate(
        contentX * zoom - viewport.clientWidth / 2,
        contentY * zoom - viewport.clientHeight / 2,
      );
    },
    [scale, zoom, viewport.clientWidth, viewport.clientHeight, onNavigate],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      draggingRef.current = true;
      onPanActivity?.();
      event.currentTarget.setPointerCapture(event.pointerId);
      navigateToClientPoint(event.clientX, event.clientY);
    },
    [navigateToClientPoint, onPanActivity],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!draggingRef.current) {
        return;
      }
      onPanActivity?.();
      navigateToClientPoint(event.clientX, event.clientY);
    },
    [navigateToClientPoint, onPanActivity],
  );

  const endDrag = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      draggingRef.current = false;
      onPanActivity?.();
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [onPanActivity],
  );

  return (
    <svg
      ref={svgRef}
      width={miniWidth}
      height={miniHeight}
      viewBox={`0 0 ${contentWidth} ${contentHeight}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={OverviewClassName}>
      {layout.links.map((link) => (
        <line
          key={link.id}
          x1={link.source.x1}
          y1={link.sourceY}
          x2={link.target.x0}
          y2={link.targetY}
          stroke={link.source.color}
          strokeOpacity={OverviewLinkOpacity}
          strokeWidth={Math.max(1, link.width)}
        />
      ))}
      {layout.nodes.map((node) => (
        <rect
          key={node.id}
          x={node.x0}
          y={node.y0}
          width={node.x1 - node.x0}
          height={Math.max(1, node.y1 - node.y0)}
          fill={node.color}
          fillOpacity={OverviewNodeOpacity}
        />
      ))}
      <rect
        x={Math.max(0, viewLeft)}
        y={Math.max(0, viewTop)}
        width={Math.min(viewWidth, contentWidth)}
        height={Math.min(viewHeight, contentHeight)}
        fill={OverviewViewportFill}
        stroke={OverviewViewportStroke}
        strokeWidth={OverviewViewportStrokeWidth}
        vectorEffect='non-scaling-stroke'
        pointerEvents='none'
      />
    </svg>
  );
};

SankeyOverview.displayName = 'SankeyOverview';
export default SankeyOverview;
