import type { FC } from 'react';

/**
 * Empty-state illustration: tilted square frame wrapping the Foundation
 * three-vertical-bars glyph. Shared by the manage empty state and the
 * editor canvas.
 *
 * Hybrid composition: the frame stays as a hand-authored SVG (no Foundation
 * primitive renders one) but the bars are the official Foundation glyph
 * (`icon-regular-chart-three-vertical-bars`, the same class
 * `ExploreModeChartTypeSelector` uses for `ChartType.Bar`). We render the
 * glyph as a plain `<span>` with the `icon` base class (not `<Icon>`) because
 * Foundation's Icon size variants cap at XLarge (28px) and this illustration
 * runs at 144px in the manage empty state. The `icon` class is required for the
 * `::before` glyph; sizing uses `fontSize`, not width/height.
 *
 * Frame uses `--color-stroke-emphasis` so it stays dim independent of the
 * surrounding text color; the glyph inherits `currentColor`.
 *
 * Decorative only — callers pair this with a visible headline/description
 * (`aria-labelledby` / `aria-describedby` or heading text), so the wrapper
 * is `aria-hidden` and does not duplicate that copy for screen readers.
 */
type DashboardsEmptyStateIllustrationProps = {
  /** Defaults to 144; editor uses a smaller value. */
  readonly sizePx?: number;
};

const SIZE_PX = 144;

// Inner glyph fits comfortably inside the tilted frame without crowding the
// corners. Tuned visually against the original hand-drawn bars.
const GLYPH_RATIO = 0.5;

const DashboardsEmptyStateIllustration: FC<DashboardsEmptyStateIllustrationProps> = ({
  sizePx = SIZE_PX,
}) => {
  const glyphSizePx = Math.round(sizePx * GLYPH_RATIO);
  return (
    <span
      aria-hidden
      style={{ width: sizePx, height: sizePx }}
      className='relative inline-flex items-center justify-center content-emphasis'>
      {/* Frame: 115×115 centered at (72, 72), rotated -15°. Decorative. */}
      <svg
        aria-hidden='true'
        viewBox='0 0 144 144'
        fill='none'
        xmlns='http://www.w3.org/2000/svg'
        className='absolute inset-[0] width-full height-full'>
        <rect
          x='14.5'
          y='14.5'
          width='115'
          height='115'
          rx='4.6'
          ry='4.6'
          transform='rotate(-15 72 72)'
          stroke='var(--color-stroke-emphasis, rgba(208, 217, 251, 0.16))'
          strokeWidth='1.15'
          fill='none'
        />
      </svg>
      <span
        aria-hidden='true'
        style={{ fontSize: glyphSizePx, lineHeight: 1 }}
        className='icon icon-regular-chart-three-vertical-bars relative inline-block'
      />
    </span>
  );
};

export default DashboardsEmptyStateIllustration;
