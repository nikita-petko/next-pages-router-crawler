import type { TTailwindIconClass } from '@rbx/foundation-tailwind/classes';
import { Icon } from '@rbx/foundation-ui';
import type { ReactElement } from 'react';

type TPictogramSize = 'Small' | 'Medium' | 'Large';

interface PictogramStyle {
  featuredTile: string;
  leadingTile: string;
  root: string;
  trailingTile: string;
}

/**
 * Proportions measured off the Figma spot illustration (node 18914:99518),
 * which ships as a flat raster with no vector layers: the flanking tiles are
 * 62% of the featured one, each glyph is 80% of its tile, tiles lean ±14° away
 * from their neighbours, and every step to the right lifts the row by a tenth
 * of the featured edge. The root padding keeps the tilted corners clear of any
 * ancestor that clips.
 *
 * `Icon` sizes itself off `--icon-size-*`, so redefining that variable on the
 * tile resizes the glyph without a second competing `size-*` class. The design
 * runs past the largest icon token (32px), which is why it can't just pass a
 * `size` prop.
 *
 * Only the featured tile is filled, and opaquely so, because it has to occlude
 * the outlined tiles it crosses rather than let their edges show through.
 *
 * Spelled out per size rather than computed because Tailwind only emits classes
 * it can find as literal text in the source.
 */
const pictogramStyles: Record<TPictogramSize, PictogramStyle> = {
  Large: {
    featuredTile:
      'size-[104px] [--icon-size-xxlarge:83px] [transform:rotate(-14deg)] bg-surface-300 [z-index:1]',
    leadingTile:
      'size-[64px] [--icon-size-xxlarge:51px] [transform:translateY(10px)_rotate(14deg)]',
    root: 'padding-[18px]',
    trailingTile:
      'size-[64px] [--icon-size-xxlarge:51px] [transform:translateY(-10px)_rotate(14deg)]',
  },
  Medium: {
    featuredTile:
      'size-[78px] [--icon-size-xxlarge:62px] [transform:rotate(-14deg)] bg-surface-300 [z-index:1]',
    leadingTile: 'size-[48px] [--icon-size-xxlarge:38px] [transform:translateY(8px)_rotate(14deg)]',
    root: 'padding-[14px]',
    trailingTile:
      'size-[48px] [--icon-size-xxlarge:38px] [transform:translateY(-8px)_rotate(14deg)]',
  },
  Small: {
    featuredTile:
      'size-[56px] [--icon-size-xxlarge:45px] [transform:rotate(-14deg)] bg-surface-300 [z-index:1]',
    leadingTile: 'size-[35px] [--icon-size-xxlarge:28px] [transform:translateY(6px)_rotate(14deg)]',
    root: 'padding-[10px]',
    trailingTile:
      'size-[35px] [--icon-size-xxlarge:28px] [transform:translateY(-6px)_rotate(14deg)]',
  },
};

const tileBaseClasses =
  'flex shrink-0 items-center justify-center radius-medium stroke-standard stroke-emphasis content-emphasis';

/**
 * Cancels the featured tile's lean, so its glyph renders at whatever angle the
 * icon was drawn at while the flanking glyphs deliberately lean with their
 * tiles. Measuring the design confirms only the middle glyph stays put.
 *
 * The distinction matters for icons carrying a built-in angle rather than for
 * upright ones: the banner's Roblox mark leans 15° by design, and inheriting
 * the tile's rotation cancels that lean and flattens it into a plain square.
 */
const featuredGlyphClasses = '[transform:rotate(14deg)]';

interface PictogramProps {
  className?: string;
  /**
   * Drawn left to right on tilted tiles. The middle one gets the larger,
   * emphasised tile, so give it the icon the surface is really about.
   */
  icons: readonly [TTailwindIconClass, TTailwindIconClass, TTailwindIconClass];
  size?: TPictogramSize;
}

/**
 * Decorative cluster of tilted tiles, each holding one Foundation icon. Use it
 * in place of a bespoke illustration so the artwork tracks the theme and the
 * icon set instead of shipping a raster per surface.
 */
const Pictogram = ({ className = '', icons, size = 'Large' }: PictogramProps): ReactElement => {
  const { featuredTile, leadingTile, root, trailingTile } = pictogramStyles[size];
  // Keyed by slot rather than by icon, since nothing stops a caller repeating
  // the same icon in two slots.
  const tiles = [
    { glyph: '', slot: 'leading', tile: leadingTile },
    { glyph: featuredGlyphClasses, slot: 'featured', tile: featuredTile },
    { glyph: '', slot: 'trailing', tile: trailingTile },
  ];

  return (
    <div
      aria-hidden
      className={`inline-flex items-center justify-center ${root} ${className}`}
      data-testid='pictogram'>
      {tiles.map(({ glyph, slot, tile }, index) => (
        <span className={`${tileBaseClasses} ${tile}`} data-testid='pictogram-tile' key={slot}>
          <Icon className={glyph} name={icons[index]} size='XXLarge' />
        </span>
      ))}
    </div>
  );
};

export default Pictogram;
