import { makeStyles } from '@rbx/ui';

const useExperimentResultCardStyles = makeStyles()((theme) => ({
  cardContentContainer: {
    // This styling here is since Mui by default puts 24px padding on the last child
    '&:last-child': {
      padding: '16px',
    },
    padding: '16px',
  },
  header: {
    display: 'flex',
    marginBottom: '8px',
    alignItems: 'center',
    gap: '4px',
  },
  successText: {
    color: theme.palette.components.alert.activeContent,
  },
  failureText: {
    color: theme.palette.components.alert.importantContent,
  },
}));

export default useExperimentResultCardStyles;
