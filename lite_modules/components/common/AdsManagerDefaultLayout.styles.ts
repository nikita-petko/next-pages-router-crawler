import { makeStyles } from '@rbx/ui';

const useAdsManagerDefaultLayoutStyles = makeStyles()(() => ({
  creatorHubLayoutPageContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  systemWideAlertToast: {
    all: 'unset',
  },
}));

export default useAdsManagerDefaultLayoutStyles;
