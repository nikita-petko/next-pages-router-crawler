import { makeStyles } from '@rbx/ui';

// Shared so the monthly-cap input and the free-tier progress block above it
// stay vertically aligned at the same width.
export const MONTHLY_CAP_MAX_WIDTH_PX = 320;

const useCoresQuotaSectionStyles = makeStyles()((theme) => {
  return {
    sectionContent: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      gap: 24,
      paddingTop: 12,
      paddingBottom: 12,
    },
    placesSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    },
    placesExtendedRow: {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    manageButton: {
      ...theme.typography.body2,
      color: theme.palette.content.standard,
      background: 'none',
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      '&:disabled': {
        cursor: 'not-allowed',
        opacity: 0.5,
      },
    },
    chipsContainer: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      ...theme.typography.body2,
      display: 'inline-flex',
      alignItems: 'center',
      paddingLeft: 8,
      paddingRight: 8,
      paddingTop: 4,
      paddingBottom: 4,
      borderRadius: 4,
      backgroundColor: theme.palette.surface[300],
      color: theme.palette.content.standard,
    },
    monthlyCapContainer: {
      display: 'flex',
      flexDirection: 'column',
      maxWidth: MONTHLY_CAP_MAX_WIDTH_PX,
    },
  };
});

export default useCoresQuotaSectionStyles;
