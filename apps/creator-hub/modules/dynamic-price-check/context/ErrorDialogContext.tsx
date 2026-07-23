import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link,
} from '@rbx/ui';
import { getSupportFormUrl } from '@modules/miscellaneous/common/urls/www';

type ErrorDialogProps = {
  title?: React.ReactNode;
  content?: React.ReactNode;
};

type ErrorDialogState = {
  error: boolean | ErrorDialogProps;
  setError: Dispatch<SetStateAction<boolean | ErrorDialogProps>>;
};

const ErrorDialogContext = createContext<ErrorDialogState | null>(null);
const ErrorDialogActions = createContext<Dispatch<
  SetStateAction<boolean | ErrorDialogProps>
> | null>(null);

/**
 * Hook to access the error dialog state. This hook should be only used within the ErrorDialog.
 */
const useErrorDialogState = () => {
  const context = useContext(ErrorDialogContext);
  if (!context) {
    throw new Error('useErrorDialogState must be used within a ErrorDialogProvider');
  }
  return context;
};

/**
 * Returns a setter to open error dialog when error is passed. Error can be emitted from
 * any component that uses this hook, and only the observing dialog can close itself.
 *
 * @example
 * ```tsx
 * const { data, isError } = useQuery(...);
 * useOpenErrorDialog(isError); // Opens the error dialog when there is an error
 * ```
 *
 * @example
 * ```tsx
 * const openErrorDialog = useOpenErrorDialog();
 *
 * const { data } = useQuery({
 *  queryFn: () => fetch('/api/data'),
 *  onError: () => openErrorDialog(), // Opens the error dialog when there is an error
 * });
 *
 * @example
 * ```tsx
 * const openErrorDialog = useOpenErrorDialog();
 *
 * const handleError = () => {
 *  // Open the error dialog with custom title and content
 *  openErrorDialog({
 *   title: 'Custom Error Title',
 *   content: 'Custom Error Content',
 *  });
 * };
 * ```
 */
export function useOpenErrorDialog(hasError?: boolean) {
  const setError = useContext(ErrorDialogActions);
  if (!setError) {
    throw new Error('useOpenErrorDialog must be used within a ErrorDialogProvider');
  }

  if (hasError) {
    setError(true);
  }
  return useCallback((props?: ErrorDialogProps) => setError(props ?? true), [setError]);
}

const supportLink = getSupportFormUrl();

export function ErrorDialog() {
  const { translate, translateHTML } = useTranslation();
  const { error, setError } = useErrorDialogState();

  const handleClose = () => setError(false);

  const title = typeof error === 'object' && error.title ? error.title : translate('Heading.Error');
  const content =
    typeof error === 'object' && error.content
      ? error.content
      : translateHTML('Message.Error', [
          {
            opening: 'linkStart',
            closing: 'linkEnd',
            content: (chunks) => (
              <Link href={supportLink} target='_blank'>
                {chunks}
              </Link>
            ),
          },
        ]);

  return (
    <Dialog fullWidth open={!!error} onClose={handleClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color='secondary' size='large' variant='outlined' onClick={handleClose}>
          {translate('Action.Close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export const ErrorDialogProvider = ({ children }: PropsWithChildren) => {
  const [error, setError] = useState<boolean | ErrorDialogProps>(false);
  const providerValue: ErrorDialogState = useMemo(
    () => ({
      error,
      setError,
    }),
    [error],
  );
  return (
    <ErrorDialogContext.Provider value={providerValue}>
      <ErrorDialogActions.Provider value={setError}>{children}</ErrorDialogActions.Provider>
    </ErrorDialogContext.Provider>
  );
};
