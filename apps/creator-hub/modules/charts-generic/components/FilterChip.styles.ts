import { TTheme, makeStyles } from '@rbx/ui';

const useFilterChipsStyles = makeStyles()((theme: TTheme) => {
  return {
    tooltip: {
      lineClamp: 5,
      WebkitLineClamp: 5,
      boxOrient: 'vertical',
      WebkitBoxOrient: 'vertical',
      '@supports (display: -webkit-box)': {
        display: '-webkit-box',
      },
      textOverflow: 'ellipsis',
      position: 'relative',
    },
    closeIconForDisabledChip: {
      position: 'absolute',
      right: '-2px',
      top: '-8px',
      color: theme.palette.content.disabled,
      '&:hover': {
        color: theme.palette.content.standard,
      },
    },
  };
});

export default useFilterChipsStyles;
