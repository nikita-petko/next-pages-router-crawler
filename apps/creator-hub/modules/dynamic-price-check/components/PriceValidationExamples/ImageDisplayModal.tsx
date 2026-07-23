import { Dialog, DialogContent, DialogActions, Typography, Button } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import useImageDisplayModalStyles from './ImageDisplayModal.styles';

interface ImageDisplayModalProps {
  imageAlt: string;
  imageLink: string;
  headingText: string;
  descriptionText: string;
  isOpen: boolean;
  onClose: () => void;
}

const ImageDisplayModal = ({
  imageAlt,
  imageLink,
  headingText,
  descriptionText,
  isOpen,
  onClose,
}: ImageDisplayModalProps) => {
  const { translate } = useTranslation();

  const { classes } = useImageDisplayModalStyles();

  return (
    <Dialog maxWidth='Medium' fullWidth open={isOpen} onClose={onClose}>
      <DialogContent className={classes.dialogModal}>
        <div className={classes.imageContainer}>
          <img className={classes.croppedImage} alt={imageAlt} src={imageLink} />
        </div>
        <div className={classes.dialogText}>
          <Typography variant='h4' component='h4'>
            {headingText}
          </Typography>
          <Typography variant='body2' component='p' color='secondary'>
            {descriptionText}
          </Typography>
        </div>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' size='large' variant='outlined' onClick={onClose}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImageDisplayModal;
