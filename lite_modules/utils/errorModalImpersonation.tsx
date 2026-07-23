import { Button } from '@rbx/foundation-ui';

export const SetErrorModalImpersonationConfig = (
  setModalOpen: (open: boolean) => void,
  setModalConfigData: (data: object) => void,
) => {
  setModalConfigData({
    dialogActions: (
      <Button
        onClick={() => {
          setModalOpen(false);
        }}
        size='Medium'
        variant='Standard'>
        Close
      </Button>
    ),
    dialogContent: 'You are not allowed to perform this action in impersonation.',
    handleClose: () => {
      setModalOpen(false);
    },
    title: 'Error',
  });

  setModalOpen(true);
};
