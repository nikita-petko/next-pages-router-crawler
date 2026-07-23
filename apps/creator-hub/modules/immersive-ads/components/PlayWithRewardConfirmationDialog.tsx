import { useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

interface ConfirmationDialogProps {
  onConfirm: () => void;
  onClose: () => void;
}

export const EnablePlayWithRewardTestModeDialog = ({
  onConfirm,
  onClose,
}: ConfirmationDialogProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const namespace = TranslationNamespace.ImmersiveAdsAnalytics;

  return (
    <Dialog
      size='Medium'
      isModal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-small'>
            <DialogTitle className='text-heading-small margin-none'>
              {translate(translationKey('Title.EnablePlayWithRewardTestMode', namespace))}
            </DialogTitle>
            <span className='text-body-medium content-muted'>
              {translate(translationKey('Description.EnablePlayWithRewardTestMode', namespace))}
            </span>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex justify-end gap-small width-full'>
            <Button variant='Emphasis' size='Medium' onClick={onConfirm}>
              {translate(translationKey('Label.Yes', namespace))}
            </Button>
            <Button variant='Standard' size='Medium' onClick={onClose}>
              {translate(translationKey('Label.Cancel', namespace))}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface DisablePlayWithRewardPlacementDialogProps extends ConfirmationDialogProps {
  isPending: boolean;
}

export const DisablePlayWithRewardPlacementDialog = ({
  isPending,
  onConfirm,
  onClose,
}: DisablePlayWithRewardPlacementDialogProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const namespace = TranslationNamespace.ImmersiveAdsAnalytics;

  return (
    <Dialog
      size='Medium'
      isModal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-small'>
            <DialogTitle className='text-heading-small margin-none'>
              {translate(translationKey('Title.DisablePlayWithRewardPlacement', namespace))}
            </DialogTitle>
            <span className='text-body-medium content-muted'>
              {translate(translationKey('Description.DisablePlayWithRewardPlacement', namespace))}
            </span>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex justify-end gap-small width-full'>
            <Button
              variant='Emphasis'
              size='Medium'
              isDisabled={isPending}
              isLoading={isPending}
              onClick={onConfirm}>
              {translate(translationKey('Label.Yes', namespace))}
            </Button>
            <Button variant='Standard' size='Medium' isDisabled={isPending} onClick={onClose}>
              {translate(translationKey('Label.Cancel', namespace))}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const LaunchPlayWithRewardPlacementDialog = ({
  onConfirm,
  onClose,
}: ConfirmationDialogProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const namespace = TranslationNamespace.ImmersiveAdsAnalytics;

  return (
    <Dialog
      size='Medium'
      isModal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-small'>
            <DialogTitle className='text-heading-small margin-none'>
              {translate(translationKey('Title.PublishPlayWithRewardPlacement', namespace))}
            </DialogTitle>
            <span className='text-body-medium'>
              {translate(translationKey('Description.PublishPlayWithRewardPlacement', namespace))}
            </span>
            <Checkbox
              size='Medium'
              placement='Start'
              isChecked={isAcknowledged}
              onCheckedChange={(checked) => setIsAcknowledged(checked === true)}
              label={translate(
                translationKey('Label.AcknowledgeProcessReceiptImplementation', namespace),
              )}
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='flex justify-end gap-small width-full'>
            <Button
              variant='Emphasis'
              size='Medium'
              isDisabled={!isAcknowledged}
              onClick={onConfirm}>
              {translate(translationKey('Label.Publish', namespace))}
            </Button>
            <Button variant='Standard' size='Medium' onClick={onClose}>
              {translate(translationKey('Label.Cancel', namespace))}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface PlayWithRewardTestModeInfoDialogProps {
  onClose: () => void;
}

export const PlayWithRewardTestModeInfoDialog = ({
  onClose,
}: PlayWithRewardTestModeInfoDialogProps) => {
  const { translate } = useTranslationWrapper(useTranslation());
  const namespace = TranslationNamespace.ImmersiveAdsAnalytics;

  return (
    <Dialog
      size='Medium'
      isModal
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody>
          <div className='flex flex-col gap-small'>
            <DialogTitle className='text-heading-small margin-none'>
              {translate(translationKey('Title.PlayWithRewardPlacementInTestMode', namespace))}
            </DialogTitle>
            <span className='text-body-medium content-muted'>
              {translate(
                translationKey('Description.PlayWithRewardPlacementInTestMode', namespace),
              )}
            </span>
            <span className='text-body-medium content-muted'>
              {translate(
                translationKey('Description.PlayWithRewardPlacementInTestModeNote', namespace),
              )}
            </span>
          </div>
        </DialogBody>
        <DialogFooter>
          <div className='width-full'>
            <Button className='width-full' variant='Emphasis' size='Medium' onClick={onClose}>
              {translate(translationKey('Label.OK', namespace))}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
