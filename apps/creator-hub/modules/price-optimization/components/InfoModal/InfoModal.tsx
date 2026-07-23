import type { ReactNode } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';

interface InfoModalProps {
  title: ReactNode;
  description: ReactNode;
  buttonText: ReactNode;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}

const InfoModal = ({ title, description, buttonText, isOpen, setOpen }: InfoModalProps) => {
  return (
    <Dialog fullWidth maxWidth='Medium' open={isOpen} onClose={() => setOpen(false)}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant='body2' color='secondary'>
          {description}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button size='large' variant='contained' color='primary' onClick={() => setOpen(false)}>
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InfoModal;
