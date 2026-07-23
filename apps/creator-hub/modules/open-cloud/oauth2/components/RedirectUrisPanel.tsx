import { Fragment } from 'react';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { useTranslation } from '@rbx/intl';
import { Typography, TextField, Button, Grid, Link, IconButton, DeleteIcon } from '@rbx/ui';
import useOAuthMetadata from '../OAuthMetadataContext';
import { isRedirectUriValid } from '../utils/urlValidator';
import useRedirectUrisPanelStyles from './RedirectUrisPanel.styles';

interface RedirectUrisPanelProps {
  redirectUris: string[];
  setRedirectUrisHandler: (redirectUris: string[]) => void;
  isEditActive?: boolean;
}

const RedirectUrisPanel = ({
  redirectUris,
  setRedirectUrisHandler,
  isEditActive,
}: RedirectUrisPanelProps) => {
  const {
    classes: { body, textfield, addUriButton, deleteIcon },
  } = useRedirectUrisPanelStyles();
  const { translate, translateHTML } = useTranslation();
  const OAuthMetadata = useOAuthMetadata();
  function canAddUri() {
    return (
      redirectUris[redirectUris.length - 1] !== '' &&
      redirectUris.length < OAuthMetadata.metadataResponse.maxRedirectUriCount
    );
  }

  function addUri() {
    if (canAddUri()) {
      setRedirectUrisHandler(redirectUris.concat(['']));
    }
  }

  function deleteUri(ind: number) {
    redirectUris.splice(ind, 1);
    setRedirectUrisHandler(redirectUris);
  }

  function onChangeExecuted(uri: string, ind: number) {
    const tmpUris = redirectUris;
    tmpUris[ind] = uri;
    setRedirectUrisHandler(tmpUris);
  }

  function textFieldAndButton(index: number) {
    const key = index;
    return (
      <Fragment key={key}>
        <Grid container alignItems='center'>
          <Grid item>
            <TextField
              className={textfield}
              id='uriInputBox'
              label={translate('Label.RedirectUri')}
              value={redirectUris[index]}
              onChange={(e) => {
                onChangeExecuted(e.target.value, index);
              }}
              helperText={
                <>
                  {translate('Description.OAuthAppRedirectUriMaxLength', {
                    maxLength: OAuthMetadata.metadataResponse.maxRedirectUriLength.toString(),
                  })}
                  <br />
                  {translate('Description.UrlFormat')}
                </>
              }
              inputProps={{ maxLength: OAuthMetadata.metadataResponse.maxRedirectUriLength }}
              error={!isRedirectUriValid(redirectUris[index])}
              disabled={!isEditActive}
            />
          </Grid>
          <Grid item>
            <IconButton
              aria-label='delete'
              color='secondary'
              size='medium'
              className={deleteIcon}
              disabled={!isEditActive}>
              <DeleteIcon onClick={() => deleteUri(index)} />
            </IconButton>
          </Grid>
        </Grid>
      </Fragment>
    );
  }

  return (
    <Grid container direction='column'>
      <Grid container className={body}>
        <Typography>
          {translateHTML('Description.RedirectUrlsSection', [
            {
              opening: 'linkStart',
              closing: 'linkEnd',
              content(chunks) {
                return (
                  <Link
                    href={`${getProductionCreatorHubUrl(process.env.buildTarget)}/docs/cloud/auth/oauth2-registration#add-redirect-urls`}
                    target='_blank'
                    underline='always'>
                    {chunks}
                  </Link>
                );
              },
            },
          ])}
        </Typography>
      </Grid>
      {redirectUris.map((uri, index) => textFieldAndButton(index))}
      <Grid item>
        <Button
          className={addUriButton}
          variant='outlined'
          color='primary'
          size='small'
          disabled={!isEditActive || !canAddUri()}
          onClick={addUri}>
          {translate('Label.AddAnotherUri')}
        </Button>
      </Grid>
    </Grid>
  );
};

export default RedirectUrisPanel;
