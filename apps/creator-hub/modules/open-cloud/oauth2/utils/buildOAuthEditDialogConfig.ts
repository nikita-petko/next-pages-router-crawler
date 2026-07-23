import type { ReactNode } from 'react';
import type { UseTranslationResult } from '@rbx/intl';
import editModeTranslationsMap from '../constants/editDialogConstants';
import EditOAuthAppFormDialogState from '../enums/EditOAuthAppFormDialogState';
import type OAuthFormDialogButtonOptions from '../enums/OAuthFormDialogButtonOptions';

type TranslateReturnType = UseTranslationResult['translate'];

export interface DialogConfiguration {
  title: string;
  firstPartContent: string;
  secondPartContent: string;
  confirmText: string;
  confirmAction: () => void;
  confirmIcon: ReactNode;
  cancelAction: () => void;
  cancelText?: string;
  confirmButtonColor: OAuthFormDialogButtonOptions;
}

function buildOAuthEditDialogConfig(
  confirm: () => void,
  cancel: () => void,
  dialogState: EditOAuthAppFormDialogState,
  translate: TranslateReturnType,
  confirmIcon?: ReactNode,
  appName?: string,
): DialogConfiguration {
  const dialogControlKeys = editModeTranslationsMap[dialogState];
  return {
    title:
      dialogState === EditOAuthAppFormDialogState.Delete && appName
        ? translate(dialogControlKeys.title, {
            appName,
          })
        : translate(dialogControlKeys.title),
    firstPartContent: translate(dialogControlKeys.firstPartContent),
    secondPartContent: translate(dialogControlKeys.secondPartContent),
    confirmText: translate(dialogControlKeys.confirmText),
    confirmAction: confirm,
    confirmIcon,
    cancelAction: cancel,
    cancelText: translate(dialogControlKeys.cancelText ?? ''),
    confirmButtonColor: dialogControlKeys.confirmButtonColor,
  };
}

export default buildOAuthEditDialogConfig;
