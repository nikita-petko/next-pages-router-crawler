import { makeStyles } from '@rbx/ui';

const useRoadMapAccordionStyles = makeStyles()(() => ({
  accordion: {
    '&::before': {
      height: 0,
    },
    '&.Mui-expanded': {
      margin: '12px 0',
    },
  },

  headerIcon: {
    height: 20,
    margin: 'auto 16px auto 0',
  },

  icon: {
    height: 20,
    margin: 'auto 5px auto 0',
  },

  imageWrapper: {
    position: 'relative',
    width: '100%',
    // Image dimensions: 2472 × 654. 654/2472 * 100 = 26.45...
    paddingBottom: '26.5%',
    marginBottom: 12,
  },

  image: {
    position: 'absolute',
    width: '100%',
  },
}));

export default useRoadMapAccordionStyles;
