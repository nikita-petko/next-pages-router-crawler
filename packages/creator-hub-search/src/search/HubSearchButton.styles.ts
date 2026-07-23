import { makeStyles } from '@rbx/ui';

const useHubSearchButtonStyles = makeStyles()((theme) => ({
  searchButton: {
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(2),
    verticalAlign: 'top',
  },
}));

export default useHubSearchButtonStyles;
