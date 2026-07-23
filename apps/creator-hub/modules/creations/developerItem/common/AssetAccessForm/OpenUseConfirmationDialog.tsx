import React, { Fragment, FunctionComponent } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { Restriction } from '@rbx/clients/marketplacePublishingRequirementsApi';
import { Asset } from '@modules/miscellaneous/common';
import { DeveloperItemDetails } from '../DeveloperItemProvider';
import CompositeAssetDependenciesAlert from '../CompositeAssetDependencies/alert/CompositeAssetDependenciesAlert';
import { DependenciesAlertType } from '../CompositeAssetDependencies/constants/alertTypeConstants';

export type OpenUseConfirmationDialogProps = {
  developerItemDetails: DeveloperItemDetails;
  isLoading: boolean;
  open: boolean;
  openUseRestrictions?: Restriction[];
  onCancel: () => void;
  onConfirm: () => void;
};

const OpenUseConfirmationDialog: FunctionComponent<
  React.PropsWithChildren<OpenUseConfirmationDialogProps>
> = ({ developerItemDetails, isLoading, open, openUseRestrictions, onCancel, onConfirm }) => {
  const assetId = parseInt(developerItemDetails.id, 10);
  const { creator } = developerItemDetails;

  const { translate } = useTranslation();

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

  return (
    <Dialog data-testid='openUseConfirmationDialog' open={open}>
      {isDecalWithOpenUseRestrictions ? (
        <Fragment>
          <DialogTitle>{translate('Heading.AssetAccessChangeWarning')}</DialogTitle>
          <DialogContent>
            <CompositeAssetDependenciesAlert
              alertType={DependenciesAlertType.MakingDecalOpenUse}
              parentAssetId={assetId}
              parentCreator={creator}
            />
          </DialogContent>
          <DialogActions>
            <Button color='secondary' variant='outlined' onClick={onCancel} disabled={isLoading}>
              {translate('Action.Close')}
            </Button>
          </DialogActions>
        </Fragment>
      ) : (
        <Fragment>
          <DialogTitle>{translate('Heading.AssetAccessChangeConfirmation')}</DialogTitle>
          <DialogContent>
            <Typography variant='body1'>
              {translate('Description.AssetAccessChangeConfirmation')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button color='secondary' variant='outlined' onClick={onCancel} disabled={isLoading}>
              {translate('Action.Cancel')}
            </Button>
            <Button variant='contained' onClick={onConfirm} disabled={isLoading}>
              {translate('Action.MakeOpenUse')}
            </Button>
          </DialogActions>
        </Fragment>
      )}
    </Dialog>
  );
};

export default OpenUseConfirmationDialog;
