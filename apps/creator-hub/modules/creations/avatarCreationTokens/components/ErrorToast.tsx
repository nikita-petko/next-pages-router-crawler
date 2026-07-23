import { useTranslation } from '@rbx/intl';
import { Button, Dialog, DialogActions, DialogContent, Typography } from '@rbx/ui';
import React, { FC } from 'react';

export type TErrorToastProps = {
  TitleKey: string;
  ErrorMessagePrefixKey?: string | undefined;
  ErrorMessageKey: string;
  onClose: () => void;
};

const ErrorToast: FC<React.PropsWithChildren<TErrorToastProps>> = ({
  TitleKey,
  ErrorMessagePrefixKey,
  ErrorMessageKey,
  onClose,
}) => {
  const { translate } = useTranslation();

  return (
    <Dialog open>
      <DialogContent>
        <Typography variant='h4'>{translate(TitleKey)}</Typography>
        <br />
        <br />
        <Typography variant='body2'>
          {ErrorMessagePrefixKey ? `${translate(ErrorMessagePrefixKey)} ` : ''}
          {translate(ErrorMessageKey)}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          data-testid='cancel-button'
          variant='contained'
          aria-label={translate('Action.Ok')}
          color='primaryBrand'
          onClick={onClose}>
          {translate('Action.Ok')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ErrorToast;
