import type { UseTranslationResult } from '@rbx/intl';
import {
  createModeTranslationsMap,
  editModeTranslationMap,
} from '../constants/formDialogConstants';
import type CreateDialogMode from '../enums/CreateDialogMode';
import type EditDialogMode from '../enums/EditDialogMode';
import type ConfirmationDialogControls from '../interfaces/v1/ConfirmationDialogControls';

type TranslateReturnType = UseTranslationResult['translate'];

/**
 * Dialog body builder for prompting the user when they are about to remove a target / resource
 * @param translatedTargetPartName the translated target name (i.e. 'Universe', 'Datastore')
 * @param friendlyTargetValue the 'friendly' target value (i.e. a universe id becomes its name, a datastore name is decoded)
 * @param translate the useTranslation hook translate method
 * @param isCreatorInAsset whether this is a creator being deleted in an asset product (uses different translation key)
 * @returns a ConfirmationDialogControls object that can be used to render the dialog
 */
const buildDeleteTargetDialogControls = (
  translatedTargetPartName: string,
  friendlyTargetValue: string,
  translate: TranslateReturnType,
  isCreatorInAsset?: boolean,
): ConfirmationDialogControls => {
  return {
    title: translate(
      isCreatorInAsset ? 'Heading.RemoveTargetPartForAssets' : 'Heading.RemoveTargetPart',
      {
        targetPart: translatedTargetPartName,
      },
    ),
    cancelBtnTxt: translate('Action.Cancel'),
    confirmBtnTxt: translate('Button.Remove'),
    buildDialogBodyProps: {
      firstMessage: translate(
        isCreatorInAsset
          ? 'Message.RemoveTargetPartConfirmForAssets'
          : 'Message.RemoveTargetPartConfirm',
        {
          targetPartName: translatedTargetPartName,
          targetPartValue: friendlyTargetValue,
        },
      ),
      bodyTextAlign: 'left',
    },
  };
};

/**
 * Dialog body builder for prompting user when they are about to remove an API system
 * @param translatedProductName the translated API system name (i.e. Place Management, Datastores API)
 * @param translate the useTranslation hook translate method
 * @returns a ConfirmationDialogControls object that can be used to render the dialog
 */
const buildDeleteApiSystemDialogControls = (
  translatedProductName: string,
  translate: TranslateReturnType,
): ConfirmationDialogControls => {
  return {
    title: translate('Heading.RemoveAPISystem'),
    cancelBtnTxt: translate('Action.Cancel'),
    confirmBtnTxt: translate('Button.Remove'),
    buildDialogBodyProps: {
      firstMessage: translate('Message.RemoveAPIConfirm', {
        apiSystem: translatedProductName,
      }),
      bodyTextAlign: 'left',
    },
  };
};

/**
 * Dialog body builder for prompting user when they are about to toggle wildcard target parts
 * @param translate the useTranslation hook translate method
 * @param isAssetProduct whether this is an asset product (uses different translation keys)
 * @returns a ConfirmationDialogControls object that can be used to render the dialog
 */
const buildToggleWildcardsSystemDialogControls = (
  translate: TranslateReturnType,
  isAssetProduct?: boolean,
): ConfirmationDialogControls => {
  return {
    title: translate(
      isAssetProduct ? 'Heading.ToggleWildcardsForAssets' : 'Heading.ToggleWildcards',
    ),
    cancelBtnTxt: translate('Action.Cancel'),
    confirmBtnTxt: translate('Button.Continue'),
    buildDialogBodyProps: {
      firstMessage: translate(
        isAssetProduct
          ? 'Message.ToggleWildcardsConfirmForAssets'
          : 'Message.ToggleWildcardsConfirm',
      ),
      bodyTextAlign: 'left',
    },
  };
};

/**
 * Dialog builder for create form
 * @param mode the mode the confirmation dialog was created in (for create form)
 * @param translate the useTranslation hook translate method
 * @returns a ConfirmationDialogControls object that can be used to render the dialog
 */
const buildCreateDialogControls = (
  mode: CreateDialogMode,
  translate: TranslateReturnType,
): ConfirmationDialogControls => {
  const dialogControlKeys = createModeTranslationsMap[mode];
  return {
    title: translate(dialogControlKeys.titleKeys.titleKey),
    cancelBtnTxt: translate(dialogControlKeys.cancelBtnKey),
    confirmBtnTxt: translate(dialogControlKeys.confirmBtnKey),
    buildDialogBodyProps: {
      firstMessage: translate(dialogControlKeys.firstContentKey),
      secondMessage: dialogControlKeys.secondContentKey
        ? translate(dialogControlKeys.secondContentKey)
        : undefined,
    },
  };
};

/**
 * Dialog builder for edit form
 * @param mode the mode the confirmation dialog was created in (for edit form)
 * @param translate the useTranslation hook translate method
 * @returns a ConfirmationDialogControls object that can be used to render the dialog
 */
const buildEditDialogControls = (
  mode: EditDialogMode,
  translate: TranslateReturnType,
): ConfirmationDialogControls => {
  /** Translate all the control keys for the edit form. Two edge cases:
   * 1. Form title may need to interpolate the mode into it i.e. Confirm Key {mode}
   * 2. Dialog Content may only have one content string
   */

  const dialogControlKeys = editModeTranslationMap[mode];

  // translate the title (simple title or mode interpolated into title via special ConfirmKeyDialogMode key)
  let dialogTitle;
  if (typeof dialogControlKeys.titleKeys.modeKey !== 'undefined') {
    dialogTitle = translate(dialogControlKeys.titleKeys.titleKey, {
      dialogMode: translate(dialogControlKeys.titleKeys.modeKey),
    });
  } else {
    dialogTitle = translate(dialogControlKeys.titleKeys.titleKey);
  }

  return {
    title: dialogTitle,
    cancelBtnTxt: translate(dialogControlKeys.cancelBtnKey),
    confirmBtnTxt: translate(dialogControlKeys.confirmBtnKey),
    buildDialogBodyProps: {
      firstMessage: translate(dialogControlKeys.firstContentKey),
      secondMessage: dialogControlKeys.secondContentKey
        ? translate(dialogControlKeys.secondContentKey)
        : undefined,
    },
  };
};

/**
 * Dialog builder for deleting an API key from the table view
 * @param apiKeyName the API key name requested to be deleted
 * @param translate the useTranslation hook translate method
 * @returns a ConfirmationDialogControls object that can be used to render the dialog
 */
const buildDeleteKeyControls = (
  apiKeyName: string,
  translate: TranslateReturnType,
): ConfirmationDialogControls => {
  return {
    title: translate('Heading.RemoveKey'),
    cancelBtnTxt: translate('Action.Cancel'),
    confirmBtnTxt: translate('Action.Delete'),
    buildDialogBodyProps: {
      firstMessage: translate('Message.RemoveKeyPrompt', { apiKeyName }),
      bodyTextAlign: 'left',
    },
  };
};

export {
  buildDeleteTargetDialogControls,
  buildDeleteApiSystemDialogControls,
  buildToggleWildcardsSystemDialogControls,
  buildCreateDialogControls,
  buildEditDialogControls,
  buildDeleteKeyControls,
};
