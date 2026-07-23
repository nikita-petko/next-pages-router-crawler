import { useCallback, useState } from 'react';
import { Button, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { PaidAccessReactivationCooldownHours } from '../constants/AccessConstants';

// Confirmation shown before an access/monetization change with a side effect the creator should know about.
export type AccessChangeType =
  | 'PrivateServerFreeToPaid'
  | 'PrivateServerPaidToFree'
  | 'PrivateServerTurnOff'
  | 'PaidAccessTurnOff';

const accessChangeCopy = {
  PrivateServerFreeToPaid: {
    title: 'Title.ChangeToPaidPrivateServers',
    body: 'Message.ChangeToPaidPrivateServers',
    confirmLabel: 'Action.Confirm',
  },
  PrivateServerPaidToFree: {
    title: 'Title.MakePrivateServersFree',
    body: 'Message.MakePrivateServersFree',
    confirmLabel: 'Action.Confirm',
  },
  PrivateServerTurnOff: {
    title: 'Title.turnoffPrivateServer',
    body: 'Message.turnoffPrivateServer',
    confirmLabel: 'Action.Confirm',
  },
  PaidAccessTurnOff: {
    title: 'Title.TurnOffPaidAccess',
    body: pluralize(
      PaidAccessReactivationCooldownHours,
      'Message.TurnOffPaidAccessCooldownSingular',
      'Message.TurnOffPaidAccessCooldown',
    ),
    confirmLabel: 'Action.TurnOff',
  },
} as const satisfies Record<
  AccessChangeType,
  { title: string; body: string; confirmLabel: string }
>;

type Props = {
  changeType: AccessChangeType;
  onConfirm: () => Promise<void>;
  onClose: () => void;
};

function AccessChangeConfirmationDialogContent({ changeType, onConfirm, onClose }: Props) {
  const { translateWithNamespace } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  const translationKeys = accessChangeCopy[changeType];
  const bodyArgs =
    changeType === 'PaidAccessTurnOff'
      ? { hours: String(PaidAccessReactivationCooldownHours) }
      : undefined;
  const title = translateWithNamespace(TranslationNamespace.Access, translationKeys.title);
  const body = translateWithNamespace(TranslationNamespace.Access, translationKeys.body, bodyArgs);
  const confirmLabel = translateWithNamespace(
    TranslationNamespace.Access,
    translationKeys.confirmLabel,
  );

  const handleConfirm = useCallback(() => {
    if (isConfirming) {
      return;
    }
    setIsConfirming(true);
    void onConfirm().then(onClose, onClose);
  }, [isConfirming, onConfirm, onClose]);

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {title}
        </DialogTitle>
        <span className='text-body-medium content-default'>{body}</span>
      </DialogBody>
      <DialogFooter className='flex flex-col gap-small small:flex-row'>
        <Button
          variant='Emphasis'
          size='Medium'
          className='fill small:basis-0'
          onClick={handleConfirm}
          isLoading={isConfirming}
          isDisabled={isConfirming}>
          {confirmLabel}
        </Button>
        <Button
          variant='Standard'
          size='Medium'
          className='fill small:basis-0'
          onClick={onClose}
          isDisabled={isConfirming}>
          {translateWithNamespace(TranslationNamespace.Access, 'Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedAccessChangeConfirmationDialogContent = withTranslation(
  AccessChangeConfirmationDialogContent,
  [TranslationNamespace.Access],
);

export function openAccessChangeConfirmationDialog(params: Omit<Props, 'onClose'>) {
  openDialog({
    content: <TranslatedAccessChangeConfirmationDialogContent {...params} onClose={closeDialog} />,
  });
}
