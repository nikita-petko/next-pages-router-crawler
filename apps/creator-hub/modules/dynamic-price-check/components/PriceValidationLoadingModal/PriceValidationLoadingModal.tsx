import { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@rbx/ui';
import usePriceValidationLoadingModalStyles from './PriceValidationLoadingModal.styles';

interface PriceValidationLoadingModalProps {
  isEnabling: boolean;
}

const PriceValidationLoadingModal = ({ isEnabling }: PriceValidationLoadingModalProps) => {
  const { translate } = useTranslation();

  const { classes } = usePriceValidationLoadingModalStyles();

  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState<boolean>(true);

  const handleButtonClick = () => {
    setIsLoadingModalOpen(false);
  };

  return (
    <Dialog maxWidth='Medium' fullWidth open={isLoadingModalOpen}>
      <DialogTitle>
        {isEnabling
          ? translate('Heading.PriceCheckEnabling')
          : translate('Heading.PriceCheckDisabling')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {isEnabling
            ? translate('Description.PriceCheckEnabling')
            : translate('Description.PriceCheckDisabling')}
        </DialogContentText>
        <div className={classes.loadingCircle}>
          <CircularProgress />
        </div>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' size='large' variant='outlined' onClick={handleButtonClick}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PriceValidationLoadingModal;
