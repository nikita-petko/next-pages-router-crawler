import { makeStyles } from '@rbx/ui';

const useReachTableCreativeCellStyles = makeStyles()((theme) => ({
  /**
   * Reach background creatives are native ~2.68:1, wider than the standard
   * 16:9-ish sponsored thumbnail. Sizing the cell at the same 96×54 as
   * `TableCreativeCell` keeps the column aligned across campaign types;
   * `object-fit: cover` crops the wider image to fill the box rather than
   * squishing it vertically. The rich tile (logo / headline / CTA) shows in
   * the preview dialog where it's actually legible.
   */
  creative: {
    backgroundColor: theme.palette.surface[400],
    height: 54,
    minHeight: 54,
    minWidth: 96,
    objectFit: 'cover',
    width: 96,
  },
  previewButton: {
    margin: 0,
    padding: 0,
  },
}));

export default useReachTableCreativeCellStyles;
