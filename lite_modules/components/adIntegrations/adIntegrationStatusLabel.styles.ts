import { makeStyles } from '@rbx/ui';

const statusCircleBase = {
  borderRadius: '50%',
  maxHeight: '8px',
  maxWidth: '8px',
};

const useAdIntegrationStatusLabelStyles = makeStyles()((theme) => ({
  labelRoot: {
    backgroundColor: '#d0d9fb14',
    fontSize: '12px',
    gap: '6px',
    padding: '2px 8px',
    whiteSpace: 'nowrap',
  },
  statusCircleActive: {
    ...statusCircleBase,
    backgroundColor: theme.palette.content.alert.active,
  },
  statusCircleDisabled: {
    ...statusCircleBase,
    backgroundColor: theme.palette.content.disabled,
  },
  statusCircleImportant: {
    ...statusCircleBase,
    backgroundColor: theme.palette.content.alert.important,
  },
  statusCircleNotice: {
    ...statusCircleBase,
    backgroundColor: theme.palette.content.alert.notice,
  },
}));

export default useAdIntegrationStatusLabelStyles;
