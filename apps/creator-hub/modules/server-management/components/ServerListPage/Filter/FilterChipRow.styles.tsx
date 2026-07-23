import { makeStyles } from '@rbx/ui';

const useFilterChipRowStyles = makeStyles()((theme) => {
  return {
    filterDisabledChip: {
      // FilterChip.tsx
      outline: '1px solid',
      outlineColor: theme.palette.surface.outline,
    },
    filterChipContainer: {
      // FilterChipRow.tsx
      display: 'flex',
      gap: 8,
    },
  };
});

export default useFilterChipRowStyles;
