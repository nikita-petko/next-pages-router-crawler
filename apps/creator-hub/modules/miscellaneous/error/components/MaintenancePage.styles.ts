import { makeStyles } from '@rbx/ui';
import { maintenanceIllustrationPath } from '../constants/assetConstants';

const useMaintenancePageStyles = makeStyles()(() => ({
  background: {
    width: '100vw',
    height: '100vh',
    backgroundImage: `url('${maintenanceIllustrationPath}')`,
    backgroundSize: 'cover',
  },

  text: {
    padding: '128px 16px',
    maxWidth: 500,
  },
}));

export default useMaintenancePageStyles;
