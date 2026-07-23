import { useState, useCallback, type ReactNode } from 'react';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogTitle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button } from '@rbx/ui';

interface ConfirmOptions {
  title: string;
  description: string;
  primaryActionLabel: string;
  isDangerous?: boolean;
  extraContent?: ReactNode;
}

type ResolveTypes =
  | {
      type: 'confirm';
      resolve: (value: { confirmed: boolean }) => void;
    }
  | {
      /**
       * In some cases we'll want to show a loading button while the API call we confirmed takes places.
       * So we'll return both the confirmed value and a function to close the dialog (as opposed to closing it immediately)
       */
      type: 'confirmWithLoading';
      resolve: (value: [{ confirmed: boolean }, () => void]) => void;
    };

interface ConfirmationState extends ConfirmOptions {
  isOpen: boolean;
  isLoading?: boolean;
  resolveDetails: ResolveTypes;
}

/**
 * Utility hook to give us an async confirmation dialog.
 *
 * It exposes an `confirmation` function that can be awaited.
 *
 * ```tsx
 * const { confirm, confirmationContent } = useConfirmation();
 *
 * const handleClick = async () => {
 *  const { confirmed } = await confirm({
 *    title: 'Confirm',
 *    description: 'Are you sure you want to do this?',
 *    primaryActionLabel: 'Confirm',
 *    isDangerous: false
 *  });
 *  if (confirmed) {
 *    console.log('Confirmed');
 *  }
 * }
 *
 * return (
 *  <>
 *    {confirmationContent}
 *    <Button onClick={handleClick}>Confirm</Button>
 *  </>
 * )
 * ```
 *
 * It also exposes a `confirmWithLoading` function that can be awaited.
 *
 * ```tsx
 * const { confirmWithLoading, confirmationContent } = useConfirmation();
 * const mutation = useMyMutation();
 *
 * const handleClick = async () => {
 *  const [{ confirmed }, closeConfirmation] = await confirmWithLoading({
 *    title: 'Confirm',
 *    description: 'Are you sure you want to do this?',
 *    primaryActionLabel: 'Confirm',
 *    isDangerous: false,
 *    extraContent: <MyCustomComponent />
 *  });
 *
 *  if (confirmed) {
 *    try {
 *      await mutation.mutateAsync();
 *      // Handle success
 *    } catch (e) {
 *      // Handle error
 *    } finally {
 *      closeConfirmation();
 *    }
 *  }
 * }
 *
 * return (
 *  <>
 *    {confirmationContent}
 *    <Button onClick={handleClick} loading={mutation.isPending}>Confirm</Button>
 *  </>
 * )
 * ```
 *
 * `extraContent` is injected into the same `DialogBody` as the description (scrollable when content
 * overflows).
 */
const useConfirmation = () => {
  const { translate } = useTranslation();
  const [confirmationState, setConfirmationState] = useState<ConfirmationState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<{ confirmed: boolean }> => {
    return new Promise((resolve) => {
      setConfirmationState({
        ...options,
        isOpen: true,
        resolveDetails: {
          type: 'confirm',
          resolve,
        },
      });
    });
  }, []);

  const confirmWithLoading = useCallback(
    (options: ConfirmOptions): Promise<[{ confirmed: boolean }, () => void]> => {
      return new Promise((resolve) => {
        setConfirmationState({
          ...options,
          isOpen: true,
          resolveDetails: {
            type: 'confirmWithLoading',
            resolve,
          },
        });
      });
    },
    [],
  );

  const handleClose = useCallback(
    (confirmed: boolean) => {
      const result = { confirmed };

      if (confirmationState?.resolveDetails.type === 'confirm') {
        confirmationState.resolveDetails.resolve(result);
        setConfirmationState(null);
      } else if (confirmationState?.resolveDetails.type === 'confirmWithLoading') {
        setConfirmationState((oldState) =>
          oldState && confirmed ? { ...oldState, isLoading: true } : null,
        );
        confirmationState.resolveDetails.resolve([
          result,
          () => {
            setConfirmationState(null);
          },
        ]);
      }
    },
    [confirmationState],
  );

  const confirmationContent: ReactNode | null = confirmationState ? (
    <Dialog
      open={confirmationState.isOpen}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          handleClose(false);
        }
      }}
      size='Medium'
      isModal
      hasCloseAffordance={false}>
      <DialogContent>
        <DialogBody className='flex flex-col gap-y-xsmall scroll-y min-height-[0px]'>
          <DialogTitle className='text-heading-small margin-y-none padding-bottom-xsmall'>
            {confirmationState.title}
          </DialogTitle>
          <span className='text-body-medium content-default margin-none'>
            {confirmationState.description}
          </span>
          {confirmationState.extraContent != null && (
            <span className='margin-top-small'>{confirmationState.extraContent}</span>
          )}
        </DialogBody>
        <DialogFooter className='flex flex-col gap-small small:flex-row small:justify-end'>
          <Button
            onClick={() => handleClose(false)}
            variant='contained'
            color='secondary'
            disabled={confirmationState.isLoading}>
            {translate('Action.Cancel')}
          </Button>
          <Button
            onClick={() => handleClose(true)}
            loading={confirmationState.isLoading}
            variant='contained'
            color={confirmationState.isDangerous ? 'destructive' : 'primaryBrand'}>
            {confirmationState.primaryActionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;

  return { confirm, confirmWithLoading, confirmationContent };
};

export default useConfirmation;
