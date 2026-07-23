import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Link, YoutubeVideo } from '@modules/miscellaneous/common';
import { rootDocumentationLink, introductionVideoId } from '../../constants/links';
import useIntroductionModalStyles from './IntroductionModal.styles';

export interface IntroductionModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const IntroductionModal = ({ open, setOpen }: IntroductionModalProps) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useIntroductionModalStyles();

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='Large'>
      <YoutubeVideo videoId={introductionVideoId} className={classes.video} />
      <DialogTitle>{translate('Heading.Introduction')}</DialogTitle>
      <DialogContent>
        <Typography variant='captionBody' className={classes.modalContent}>
          {translateHTML('Description.Introduction', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content: (chunks) => (
                <Link href={rootDocumentationLink} target='_blank'>
                  {chunks}
                </Link>
              ),
            },
          ])}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button size='large' variant='contained' color='primary' onClick={() => setOpen(false)}>
          {translate('Action.GotIt')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IntroductionModal;
