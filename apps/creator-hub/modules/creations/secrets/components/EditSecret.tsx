import type { FunctionComponent } from 'react';
import React, { useState, Fragment } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import {
  Alert,
  AlertTitle,
  TextField,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Button,
  Grid,
  Typography,
  Link,
} from '@rbx/ui';
import type {
  TUseTranslationTranslateFunction,
  TUseTranslationTranslateHTMLFunction,
} from '@modules/analytics-translations/types';
import {
  MAX_ID_LENGTH,
  MAX_SECRET_LENGTH,
  MAX_DOMAIN_LENGTH,
  translateEditStatusCode,
} from '../constants/SecretsConstants';
import useEditSecretStyles from './EditSecret.styles';

export type ApiError = {
  template: string;
  args?: Record<string, string>;
  code?: number;
  // 'detail' may not be translated (coming from system libraries)
  detail?: string;
  field?: string;
};

export function formatError(
  err: ApiError,
  translate: (key: string, args?: { [key: string]: string }) => string,
) {
  return (
    <div>
      <div>{translate(err.template, err.args)}</div>
      <div>{err.detail ?? ` ${err.detail}`}</div>
    </div>
  );
}

const linkContent = (href: string) => ({
  opening: 'linkStart',
  closing: 'linkEnd',
  content(chunks: React.ReactNode) {
    return (
      <Link target='_blank' href={href}>
        {chunks}
      </Link>
    );
  },
});

export interface EditSecretDialogProps {
  id?: string; // when is is undefined, it's a "Create" dialog
  domain?: string; // undefined means '*' - the original default
  translate: TUseTranslationTranslateFunction;
  translateHTML: TUseTranslationTranslateHTMLFunction;
  confirmSecret: (id: string, secret: string, domain: string) => Promise<ApiError | null>;
  close: () => void;
}

function getErrorMessage(error: ApiError, translate: TUseTranslationTranslateFunction) {
  if (!error || !error.code) {
    return null;
  }
  if (error.code === 400) {
    switch (error.field) {
      case 'id':
        return translate('Label.SecretIdRequirements');
      case 'secret':
        return translate('Label.SecretContentRequirements');
      case 'domain':
        return translate('Label.DomainRequirements');
      default:
        return translate('Description.UnexpectedError');
    }
  } else {
    const translated = translateEditStatusCode[error.code];
    if (translated) {
      return translate(translated);
    }
  }
  return translate('Description.UnexpectedError');
}

function getAlertMessage(error: ApiError, translate: TUseTranslationTranslateFunction) {
  const msg = getErrorMessage(error, translate);
  if (msg) {
    return <Typography>{msg}</Typography>;
  }
  return null;
}

const EditSecretDialog: FunctionComponent<React.PropsWithChildren<EditSecretDialogProps>> = ({
  id,
  domain,
  translate,
  translateHTML,
  confirmSecret,
  close,
}) => {
  const [newId, setId] = useState<string>(id ?? '');
  const [newSecret, setSecret] = useState<string>('');
  const [newDomain, setDomain] = useState<string>(domain ?? '*');
  const [hasError, setHasError] = useState<ApiError>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isEdit = id !== undefined;

  const {
    classes: { inputFormPadding, errorPadding },
  } = useEditSecretStyles();

  const isValidId = (): boolean => {
    if (newId !== '') {
      const regex = /^[a-zA-Z][\w]{0,63}$/g;
      return regex.test(newId);
    }
    return true;
  };

  const isValidDomain = (): boolean => {
    // Validation RegEx is client-side copy of the server-side regex taken from the backend
    // here: https://github.rbx.com/Roblox/secrets-store/blob/master/services/secrets-store-service/src/Controllers/V1/SecretsStoreController.cs#L69
    const regex =
      /^((\*)|((\*\.)?([a-zA-Z0-9-]+\.){0,5}[a-zA-Z0-9-][a-zA-Z0-9-]+\.[a-zA-Z]{2,63}?))$/g;
    return regex.test(newDomain);
  };

  const isValid = (): boolean => {
    return newSecret !== '' && isValidId() && isValidDomain();
  };

  return (
    <>
      <DialogTitle>{translate(isEdit ? 'Heading.EditSecret' : 'Heading.CreateSecret')}</DialogTitle>
      <DialogContent dividers>
        <Grid container className={inputFormPadding}>
          {hasError && (
            <Grid item className={errorPadding}>
              <Tooltip
                title={
                  translate(hasError.template, hasError.args) +
                  (hasError.detail ?? ` ${hasError.detail}`)
                }>
                <Alert severity='error'>
                  <AlertTitle>
                    {translate(
                      isEdit ? 'Description.SecretUpdateError' : 'Description.SecretCreateError',
                    )}
                  </AlertTitle>
                  {getAlertMessage(hasError, translate)}
                </Alert>
              </Tooltip>
            </Grid>
          )}
          <Grid item>
            <TextField
              fullWidth
              required
              onChange={(e) => setId(e.target.value)}
              id='secretId'
              label={translate('Label.Id')}
              helperText={translate('Label.SecretIdRequirements')}
              value={newId}
              inputProps={{ maxLength: MAX_ID_LENGTH }}
              autoComplete='off'
              error={!isValidId()}
              disabled={isEdit}
              autoFocus={!isEdit}
            />
          </Grid>
          <Grid item>
            <TextField
              fullWidth
              required
              onChange={(e) => setSecret(e.target.value)}
              id='secretContent'
              label={translate('Label.SecretContent')}
              helperText={translateHTML(
                'Label.SecretContentRequirementsWithLink',
                [
                  linkContent(
                    `${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud/guides/secrets-store`,
                  ),
                ],
                { maxLength: MAX_SECRET_LENGTH.toString() },
              )}
              value={newSecret}
              inputProps={{ maxLength: MAX_SECRET_LENGTH }}
              autoComplete='off'
              autoFocus={isEdit}
              type='password'
            />
          </Grid>
          <Grid item>
            <TextField
              fullWidth
              required
              onChange={(e) => setDomain(e.target.value)}
              id='secretDomain'
              label={translate('Label.Domain')}
              helperText={translate('Label.DomainRequirements', {
                maxLength: MAX_DOMAIN_LENGTH.toString(),
              })}
              value={newDomain}
              inputProps={{ maxLength: MAX_DOMAIN_LENGTH }}
              autoComplete='off'
              error={!isValidDomain()}
            />
          </Grid>
        </Grid>
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
          aria-label={translate(id ? 'Action.Edit' : 'Action.Create')}
          color='primaryBrand'
          disabled={newId === '' || !isValid()}
          loading={isLoading}
          onClick={async () => {
            setIsLoading(true);
            const ret = await confirmSecret(newId, newSecret, newDomain);
            if (ret) {
              setHasError(ret);
              setIsLoading(false);
            } else close();
          }}>
          {translate(isEdit ? 'Action.Edit' : 'Action.Create')}
        </Button>
      </DialogActions>
    </>
  );
};

export default EditSecretDialog;
