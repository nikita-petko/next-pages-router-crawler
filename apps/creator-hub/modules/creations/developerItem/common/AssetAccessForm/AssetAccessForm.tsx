import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Restriction } from '@rbx/client-marketplace-publishing-requirements-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Tooltip,
  Typography,
} from '@rbx/ui';
import { ASSET_ACCESS_PRIVACY } from '@modules/miscellaneous/common/constants/linkConstants';
import Asset from '@modules/miscellaneous/common/enums/Asset';
import { useSnackbarAlert } from '@modules/miscellaneous/hooks';
import {
  AssetPrivacyLevel,
  useGetAssetIsOpenUse,
  useSetAssetOpenUse,
  USER_UPDATABLE_ACCESS_STATUS_ASSET_TYPES,
  NON_AAC_ASSET_TYPES,
} from '@modules/react-query/assetPermissions';
import OverviewInlineUrlTranslationLabel from '../../../common/components/OverviewInlineUrlTranslationLabel';
import type { DeveloperItemDetails } from '../types';
import AssetAccessCallToAction from './AssetAccessCallToAction/AssetAccessCallToAction';
import useAssetAccessFormStyles from './AssetAccessForm.styles';
import OpenUseConfirmationDialog from './OpenUseConfirmationDialog';

export type AssetAccessFormProps = {
  developerItemDetails: DeveloperItemDetails;
  isCreatorEligibleForAssetAccessBeta: boolean;
  openUseRestrictions?: Restriction[];
  onSetAssetOpenUse?: () => void;
};

const AssetAccessForm: FunctionComponent<React.PropsWithChildren<AssetAccessFormProps>> = ({
  developerItemDetails,
  isCreatorEligibleForAssetAccessBeta,
  openUseRestrictions,
  onSetAssetOpenUse,
}) => {
  const assetId = parseInt(developerItemDetails.id, 10);
  const { creator } = developerItemDetails;
  const assetTypeIsAlwaysRestricted = NON_AAC_ASSET_TYPES.includes(developerItemDetails.type);
  const assetTypeCanBeMadeOpenUseByUser = USER_UPDATABLE_ACCESS_STATUS_ASSET_TYPES.includes(
    developerItemDetails.type,
  );

  const {
    classes: { containerDescription, containerTitle, dependencyDisclaimer, formContainer },
  } = useAssetAccessFormStyles();
  const { data: assetIsOpenUse } = useGetAssetIsOpenUse(
    assetId,
    isCreatorEligibleForAssetAccessBeta,
    true,
    developerItemDetails.type,
  );
  const { mutateAsync: setAssetOpenUse, isPending: setAssetOpenUseLoading } =
    useSetAssetOpenUse(assetId);
  const { translate } = useTranslation();
  const showSnackbarMessage = useSnackbarAlert();

  const [isConfirmationDialogOpen, setIsConfirmationDialogOpen] = useState(false);

  /*
   * Decals are unique from an Asset Access Control standpoint.
   * 1. They are the only composite asset that can be made open use.
   * 2. Upon creation by an opted-in user, they will always contain a restricted
   *    dependency. That dependency will always be the underlying image and will
   *    always be owned by the creator of the Decal. In other words, the Decal
   *    is simply a wrapper around the Image.
   *
   * Long term, the backend should handle this so the creator can make the Decal
   * open use and the image will be made open use automatically. In the
   * meantime, we need to handle this in the UI by prompting the user to make
   * their Image open use first.
   *
   * IMPORTANT: As the composite asset check takes a few seconds to complete,
   * and does not have an SLA, we cannot automatically make both open use calls
   * back to back in the frontend. We need this process to take a few seconds at
   * least, which is why we leave it to the user to make each asset open use.
   */
  const isDecalWithOpenUseRestrictions =
    developerItemDetails.type === Asset.Decal &&
    openUseRestrictions?.includes(Restriction.CompositeAssetSubcomponentsRestricted);
  const hasPricedAssetRestriction = openUseRestrictions?.includes(Restriction.PricedAsset);

  /*
   * Here, we make a distinction between a temporary restriction that may change
   * in the future (e.g. priced asset) and a permanent restriction that can never change.
   *
   * When an asset is permanently Restricted or Open Use, we display just that value.
   * When an asset is only temporarily restricted, we display both options, but in a disabled state.
   */
  const openUseTemporarilyDisabled =
    hasPricedAssetRestriction ||
    (!isDecalWithOpenUseRestrictions && openUseRestrictions && openUseRestrictions.length > 0); // Catch-all for all other open use restrictions

  useEffect(() => {
    // Run on initial load and when assetIsOpenUse changes
    if (assetIsOpenUse && onSetAssetOpenUse !== undefined) {
      onSetAssetOpenUse();
    }
  }, [assetIsOpenUse, onSetAssetOpenUse]);

  const onSelectOpenUse = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.value === (AssetPrivacyLevel.OpenUse as string)) {
      setIsConfirmationDialogOpen(true);
    }
  }, []);

  const onCancelOpenUse = useCallback(() => {
    setIsConfirmationDialogOpen(false);
  }, []);

  const onConfirmOpenUse = useCallback(async () => {
    const wasSuccessful = await setAssetOpenUse();
    if (wasSuccessful) {
      showSnackbarMessage(
        'success',
        translate('Message.OpenUseSaveSuccessful', { assetName: developerItemDetails.name }),
      );
    } else {
      showSnackbarMessage(
        'error',
        translate('Message.OpenUseSaveUnsuccessful', { assetName: developerItemDetails.name }),
      );
    }
    setIsConfirmationDialogOpen(false);
  }, [developerItemDetails.name, setAssetOpenUse, showSnackbarMessage, translate]);

  const permanentAccessLevelLabel = useMemo(() => {
    if (
      assetTypeIsAlwaysRestricted ||
      (!assetIsOpenUse && !assetTypeCanBeMadeOpenUseByUser) // Here, we want to show a permanent Restricted label as the user cannot make the asset Open Use
    ) {
      return (
        <Grid container direction='column'>
          <Typography color='primary' variant='body1'>
            {translate('Label.Restricted')}
          </Typography>
          <Typography color='secondary' variant='caption'>
            {translate('Description.AssetAccessRestricted')}
          </Typography>
          {/* For Models and MeshParts, we show an additional disclaimer about their dependencies. */}
          {(developerItemDetails.type === Asset.Model ||
            developerItemDetails.type === Asset.MeshPart) && (
            <Typography
              color='secondary'
              variant='caption'
              classes={{ root: dependencyDisclaimer }}>
              {translate('Label.AssetPrivacyDependencyDisclaimer')}
            </Typography>
          )}
        </Grid>
      );
    }

    // An Open Use asset can never be made Restricted.
    if (assetIsOpenUse) {
      return (
        <Grid container direction='column'>
          <Typography color='secondary' variant='body1'>
            {translate('Label.OpenUse')}
          </Typography>
          <Typography color='secondary' variant='caption'>
            {translate('Description.AssetAccessOpenUse')}
          </Typography>
        </Grid>
      );
    }

    return null;
  }, [
    assetTypeIsAlwaysRestricted,
    assetIsOpenUse,
    assetTypeCanBeMadeOpenUseByUser,
    translate,
    developerItemDetails.type,
    dependencyDisclaimer,
  ]);

  return (
    <Grid
      data-testid='asset-access-form'
      container
      item
      XSmall={12}
      classes={{ root: formContainer }}>
      <Grid container item XSmall={12}>
        <Typography component='h4' variant='h4' classes={{ root: containerTitle }}>
          {translate('Heading.AssetPrivacy')}
        </Typography>
      </Grid>
      {/* This is being flagged separately to allow us to display the asset access form to creators who are not yet eligible for beta */}
      {isCreatorEligibleForAssetAccessBeta && (
        <div className={containerDescription}>
          <OverviewInlineUrlTranslationLabel
            anchorTargetUrl={ASSET_ACCESS_PRIVACY}
            closing='reqLinkEnd'
            linkVariantOverride='body1'
            typographyColorOverride='secondary'
            opening='reqLinkStart'
            translationKey='Description.AssetPrivacy'
          />
        </div>
      )}
      <AssetAccessCallToAction creator={creator} />
      {permanentAccessLevelLabel ?? (
        <FormControl disabled={openUseTemporarilyDisabled}>
          <RadioGroup
            name='asset-access-radio-buttons-group'
            value={assetIsOpenUse ? AssetPrivacyLevel.OpenUse : AssetPrivacyLevel.Restricted}
            onChange={onSelectOpenUse}>
            <Tooltip
              title={assetIsOpenUse ? translate('Message.OpenUseRestrictedRestriction') : ''}>
              <FormControlLabel
                value={AssetPrivacyLevel.Restricted}
                control={<Radio aria-label={AssetPrivacyLevel.Restricted} />}
                label={translate('Label.Restricted')}
              />
            </Tooltip>
            <Typography color='secondary' variant='caption'>
              {translate('Description.AssetAccessRestricted')}
            </Typography>
            <Tooltip
              title={
                hasPricedAssetRestriction ? translate('Message.PricedOpenUseRestriction') : ''
              }>
              <FormControlLabel
                value={AssetPrivacyLevel.OpenUse}
                control={<Radio aria-label={AssetPrivacyLevel.OpenUse} />}
                label={translate('Label.OpenUse')}
              />
            </Tooltip>
            <Typography color='secondary' variant='caption'>
              {translate('Description.AssetAccessOpenUse')}
            </Typography>
          </RadioGroup>
        </FormControl>
      )}
      <OpenUseConfirmationDialog
        developerItemDetails={developerItemDetails}
        isLoading={setAssetOpenUseLoading}
        open={isConfirmationDialogOpen}
        openUseRestrictions={openUseRestrictions}
        onCancel={onCancelOpenUse}
        onConfirm={onConfirmOpenUse}
      />
    </Grid>
  );
};

export default AssetAccessForm;
