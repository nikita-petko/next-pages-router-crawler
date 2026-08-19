import { Fragment, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { ThumbnailTypes } from '@rbx/thumbnails';
import { TextField, Grid, InfoOutlinedIcon, Tooltip, IconButton, Typography } from '@rbx/ui';
import ThumbnailImageUploader from '@modules/miscellaneous/components/uploaders/components/ThumbnailImageUploader';
import useOAuthMetadata from '../OAuthMetadataContext';
import { isNameValid } from '../utils/oAuthFormValidator';
import { isUserAccessedLinkValid } from '../utils/urlValidator';
import useSummaryGeneralInformationPanelStyles from './SummaryGeneralInformationPanel.styles';

interface SummaryGeneralInformationPanelProps {
  name: string;
  description: string;
  imageAssetId: number | null;
  imageUrl?: string;
  tosUri: string;
  privacyPolicyUri: string;
  entryPointUri: string;
  setAppNameHandler: (name: string) => void;
  setAppDescriptionHandler: (description: string) => void;
  setAppImageFileHandler: (imageFile: File | null) => void;
  setAppTosUriHandler: (tosUri: string) => void;
  setAppPrivacyPolicyUriHandler: (privacyPolicyUri: string) => void;
  setAppEntryPointUriHandler: (privacyPolicyUri: string) => void;
  isEditActive?: boolean;
}

const SummaryGeneralInformationPanel = ({
  name,
  description,
  imageAssetId,
  imageUrl,
  tosUri,
  privacyPolicyUri,
  entryPointUri,
  setAppNameHandler,
  setAppDescriptionHandler,
  setAppImageFileHandler,
  setAppTosUriHandler,
  setAppPrivacyPolicyUriHandler,
  setAppEntryPointUriHandler,
  isEditActive,
}: SummaryGeneralInformationPanelProps) => {
  const { translate } = useTranslation();
  const {
    classes: { textfield, thumbnailSection, infoIcon, subLabel },
  } = useSummaryGeneralInformationPanelStyles();
  const OAuthMetadata = useOAuthMetadata();

  const handleFileChange = useCallback(
    (file: File | null) => {
      setAppImageFileHandler(file);
    },
    [setAppImageFileHandler],
  );

  return (
    <Grid container direction='column'>
      <Grid item classes={{ root: subLabel }}>
        <Typography variant='body1' color='secondary' component='p'>
          {translate('Description.GeneralInformationSubheading')}
        </Typography>
      </Grid>
      <Grid item className={thumbnailSection}>
        <ThumbnailImageUploader
          imageUrl={imageUrl}
          imageAltText={translate('Label.ApplicationImage')}
          ariaDescribedBy='thumbnail-aria-description'
          onChange={handleFileChange}
          imageType={['jpg', 'png', 'bmp']}
          targetId={imageAssetId ?? undefined}
          targetType={ThumbnailTypes.assetThumbnail}
          disabled={!isEditActive}
        />
      </Grid>
      <TextField
        className={textfield}
        onChange={(e) => setAppNameHandler(e.target.value)}
        id='appName'
        label={translate('Label.ApplicationName')}
        helperText={
          <>
            {translate('Label.Required')}
            <br key='appNameHelperTextLineBreak' />
            {translate('Description.OAuthAppDescriptionMaxLength', {
              maxLength: OAuthMetadata.metadataResponse.maxNameLength.toString(),
            })}
          </>
        }
        value={name}
        error={!isNameValid(name)}
        inputProps={{ maxLength: OAuthMetadata.metadataResponse.maxNameLength }}
        autoComplete='off'
        disabled={!isEditActive}
      />
      <TextField
        className={textfield}
        onChange={(e) => setAppDescriptionHandler(e.target.value)}
        id='appDescription'
        label={translate('Label.Description')}
        helperText={translate('Description.OAuthAppDescriptionMaxLength', {
          maxLength: OAuthMetadata.metadataResponse.maxSummaryLength.toString(),
        })}
        multiline
        minRows='3'
        maxRows='5'
        value={description}
        inputProps={{ maxLength: OAuthMetadata.metadataResponse.maxSummaryLength }}
        autoComplete='off'
        disabled={!isEditActive}
      />
      <Grid container alignItems='baseline'>
        <TextField
          className={textfield}
          onChange={(e) => setAppEntryPointUriHandler(e.target.value)}
          label={translate('Label.EntryPointUrl')}
          id='entryPointUri'
          value={entryPointUri}
          error={!isUserAccessedLinkValid(entryPointUri)}
          autoComplete='off'
          helperText={translate('Description.UserAccessedLinkFormat')}
          disabled={!isEditActive}
          fullWidth
        />
        <Tooltip arrow placement='right' title={translate('Description.EntryPointUri')}>
          <IconButton
            classes={{ root: infoIcon }}
            aria-label='entry-point-uri'
            color='secondary'
            disabled={!isEditActive}
            size='large'>
            <InfoOutlinedIcon />
          </IconButton>
        </Tooltip>
      </Grid>
      <TextField
        className={textfield}
        onChange={(e) => setAppPrivacyPolicyUriHandler(e.target.value)}
        id='privacyUri'
        label={translate('Label.PrivacyTermsUrl')}
        value={privacyPolicyUri}
        error={!isUserAccessedLinkValid(privacyPolicyUri)}
        helperText={translate('Description.UserAccessedLinkFormat')}
        autoComplete='off'
        disabled={!isEditActive}
      />
      <TextField
        className={textfield}
        onChange={(e) => setAppTosUriHandler(e.target.value)}
        label={translate('Label.TermsOfServiceUrl')}
        id='tosUri'
        value={tosUri}
        error={!isUserAccessedLinkValid(tosUri)}
        autoComplete='off'
        helperText={translate('Description.UserAccessedLinkFormat')}
        disabled={!isEditActive}
      />
    </Grid>
  );
};

export default SummaryGeneralInformationPanel;
