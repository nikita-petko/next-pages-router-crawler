import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Link,
  Typography,
  OpenInNewIcon,
  WarningIcon,
  Tooltip,
} from '@rbx/ui';
import type { CreatorType } from '@modules/miscellaneous/common';
import { ASSET_ACCESS_PRIVACY } from '@modules/miscellaneous/common/constants/linkConstants';
import { useGetAssetDependencies } from '@modules/react-query/assetPermissions';
import AssetAccessCallToAction from '../../../../../common/AssetAccessForm/AssetAccessCallToAction/AssetAccessCallToAction';
import {
  alertTypeConstants,
  DependenciesAlertType,
} from '../../../../../common/CompositeAssetDependencies/constants/alertTypeConstants';
import CompositeAssetDependenciesTable from '../../../../../common/CompositeAssetDependencies/table/CompositeAssetDependenciesTable';
import useAssetPrivacyEnrollmentInformation from '../../../../hooks/useAssetPrivacyEnrollmentInformation';
import useSellingPaidModelDependenciesModalStyles from './SellingPaidModelDependenciesModal.styles';

export type SellingPaidModelDependenciesModalProps = {
  assetId: number;
  assetName?: string;
  creator: { id: number; type: CreatorType };
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onCopy: () => void;
};

const SellingPaidModelDependenciesModal: FunctionComponent<
  React.PropsWithChildren<SellingPaidModelDependenciesModalProps>
> = ({ assetId, assetName, creator, open, onCancel, onConfirm, onCopy }) => {
  const { translate, translateHTML } = useTranslation();
  const { classes } = useSellingPaidModelDependenciesModalStyles();
  const { dependenciesFilter, dependenciesTableOptionalAttributesToShow } =
    alertTypeConstants[DependenciesAlertType.SellingPaidModel];
  const { eligibleForEnrollLink: userIsNotEnrolledInAssetPrivacyBeta } =
    useAssetPrivacyEnrollmentInformation({ creator });

  const { data: dependencies } = useGetAssetDependencies(
    assetId, // assetId
    dependenciesFilter, // assetDependencyFilter
    true, // includeAccessStatus
    false, // includeCreatorName
    { id: creator.id, type: creator.type }, // parentCreator
    true, // enabled
  );

  const dependencyCount = dependencies?.length ?? 0;
  const displayName = assetName ?? 'Model';

  return (
    <Dialog
      data-testid='sellingPaidModelDependenciesModalV2'
      open={open}
      PaperProps={{ classes: { root: classes.dialogPaper } }}>
      <DialogTitle />
      <DialogContent classes={{ root: classes.dialogContent }}>
        <Grid container gap={2}>
          <Typography
            variant='h3'
            classes={{
              root: classes.header,
            }}>
            {translate('Heading.OpenUseDependenciesCount', {
              displayName,
              dependencyCount: dependencyCount.toString(),
            })}
          </Typography>
          <Typography variant='body1' classes={{ root: classes.subheader }}>
            {/* If userIsNotEnrolledInAssetPrivacyBeta, we will show an opt-in warning below */}
            {!userIsNotEnrolledInAssetPrivacyBeta && <WarningIcon color='warning' />}
            <Typography component='span'>
              {translate('Description.OpenUseAccessExplanation')}
            </Typography>
          </Typography>

          <Grid item XSmall={12}>
            <CompositeAssetDependenciesTable
              dependencies={dependencies ?? []}
              optionalAttributesToShow={dependenciesTableOptionalAttributesToShow}
              parentCreator={{ id: creator.id, type: creator.type }}
            />
          </Grid>

          <Typography variant='body1' component='div'>
            {translateHTML('Description.RestrictAccessEnableAssetPrivacy', [
              {
                opening: 'linkStart',
                closing: 'linkEnd',
                content(chunks) {
                  return (
                    <Link
                      href={ASSET_ACCESS_PRIVACY}
                      target='_blank'
                      className={classes.inlineLink}>
                      <Typography component='span'>{chunks}</Typography>
                      <OpenInNewIcon fontSize='small' />
                    </Link>
                  );
                },
              },
            ])}
          </Typography>
          <Typography variant='body1' component='div'>
            {translateHTML('Description.AfterJoiningAssetPrivacyBeta', [
              {
                opening: 'assetNameStart',
                closing: 'assetNameEnd',
                content: () => {
                  return <strong>{displayName}</strong>;
                },
              },
            ])}
          </Typography>
        </Grid>
        <Grid item marginBottom={0} marginTop={2} paddingBottom={0}>
          <AssetAccessCallToAction creator={creator} severity='warning' />
        </Grid>
      </DialogContent>
      <DialogActions classes={{ root: classes.actions }}>
        <div className={classes.actionsGrid}>
          <div>
            <Button color='secondary' variant='outlined' onClick={onCancel}>
              {translate('Action.Cancel')}
            </Button>
          </div>
          <div className={classes.center}>
            <Button variant='text' onClick={onConfirm}>
              {translate('Action.PublishAnyway')}
            </Button>
          </div>
          <div className={classes.right}>
            <Tooltip
              title={
                userIsNotEnrolledInAssetPrivacyBeta
                  ? translate('Label.CopyToNewModelAssetPrivacyTooltip')
                  : ''
              }>
              <span>
                <Button
                  variant='contained'
                  disabled={userIsNotEnrolledInAssetPrivacyBeta}
                  onClick={onCopy}>
                  {translate('Action.CopyToNewModel')}
                </Button>
              </span>
            </Tooltip>
          </div>
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default SellingPaidModelDependenciesModal;
