import { useState } from 'react';
import {
  Button,
  Checkbox,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { pluralize } from '@modules/monetization-shared/pluralize';
import { closeDialog, openDialog } from '@modules/monetization-shared/dialog/actions';
import { ContentModeOptions } from '@modules/monetization-shared/dialog/types';
import { useIsBatchUpdateManagedProductsStatusPending } from '../manage-items/hooks/useBatchUpdateManagedProductsStatus';

type Props = {
  universeId: number;
  /** Number of items being disabled. If not provided, the copy will default to the context of "this item". */
  count?: number;
  onConfirm: (() => void) | (() => Promise<void>);
  onClose: () => void;
};

const localKey = (universeId: number) =>
  `ignoreDisableManagedPricingWarning.${universeId}` as const;

export const setIgnoreDisableManagedPricingWarning = (universeId: number) =>
  localStorage.setItem(localKey(universeId), 'true');

export const getIgnoreDisableManagedPricingWarning = (universeId: number) =>
  !!localStorage.getItem(localKey(universeId));

const getHeadingTranslationKey = (count?: number) => {
  if (count === undefined) {
    return 'Heading.DisableManagedPricingWarning';
  }

  return pluralize(
    count,
    'Heading.DisableManagedPricingWarningSingle',
    'Heading.DisableManagedPricingWarningMultiple',
  );
};

function DisableManagedPricingWarningDialogContent({
  universeId,
  count,
  onConfirm,
  onClose,
}: Props) {
  const { translate } = useTranslation();

  const isMutating = useIsBatchUpdateManagedProductsStatusPending({ universeId });

  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleConfirm = async () => {
    await onConfirm();
    if (dontShowAgain) {
      setIgnoreDisableManagedPricingWarning(universeId);
    }
    onClose();
  };

  return (
    <DialogContent className='!min-width-[280px] width-full'>
      <DialogBody className='flex flex-col gap-y-xsmall'>
        <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
          {translate(getHeadingTranslationKey(count), { count: count?.toString() ?? '' })}
        </DialogTitle>
        <span className='text-body-medium content-default margin-none padding-bottom-medium'>
          {pluralize(
            count ?? 1,
            translate('Message.DisableManagedPricingWarningSingle'),
            translate('Message.DisableManagedPricingWarningMultiple'),
          )}
        </span>
        <Checkbox
          size='Small'
          placement='Start'
          isChecked={dontShowAgain}
          onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          label={translate('Label.DontShowThisMessageAgain')}
          // Admittedly it's really annoying we have to do this to override label styling...
          className='[&>label>span]:text-body-small [&>label>span]:padding-none [&>label>span]:margin-y-auto'
        />
      </DialogBody>
      <DialogFooter className='flex gap-x-small'>
        <Button
          variant='Alert'
          size='Medium'
          className='fill basis-0'
          onClick={handleConfirm}
          isLoading={isMutating}
          isDisabled={isMutating}>
          {translate('Action.TurnOff')}
        </Button>
        <Button
          variant='Standard'
          size='Medium'
          className='fill basis-0'
          onClick={onClose}
          isDisabled={isMutating}>
          {translate('Action.Cancel')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

const TranslatedDialogContent = withTranslation(DisableManagedPricingWarningDialogContent, [
  TranslationNamespace.ManagedPricing,
]);

// eslint-disable-next-line import/prefer-default-export -- keep named export
export async function withDisableManagedPricingWarningDialog(
  props: Omit<Props, 'onClose'>,
  options?: ContentModeOptions,
) {
  if (getIgnoreDisableManagedPricingWarning(props.universeId)) {
    await props.onConfirm();
    return;
  }

  openDialog({
    content: <TranslatedDialogContent {...props} onClose={closeDialog} />,
    options: options ?? {},
  });
}
