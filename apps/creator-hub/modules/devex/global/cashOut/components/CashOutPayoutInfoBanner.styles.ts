import { makeStyles } from '@rbx/ui';
import { DEVEX_BANNER_ALERT_STYLES } from '../../constants/styleConstants';

const useCashOutPayoutInfoBannerStyles = makeStyles()((theme) => ({
  root: {
    ...DEVEX_BANNER_ALERT_STYLES(theme),
    borderColor: '#335FFF',
    backgroundColor: 'rgba(51, 95, 255, 0.05)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box',
    alignItems: 'flex-start',
    '& .MuiAlert-icon': {
      color: theme.palette.actionV2.primaryBrand.fill,
      padding: theme.spacing(1.5, 0, 0, 0),
      marginRight: theme.spacing(1.5),
    },
    '& .MuiAlert-message': {
      color: theme.palette.content.standard,
      flex: 1,
      minWidth: 0,
      padding: theme.spacing(1.5, 2, 1.5, 0),
    },
    '& .MuiAlert-action': {
      padding: theme.spacing(1.5, 0, 1.5, 2),
      marginRight: 0,
      alignItems: 'flex-start',
    },
  },
  actionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.2),
  },
  learnMoreButton: {
    padding: '10px 12px',
    minWidth: 95,
  },
  closeButton: {
    padding: theme.spacing(0.5),
  },
}));

export default useCashOutPayoutInfoBannerStyles;
