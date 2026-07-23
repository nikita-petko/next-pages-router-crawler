import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductStatusType } from '@rbx/client-developer-subscriptions-api/v1';
import { resolveUrl } from '@rbx/env-utils';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Alert, DialogTemplate, Link, MenuItem, Typography, useDialog, useSnackbar } from '@rbx/ui';
import experienceSubscriptionsClient from '@modules/clients/experienceSubscriptions';
import { toastDurationTime } from '@modules/miscellaneous/common';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import type CreationData from '../../../common/interfaces/CreationData';
import ShortenedExperienceNameModal from '../ShortenedExperienceNameModal/ShortenedExperienceNameModal';

type Props = {
  creation: CreationData;
  handleClose: () => void;
  updateItem: (item: CreationData) => void;
};

function ItemCardExperienceSubscriptionActivationButton({
  creation,
  handleClose,
  updateItem,
}: Props) {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const { translate, translateHTML } = useTranslation();
  const { open, close: closeDialog, configure } = useDialog();
  const [isActivationLoading, setIsActivationLoading] = useState(false);
  const [suggestedShortenedExperienceName, setSuggestedShortenedExperienceName] = useState<
    string | undefined
  >('');
  const [showShortenedExperienceNameModal, setShowShortenedExperienceNameModal] = useState(false);

  const showCenterMsg = useCallback(
    (msg: string, isSuccessful: boolean) => {
      enqueue({
        children: <Alert severity={isSuccessful ? 'success' : 'error'}>{msg}</Alert>,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const getOrSuggestShortenedExperienceName = useCallback(async () => {
    if (creation.universeId) {
      const { shortenedName, suggestedShortenedName } =
        await experienceSubscriptionsClient.getOrSuggestShortenedExperienceName(
          creation.universeId,
        );

      // We only want to show SEN modal if the developer has never confirmed their SEN before.
      const showSENModal = shortenedName === undefined;

      setShowShortenedExperienceNameModal(showSENModal);
      setSuggestedShortenedExperienceName(
        showSENModal ? (suggestedShortenedName ?? '') : undefined,
      );
    }
  }, [creation.universeId]);

  const activateExperienceSubscription = useCallback(async () => {
    setIsActivationLoading(true);

    const subProductId = creation.subscriptionProductId?.startsWith('EXP-')
      ? creation.subscriptionProductId.slice(4)
      : creation.subscriptionProductId;

    try {
      const { success } = await experienceSubscriptionsClient.activateExperienceSubscription(
        creation.universeId ?? 0,
        subProductId ?? '',
      );
      if (success) {
        updateItem({ ...creation, productStatus: 2 });
        showCenterMsg(translate('Message.ActivateSubscriptionSuccess'), success);
      } else {
        showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
      }
    } catch {
      showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
    }

    setIsActivationLoading(false);
    closeDialog();
    handleClose();
  }, [creation, closeDialog, handleClose, updateItem, showCenterMsg, translate]);

  const confirmMakeActivationDialog = useMemo(() => {
    if (showShortenedExperienceNameModal) {
      return (
        <ShortenedExperienceNameModal
          universeId={creation.universeId ?? 0}
          translate={translate}
          translateHTML={translateHTML}
          suggestedName={suggestedShortenedExperienceName ?? ''}
          onCancel={() => {
            closeDialog();
            handleClose();
          }}
          onSuccess={() => {
            setShowShortenedExperienceNameModal(false);
            setSuggestedShortenedExperienceName(undefined);
            closeDialog();
            handleClose();
          }}
          showCenterMsg={showCenterMsg}
        />
      );
    }
    return (
      <DialogTemplate
        onConfirm={activateExperienceSubscription}
        onCancel={closeDialog}
        title={translate('Heading.ActivateSubscription')}
        content={
          <Typography color='primary'>
            {translate('Message.ActivateSubscriptionPrompt', {
              name: creation.name ?? '',
            })}
            <br />
            <br />
            {translateHTML('Message.AgreeToTermsAndUse', [
              {
                opening: 'LinkStart',
                closing: 'LinkEnd',
                content(chunks) {
                  return (
                    <Link
                      href={resolveUrl(
                        'ugcSubscriptionTermsOfUseUrl',
                        process.env.targetEnvironment,
                        process.env.buildTarget,
                      )}
                      target='_blank'>
                      {chunks}
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
        }
        confirmText={translate('Action.Activate')}
        cancelText={translate('Action.Cancel')}
        loading={isActivationLoading}
      />
    );
  }, [
    translate,
    closeDialog,
    showShortenedExperienceNameModal,
    activateExperienceSubscription,
    creation.name,
    creation.universeId,
    isActivationLoading,
    translateHTML,
    suggestedShortenedExperienceName,
    showCenterMsg,
    handleClose,
  ]);

  const handleDialogOpen = useCallback(() => {
    getOrSuggestShortenedExperienceName()
      .catch(() => {
        showCenterMsg(translate('Error.UnknownSubscriptionError'), false);
      })
      .finally(() => {
        open();
      });
  }, [getOrSuggestShortenedExperienceName, showCenterMsg, open, translate]);

  // For some reason the dialog will not rerender without this useEffect, likely because
  // configure is not directly rerendered by changes to isActivationLoading. This
  // solution seems to be used in other places too like ItemCardMigratePlaceButton.
  useEffect(() => {
    if (isActivationLoading) {
      configure(confirmMakeActivationDialog);
    }
  }, [isActivationLoading, confirmMakeActivationDialog, configure]);

  useEffect(() => {
    // The first case is when we shouldn't show the modal (go straight to activation)
    // The second case is when we should
    if (suggestedShortenedExperienceName === undefined || showShortenedExperienceNameModal) {
      configure(confirmMakeActivationDialog);
    }
  }, [
    configure,
    confirmMakeActivationDialog,
    showShortenedExperienceNameModal,
    suggestedShortenedExperienceName,
  ]);

  // If the product is not inactive, don't show this button
  if (
    creation.productStatus !== ProductStatusType.Inactive &&
    creation.productStatus !== ProductStatusType.OffSale
  ) {
    return null;
  }

  return (
    <MenuItem key='Action.Activate' onClick={handleDialogOpen}>
      <Typography>{translate('Action.Activate')}</Typography>
    </MenuItem>
  );
}

export default withTranslation(ItemCardExperienceSubscriptionActivationButton, [
  TranslationNamespace.ConfigureItem,
  TranslationNamespace.Creations,
  TranslationNamespace.ExperienceSubscriptions,
]);
