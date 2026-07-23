import { makeStyles } from '@rbx/ui';

const useApiKeyStatusFormStyles = makeStyles()((theme) => ({
  chip: {
    margin: '4px 4px 4px 0px',
  },

  label: {
    marginTop: 8,
  },

  active: {
    color: theme.palette.success.main,
    borderColor: theme.palette.success.main,
  },

  inactive: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
  },
}));

export default useApiKeyStatusFormStyles;
