import { makeStyles } from '@rbx/ui';

const useSocialLinksContainerStyles = makeStyles()((theme) => ({
  sectionStyle: {
    [theme.breakpoints.down('Large')]: {
      paddingLeft: 12,
      paddingRight: 12,
    },
  },
}));

export default useSocialLinksContainerStyles;
