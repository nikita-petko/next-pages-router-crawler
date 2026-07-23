import { makeStyles } from '@rbx/ui';

const useAdvancedTargetingAudienceSectionStyles = makeStyles()((theme) => ({
  audienceEstimateHalfWidthWrapper: {
    backgroundColor: theme.palette.surface[200],
    borderRadius: '8px',
    padding: '24px',
    [theme.breakpoints.up('Medium')]: {
      width: '50%',
    },
    width: '100%',
  },
}));

export default useAdvancedTargetingAudienceSectionStyles;
