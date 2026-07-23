import { makeStyles } from '@rbx/ui';

const useRestartServersImpactCardStyles = makeStyles()(() => ({
  impactCardContainer: {
    flex: '1 1 0%',
    minWidth: 200,
    maxWidth: 270,
  },
  impactCard: {
    padding: 24,
    textAlign: 'start',
  },
  impactValue: {
    display: 'block',
    marginTop: 4,
  },
}));

export default useRestartServersImpactCardStyles;
