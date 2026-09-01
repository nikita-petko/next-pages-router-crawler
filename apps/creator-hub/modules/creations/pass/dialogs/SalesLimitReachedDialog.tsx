import NextLink from 'next/link';
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import passesClient from '@modules/clients/passes';
import TranslationNamespace from '@modules/miscellaneous/localization/enums/TranslationNamespace';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import { openDialog } from '@modules/monetization-shared/dialog/actions';

const DEFAULT_SALES_LIMIT = 50;

type Props = {
  universeId: number;
  salesLimit: number;
  onCancel: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function SalesLimitReachedDialog({ universeId, salesLimit, onCancel, open, onOpenChange }: Props) {
  const { translate } = useTranslation();

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);

    // Also invoke onCancel when the dialog is closed
    if (!isOpen) {
      onCancel();
    }
  };

  const handleClose = () => {
    handleOpenChange(false);
    onCancel();
  };

  return (
    <Dialog
      size='Medium'
      isModal
      open={open}
      onOpenChange={handleOpenChange}
      hasCloseAffordance={false}>
      <DialogContent className='!min-width-[280px] width-full'>
        <DialogBody className='flex flex-col gap-y-xsmall'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {translate('Heading.SalesLimitReached')}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none padding-bottom-medium'>
            {translate('Description.SalesLimitReached', { number: salesLimit.toString() })}
          </span>
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row'>
          <Button
            asChild
            variant='Emphasis'
            size='Medium'
            className='fill small:basis-0'
            onClick={handleClose}>
            <NextLink href={dashboard.getMonetizationPassesUrl(universeId)}>
              {translate('Action.ManagePasses')}
            </NextLink>
          </Button>
          <Button
            variant='Standard'
            size='Medium'
            className='fill small:basis-0'
            onClick={handleClose}>
            {translate('Action.CancelSale')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TranslatedDialog = withTranslation(SalesLimitReachedDialog, [TranslationNamespace.Passes]);

type WithSalesLimitReachedDialogOptions = {
  universeId: number;
  /** Invoked when the user clicks the cancel button on the dialog. */
  onCancel: () => void;
  /** Invoked when the API call fails. The wrapper also invokes `onCancel` after `onError`. */
  onError: (error: unknown) => void;
};

/**
 * Queries the pass sales limit info for the given universe and opens the
 * sales-limit-reached dialog only when the limit has been hit.
 *
 * On API failure, both `onError` and `onCancel` are invoked and the dialog is not opened.
 * Note `onCancel` will also be invoked when the user escapes the dialog.
 */
export async function withSalesLimitReachedDialog({
  universeId,
  onCancel,
  onError,
}: WithSalesLimitReachedDialogOptions): Promise<void> {
  let result;
  try {
    result = await passesClient.getPassSalesLimitInfo({ universeid: universeId });
  } catch (error) {
    onError(error);
    onCancel();
    return;
  }

  const { salesLimit, hasLimitBeenReached } = result;
  if (!hasLimitBeenReached) {
    return;
  }

  openDialog({
    component: TranslatedDialog,
    props: { universeId, salesLimit: salesLimit ?? DEFAULT_SALES_LIMIT, onCancel },
    options: { mode: 'standalone' },
  });
}
