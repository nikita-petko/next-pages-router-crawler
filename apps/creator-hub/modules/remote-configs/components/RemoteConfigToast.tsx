import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { Snackbar } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

export enum RemoteConfigToastState {
  ClipboardCopySuccess = 'clipboard-copy-success',
}

type RemoteConfigToastProps = {
  toastState: RemoteConfigToastState | null;
  onClose: () => void;
};

const RemoteConfigToast: FC<RemoteConfigToastProps> = ({ toastState, onClose }) => {
  const { translate } = useTranslationWrapper(useTranslation());

  if (!toastState) {
    return null;
  }
  let message;
  switch (toastState) {
    case RemoteConfigToastState.ClipboardCopySuccess:
      message = translate(
        translationKey(
          'Toast.ClipboardCopySuccess',
          TranslationNamespace.UniverseConfigAndExperimentation,
        ),
      );
      break;
    default: {
      const exhaustiveCheck: never = toastState;
      throw new Error(`Unknown toast state: ${exhaustiveCheck}`);
    }
  }
  return (
    <Snackbar
      open
      autoHide
      message={message}
      onClose={onClose}
      anchorOrigin={{
        horizontal: 'center',
        vertical: 'bottom',
      }}
    />
  );
};
export default RemoteConfigToast;
