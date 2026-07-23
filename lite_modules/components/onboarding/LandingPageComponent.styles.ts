import { makeStyles } from '@rbx/ui';

export const useLandingPageStyles = makeStyles()((theme) => ({
  resourceButton: {
    alignSelf: 'flex-start',
  },

  resourceCard: {
    display: 'flex',
    flexDirection: 'column',
  },

  /* eslint-disable perfectionist/sort-objects */
  resourceCardContainer: {
    display: 'grid',
    gap: '1vw',
    gridTemplateColumns: '1fr',
    margin: '12px 0',

    [`@media (min-width: ${theme.breakpoints.values.Medium}px)`]: {
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    },
  },

  resourceContainer: {
    margin: '0 4vw',
  },

  resourceText: {
    flex: '1',
    fontSize: 20,
    margin: '8px 16px',
  },

  resourceTitleContainer: {
    fontWeight: '450', // For CSS backwards compatibility.
    margin: '12px 16px',
  },
}));
