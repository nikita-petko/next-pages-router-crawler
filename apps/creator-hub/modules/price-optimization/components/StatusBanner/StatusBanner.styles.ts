import { makeStyles } from '@rbx/ui';

const useStatusBannerStyles = makeStyles()((theme) => ({
  tooltipContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4px',
  },
  stepper: {
    borderRadius: '8px',
    padding: '16px',
    backgroundColor: theme.palette.surface[200],
  },
}));

export default useStatusBannerStyles;
