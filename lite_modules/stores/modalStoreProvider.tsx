import { Button } from '@rbx/foundation-ui';
import { Grid, makeStyles } from '@rbx/ui';
import { ReactNode } from 'react';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { AMAErrorResponseType, AMAErrorType } from '@type/errorResponse';

interface ModalConfigType {
  completelyCustomModalContents?: ReactNode;
  dialogActions?: ReactNode | null;
  dialogContent?: ReactNode | null;
  fullWidth?: boolean;
  handleClose?: ((node: HTMLElement) => void) | ((_: unknown, reason: string) => void);
  title?: ReactNode;
}

export const DEFAULT_MODAL_CONFIG: ModalConfigType = {
  completelyCustomModalContents: undefined,
  dialogActions: null,
  dialogContent: null,
  handleClose: () => {},
  title: '',
};

interface ModalState {
  isOpen: boolean;
  modalConfig: ModalConfigType;
  setModalConfigData: (config: ModalConfigType) => void;
  setModalConfigDataToErrorModal: (errorResponse?: AMAErrorResponseType) => void;
  setModalOpen: (isOpen: boolean) => void;
}

const useErrorModalStyles = makeStyles()(() => ({
  errorCodeText: {
    opacity: 0.5,
  },
}));

const ErrorModalCloseButton = ({ onClose }: { onClose: () => void }) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  return (
    <Button onClick={onClose} size='Medium' variant='Standard'>
      {translate('Action.Close')}
    </Button>
  );
};

const ErrorModalTitle = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  return <>{translate('Label.Error')}</>;
};

const ErrorModalContent = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Misc);
  return <>{translate('Message.GenericError')}</>;
};

const ErrorModalContentWithDetails = ({ error }: { error: AMAErrorType }) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Error);
  const {
    classes: { errorCodeText },
  } = useErrorModalStyles();
  return (
    <Grid container direction='column' gap={2}>
      <span className='text-body-large'>{error.message}</span>
      {error.code ? (
        <span className={`text-body-large ${errorCodeText}`}>
          {translate('Label.ErrorCode', { errorCode: String(error.code) })}
        </span>
      ) : null}
    </Grid>
  );
};

export const useModalStore = create<ModalState>()(
  immer((set, get) => ({
    isOpen: false,
    modalConfig: DEFAULT_MODAL_CONFIG,
    setModalConfigData: (config) => {
      set((draft) => {
        draft.modalConfig = config;
      });
    },
    setModalConfigDataToErrorModal: (errorResponse?: AMAErrorResponseType) => {
      const close = () => get().setModalOpen(false);
      get().setModalConfigData({
        dialogActions: <ErrorModalCloseButton onClose={close} />,
        dialogContent: errorResponse?.error ? (
          <ErrorModalContentWithDetails error={errorResponse.error} />
        ) : (
          <ErrorModalContent />
        ),
        handleClose: close,
        title: <ErrorModalTitle />,
      });
    },
    setModalOpen: (isOpen) => {
      set((draft) => {
        draft.isOpen = isOpen;
      });
    },
  })),
);
