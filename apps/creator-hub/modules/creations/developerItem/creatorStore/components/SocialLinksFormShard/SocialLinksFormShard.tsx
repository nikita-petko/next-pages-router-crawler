import React, { FunctionComponent, useCallback, useEffect, useMemo } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button, DeleteOutlinedIcon, Grid, IconButton, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Asset as AssetType } from '@modules/miscellaneous/common';
import useSocialLinksFormShardStyles from './SocialLinksFormShard.styles';
import {
  MAX_SOCIAL_LINKS,
  SocialLinkType,
  SocialLinkTypeToTranslatedText,
  SocialLinkWithType,
} from '../../hooks/useSocialLinks';
import { CreatorStoreConfigurationType } from '../CreatorStoreConfiguration/CreatorStoreConfiguration';
import SocialLinkFormItem from './SocialLinkFormItem/SocialLinkFormItem';
import TryAssetForm from './TryAssetForm/TryAssetForm';

const newRecord: SocialLinkWithType = {
  type: SocialLinkType.ROBLOX,
  uri: '',
  title: '',
};

export interface SocialLinkFormShardProps {
  assetId: number;
  assetType: AssetType;
  socialLinkTypeToTranslatedText: SocialLinkTypeToTranslatedText;
  tryAssetExistingPlaceIsPlayable: boolean | null;
}

const SocialLinksFormShard: FunctionComponent<SocialLinkFormShardProps> = ({
  assetId,
  assetType,
  socialLinkTypeToTranslatedText,
  tryAssetExistingPlaceIsPlayable,
}) => {
  const { translate } = useTranslation();
  const {
    classes: { header, removeButton, subheader },
  } = useSocialLinksFormShardStyles();

  const {
    control,
    formState: { dirtyFields, isSubmitting },
    trigger,
  } = useFormContext<CreatorStoreConfigurationType>();

  const {
    fields: socialLinksFields,
    append,
    remove,
  } = useFieldArray({
    control,
    shouldUnregister: true,
    name: 'socialLinks',
  });

  // Used to trigger link-type duplication validation across all non-try-asset social links
  const socialLinkMap = useMemo(
    () =>
      socialLinksFields.map(
        (_, index) => `socialLinks.${index}.type` as `socialLinks.${number}.type`,
      ),
    [socialLinksFields],
  );
  const triggerLinkTypeValidation = useCallback(async () => {
    await trigger(socialLinkMap);
  }, [socialLinkMap, trigger]);

  const handleAddSocialLink = useCallback(() => {
    append({ ...newRecord });
  }, [append]);

  const handleRemoveSocialLink = useCallback(
    (index: number) => {
      remove(index);
    },
    [remove],
  );

  useEffect(() => {
    triggerLinkTypeValidation();
  }, [dirtyFields.socialLinks, triggerLinkTypeValidation]);

  return (
    <React.Fragment>
      <Grid container data-testid='social-links-container'>
        <Grid item classes={{ root: header }} XSmall={12}>
          <Grid item>
            <Typography component='h3' variant='h3'>
              {translate('Heading.SocialLinks')}
            </Typography>
          </Grid>
          <Grid item classes={{ root: subheader }}>
            <Typography variant='body2' color='secondary'>
              {translate('Description.SocialLinksLimit', { limit: MAX_SOCIAL_LINKS.toString() })}
            </Typography>
          </Grid>
        </Grid>
        {socialLinksFields.map((socialLinkField, index) => (
          <Grid container direction='column' key={socialLinkField.id} XSmall={12}>
            <SocialLinkFormItem
              index={index}
              key={socialLinkField.id}
              triggerLinkTypeValidation={triggerLinkTypeValidation}
              socialLinkTypeToTranslatedText={socialLinkTypeToTranslatedText}
            />
            <IconButton
              aria-label='remove social link'
              color='secondary'
              data-testid='remove-social-link'
              size='large'
              onClick={() => handleRemoveSocialLink(index)}
              classes={{ root: removeButton }}>
              <DeleteOutlinedIcon />
            </IconButton>
          </Grid>
        ))}
        {socialLinksFields.length < MAX_SOCIAL_LINKS && (
          <Button
            color='primary'
            data-testid='add-social-link'
            variant='contained'
            disabled={isSubmitting}
            onClick={() => handleAddSocialLink()}>
            {translate('Label.AddSocialLink')}
          </Button>
        )}
      </Grid>
      <TryAssetForm
        assetId={assetId}
        assetType={assetType}
        tryAssetExistingPlaceIsPlayable={tryAssetExistingPlaceIsPlayable}
      />
    </React.Fragment>
  );
};

export default SocialLinksFormShard;
