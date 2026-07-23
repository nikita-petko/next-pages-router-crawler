import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
import { useFlag } from '@rbx/flags';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Typography,
} from '@rbx/ui';
import { isAssetPrivacyOptOutSurveyEnabled } from '@generated/flags/contentAccessAndInventory';
import AssetPrivacyOpenUseFollowUpDialog from '@modules/asset-privacy/components/AssetPrivacyOpenUseFollowUpDialog';
import type { AssetPrivacyOptOutSurveyPayload } from '@modules/asset-privacy/types/assetPrivacyOptOutSurvey';
import { sendAssetPrivacyOptOutSurveySubmittedEvent } from '@modules/asset-privacy/utils/sendAssetPrivacyOptOutSurveySubmittedEvent';
import type { User } from '@modules/clients/users';
import { useEventTrackerProvider } from '@modules/eventStream/eventTrackerProvider';
import { ASSET_ACCESS_PRIVACY } from '@modules/miscellaneous/common/constants/linkConstants';

export enum FieldRequiringConfirmation {
  OWNER = 'owner',
  ASSET_PRIVACY_DEFAULT_RESTRICTED = 'assetPrivacyDefaultRestricted',
}

export const fieldsRequiringConfirmation = [
  FieldRequiringConfirmation.OWNER,
  FieldRequiringConfirmation.ASSET_PRIVACY_DEFAULT_RESTRICTED,
];

export interface ConfigureGroupFormDialogProps {
  cancelFunc: () => void;
  confirmFunc: () => void;
  fieldsToConfirm: FieldRequiringConfirmation[];
  isOpen: boolean;
  transferRecipient: User | undefined;
}

const ConfigureGroupFormDialog: FunctionComponent<
  React.PropsWithChildren<ConfigureGroupFormDialogProps>
> = ({ cancelFunc, confirmFunc, fieldsToConfirm, isOpen, transferRecipient }) => {
  const { translate, translateHTML } = useTranslation();
  const { trackerClient } = useEventTrackerProvider();
  const { value: showAssetPrivacyOptOutSurvey } = useFlag(isAssetPrivacyOptOutSurveyEnabled);
  const [currentFieldIndex, setCurrentFieldIndex] = useState(0);
  const [isAssetPrivacyFollowUpOpen, setIsAssetPrivacyFollowUpOpen] = useState(false);

  const goToNextFieldOrSubmit = useCallback(() => {
    const newFieldIndex = currentFieldIndex + 1;
    if (newFieldIndex >= fieldsToConfirm.length) {
      setCurrentFieldIndex(0);
      setIsAssetPrivacyFollowUpOpen(false);
      confirmFunc();
    } else {
      setCurrentFieldIndex(newFieldIndex);
    }
  }, [confirmFunc, currentFieldIndex, fieldsToConfirm.length]);

  const cancelDialog = useCallback(() => {
    setCurrentFieldIndex(0);
    setIsAssetPrivacyFollowUpOpen(false);
    cancelFunc();
  }, [cancelFunc]);

  const currentField = fieldsToConfirm[currentFieldIndex];

  const fieldToDialog = useCallback(
    (field: FieldRequiringConfirmation) => {
      switch (field) {
        case FieldRequiringConfirmation.OWNER:
          return (
            <>
              <DialogTitle>{translate('Title.ConfirmTransfer')} </DialogTitle>
              <DialogContent>
                {translate('Message.ConfirmTransfer', {
                  username: transferRecipient?.name ?? '',
                })}
              </DialogContent>
              <DialogActions>
                <Button onClick={cancelDialog}>{translate('Action.Cancel')}</Button>
                <Button onClick={goToNextFieldOrSubmit}>{translate('Action.Transfer')}</Button>
              </DialogActions>
            </>
          );
        case FieldRequiringConfirmation.ASSET_PRIVACY_DEFAULT_RESTRICTED:
          return (
            <>
              <DialogTitle>{translate('Heading.NewAssetsAsOpenUse')} </DialogTitle>
              <DialogContent>
                <Typography variant='body2' color='secondary'>
                  {translate('Description.TurnOffAssetPrivacy')}{' '}
                  {translateHTML('Label.LearnMoreAboutAssetPrivacy', [
                    {
                      opening: 'aStart',
                      closing: 'aEnd',
                      content(chunks) {
                        return (
                          <Link
                            href={ASSET_ACCESS_PRIVACY}
                            target='_blank'
                            rel='noopener noreferrer'
                            style={{ textDecoration: 'none' }}>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                </Typography>
                <br />
              </DialogContent>
              <DialogActions>
                <Button onClick={cancelDialog}>{translate('Action.Cancel')}</Button>
                <Button
                  onClick={() =>
                    showAssetPrivacyOptOutSurvey
                      ? setIsAssetPrivacyFollowUpOpen(true)
                      : goToNextFieldOrSubmit()
                  }>
                  {translate('Action.OK')}
                </Button>
              </DialogActions>
            </>
          );
        default:
          return null;
      }
    },
    [
      cancelDialog,
      goToNextFieldOrSubmit,
      showAssetPrivacyOptOutSurvey,
      transferRecipient?.name,
      translate,
      translateHTML,
    ],
  );

  const handleAssetPrivacyFollowUpClose = useCallback(() => {
    setIsAssetPrivacyFollowUpOpen(false);
    goToNextFieldOrSubmit();
  }, [goToNextFieldOrSubmit]);

  const handleAssetPrivacyFollowUpSubmit = useCallback(
    (payload: AssetPrivacyOptOutSurveyPayload) => {
      sendAssetPrivacyOptOutSurveySubmittedEvent({
        trackerClient,
        creatorType: 'group',
        payload,
      });
      setIsAssetPrivacyFollowUpOpen(false);
      goToNextFieldOrSubmit();
    },
    [goToNextFieldOrSubmit, trackerClient],
  );

  return (
    <>
      <Dialog open={isOpen && !isAssetPrivacyFollowUpOpen}>{fieldToDialog(currentField)}</Dialog>
      <AssetPrivacyOpenUseFollowUpDialog
        open={isOpen && isAssetPrivacyFollowUpOpen}
        surveyContext='group'
        onClose={handleAssetPrivacyFollowUpClose}
        onSubmit={handleAssetPrivacyFollowUpSubmit}
      />
    </>
  );
};

export default ConfigureGroupFormDialog;
