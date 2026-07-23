import React, { FunctionComponent, useState, Fragment } from 'react';
import {
  Alert,
  Typography,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from '@rbx/ui';
import { ApiError, formatError } from './EditSecret';
import { translateDeleteStatusCode } from '../constants/SecretsConstants';

export interface DeleteSecretDialogProps {
  id: string;
  translate: (key: string, args?: { [key: string]: string }) => string;
  deleteSecret: () => Promise<ApiError | null>;
  close: () => void;
}

const DeleteSecretDialog: FunctionComponent<React.PropsWithChildren<DeleteSecretDialogProps>> = ({
  id,
  translate,
  deleteSecret,
  close,
}) => {
  const [hasError, setHasError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  return (
    <Fragment>
      <DialogTitle>{translate('Heading.DeleteSecret')}</DialogTitle>
      <DialogContent dividers>
        {hasError && (
          <Tooltip title={formatError(hasError, translate)}>
            <Alert severity='error'>
              {translate('Description.SecretDeleteError')}
              {hasError.code &&
                translateDeleteStatusCode[hasError.code] &&
                `: ${translate(translateDeleteStatusCode[hasError.code])}`}
            </Alert>
          </Tooltip>
        )}
        <Typography component='p'>
          {translate('Description.DeleteSecretDialogWarning', { id })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button
          variant='outlined'
          aria-label={translate('Action.Cancel')}
          color='primary'
          onClick={close}>
          {translate('Action.Cancel')}
        </Button>
        <Button
          variant='contained'
          aria-label={translate('Label.ConfirmDelete')}
          color='destructive'
          loading={isLoading}
          onClick={async () => {
            setIsLoading(true);
            setHasError(null);
            const deleteRes = await deleteSecret();
            if (deleteRes) {
              setHasError(deleteRes);
              setIsLoading(false);
            } else close();
          }}>
          {translate('Label.ConfirmDelete')}
        </Button>
      </DialogActions>
    </Fragment>
  );
};

export default DeleteSecretDialog;
