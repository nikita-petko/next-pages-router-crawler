import { makeStyles } from '@rbx/ui';

const useExperienceUpdatesContainerStyles = makeStyles()((theme) => ({
  experienceUpdateContainer: {
    [theme.breakpoints.down('Large')]: {
      padding: 12,
    },
  },
}));

export default useExperienceUpdatesContainerStyles;
