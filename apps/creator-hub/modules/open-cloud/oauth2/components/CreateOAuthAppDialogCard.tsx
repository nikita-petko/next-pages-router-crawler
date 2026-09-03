import { useState, Fragment } from 'react';
import { resolveUrl } from '@rbx/env-utils';
import type { TDialogProps } from '@rbx/ui';
import {
  TextField,
  Alert,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Link,
  Checkbox,
  Grid,
  InputLabel,
} from '@rbx/ui';
import applicationAuthorizationClient from '@modules/clients/applicationAuthorization';
import { getResponseFromError } from '@modules/clients/utils';
import { getErrorTranslationKey } from '../utils/getTranslationKeysUtil';
import useCreateOAuthAppDialogCardStyles from './CreateOAuthAppDialogCard.styles';
import CreateOAuthFormSuccessDialogCard from './CreateOAuthAppSuccessDialogCard';

interface CreateOAuthAppDialogCardProps {
  onCancel: () => void;
  loadOAuthApps: () => Promise<void>;
  onContinueEdits: (id: string) => void;
  translate: (key: string, args?: { [key: string]: string }) => string;
  translateHTML: (
    key: string,
    tags?:
      | {
          opening: string;
          closing: string;
          content: (chunks: React.ReactNode) => React.ReactNode;
        }[]
      | null,
    args?: {
      [key: string]: React.ReactNode;
    },
  ) => React.ReactNode;
  configure: (
    dialogChildren: TDialogProps['children'],
    dialogProps?: Omit<TDialogProps, 'open' | 'children' | 'ref'>,
  ) => void;
  groupId?: number;
  userId?: number;
  maxNameLength: number;
}

const CreateOAuthAppDialogCard = ({
  onCancel,
  loadOAuthApps,
  translate,
  translateHTML,
  configure,
  onContinueEdits,
  groupId,
  userId,
  maxNameLength,
}: CreateOAuthAppDialogCardProps) => {
  const {
    classes: { alertLabel, termsOfService },
  } = useCreateOAuthAppDialogCardStyles();

  const [{ appName, touched }, setAppNameState] = useState<{ appName: string; touched: boolean }>({
    appName: '',
    touched: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<string>();
  const [acceptTermsConditions, setAcceptTermsConditions] = useState<boolean>(false);

  const onAppCreate = async () => {
    setLoading(true);
    try {
      let response;
      if (groupId !== undefined) {
        response = await applicationAuthorizationClient.createApplicationForGroup({
          groupId: groupId.toString(),
          applicationCreateApplicationForUserRequest: {
            name: appName,
          },
        });
      } else if (userId !== undefined) {
        response = await applicationAuthorizationClient.createApplicationForUser({
          userId: userId.toString(),
          applicationCreateApplicationForUserRequest: {
            name: appName,
          },
        });
      }
      if (response) {
        const id = response?.applicationId;
        configure(
          <CreateOAuthFormSuccessDialogCard
            translate={translate}
            clientId={id}
            clientSecret={response?.applicationSecret}
            onContinueEdits={async () => {
              await onContinueEdits(id);
              onCancel();
            }}
            loadOAuthApps={loadOAuthApps}
            onCancel={onCancel}
          />,
          {
            maxWidth: 'XLarge',
            fullWidth: true,
          },
        );
      }
    } catch (e) {
      const response = getResponseFromError(e);
      if (response) {
        const errorTranslationKey = await getErrorTranslationKey(response);
        setHasError(errorTranslationKey);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DialogTitle>{translate('Heading.CreateOAuthApp')}</DialogTitle>
      <DialogContent dividers>
        <DialogContentText id='dialog-content-text-describe-id'>
          {hasError && (
            <Alert className={alertLabel} severity='error'>
              {translate(hasError)}
            </Alert>
          )}
          <TextField
            fullWidth
            required
            onChange={(e) => setAppNameState({ appName: e.target.value, touched: true })}
            id='appName'
            label={translate('Label.ApplicationName')}
            helperText={translate('Label.AppNameValidationRequirements', {
              maxLength: maxNameLength.toString(),
            })}
            value={appName}
            inputProps={{ maxLength: maxNameLength }}
            autoComplete='off'
            error={touched && appName === ''}
          />

          <Grid container alignItems='center' wrap='nowrap' classes={{ root: termsOfService }}>
            <Grid item>
              <Checkbox
                id='tos-accepted'
                checked={acceptTermsConditions}
                onChange={(e) => setAcceptTermsConditions(e.target.checked)}
              />
            </Grid>

            <Grid item>
              <InputLabel htmlFor='tos-accepted'>
                <Typography>
                  {translateHTML('Message.TermsOfServiceAgreement', [
                    {
                      opening: 'linkStart',
                      closing: 'linkEnd',
                      content(chunks) {
                        return (
                          <Link
                            href={resolveUrl(
                              'creatorThirdPartyTermsOfUseUrl',
                              process.env.targetEnvironment,
                              process.env.buildTarget,
                            )}
                            target='_blank'
                            underline='always'>
                            {chunks}
                          </Link>
                        );
                      },
                    },
                  ])}
                </Typography>
              </InputLabel>
            </Grid>
          </Grid>
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant='outlined'
          aria-label={translate('Label.Cancel')}
          color='primary'
          onClick={onCancel}>
          {translate('Label.Cancel')}
        </Button>
        <Button
          variant='contained'
          aria-label={translate('Label.CreateApp')}
          color='primaryBrand'
          disabled={!touched || !acceptTermsConditions || (touched && appName === '')}
          loading={loading}
          onClick={onAppCreate}>
          {translate('Label.CreateApp')}
        </Button>
      </DialogActions>
    </>
  );
};

export default CreateOAuthAppDialogCard;
