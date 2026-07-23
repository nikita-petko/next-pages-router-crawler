import { makeStyles } from '@rbx/ui';

const useGenericTableHeaderCellStyles = makeStyles()(() => ({
  headerCell: {
    // NOTE(shumingxu, 03/25/2024): Needed to override MUI's default background
    background: 'transparent',
    verticalAlign: 'top',
  },
  label: {
    alignItems: 'flex-start',
    display: 'flex',
  },
  labelIcon: {
    alignSelf: 'flex-start',
  },
  hiddenSortIcon: {
    display: 'none',
  },
}));

export default useGenericTableHeaderCellStyles;
