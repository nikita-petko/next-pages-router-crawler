import { makeStyles } from '@rbx/ui';

const useBadgeListEntryStyles = makeStyles()(() => ({
  icon: {
    marginRight: 24,
    width: 50,
  },
  // Foundation Size/Size_1000 (--size-1000 = 40px) square hit target for the drag affordance.
  dragHandle: {
    width: 'var(--size-1000)',
    height: 'var(--size-1000)',
  },
  // Per-row box styling applied to every row (moved/locked/normal):
  // - padding: interior padding (Foundation padding/large, --padding-large = 16px) so row
  //   content is inset from the edge/outline.
  // - marginBottom: uniform inter-row gap (same token). Uses margin (not flex `gap`) so
  //   @hello-pangea/dnd measures drag offsets correctly and infinite scroll is unaffected.
  // - borderRadius: 12px row corner radius (Foundation --size-300), applied here so the hover
  //   surface and the moved outline share the same rounded shape.
  entry: {
    padding: 'var(--padding-large)',
    marginBottom: 'var(--padding-large)',
    borderRadius: 'var(--size-300)',
  },
  // Thin separator line at the top of un-moved rows. The inter-row gap now comes from `entry`,
  // so these margins are kept small to avoid bloating the row and to minimize the layout shift
  // when a row toggles into the (divider-less) moved state.
  divider: {
    marginTop: 0,
    marginBottom: 8,
  },
  badgeNameTypography: {
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '50vw',
  },
  // Applied to rows that are part of the current reorder batch (moved): a white outline
  // around the whole entry replaces the previous inline status dot.
  moved: {
    // Foundation stroke/standard (--stroke-standard = 1px) outline in system-contrast
    // (--color-system-contrast = #F7F7F8 in dark mode) around rows in the active reorder batch.
    // Corner radius comes from `entry` so the outline matches the shared 12px row shape.
    border: `var(--stroke-standard) solid var(--color-system-contrast)`,
  },
  // Applied to rows that are locked at the reorder cap: dim them and signal non-interactivity
  // so it's clear they cannot be dragged until the current batch is saved.
  locked: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
}));

export default useBadgeListEntryStyles;
