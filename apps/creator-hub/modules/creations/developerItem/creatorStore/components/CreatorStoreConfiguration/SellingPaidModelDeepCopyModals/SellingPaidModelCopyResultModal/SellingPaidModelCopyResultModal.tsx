import type { FunctionComponent } from 'react';
import React from 'react';
import { ErrorCode, OperationStatus } from '@rbx/client-creator-asset-tooling-api/v1';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Typography,
  Link,
  CheckCircleOutlineIcon,
  ErrorOutlineOutlinedIcon,
} from '@rbx/ui';
import useSellingPaidModelCopyResultModalStyles from './SellingPaidModelCopyResultModal.styles';

export type SellingPaidModelCopyResultModalProps = {
  open: boolean;
  result: OperationStatus | null;
  assetUrl?: string;
  errorDetails?: ErrorCode[] | null;
  onClose: () => void;
};

/**
 * Determines the appropriate translation keys based on operation status and error details.
 * Allows for error-specific messaging for partially succeeded operations.
 */
function getTranslationKeys(
  result: OperationStatus | null,
  errorDetails: ErrorCode[] | null | undefined,
): { headingTranslationKey: string; descriptionTranslationKey: string } {
  switch (result) {
    case OperationStatus.Succeeded:
      return {
        headingTranslationKey: 'Heading.Success',
        descriptionTranslationKey: 'Description.DeepCopySuccess',
      };

    case OperationStatus.PartiallySucceeded:
      // Check for specific error codes to provide more targeted messaging
      if (errorDetails?.includes(ErrorCode.MaterialVariantPresent)) {
        return {
          headingTranslationKey: 'Heading.CopyCreatedWithErrors',
          descriptionTranslationKey: 'Description.CopyCreatedWithMaterialVariantErrors',
        };
      }
      // Add more error-specific cases here as needed
      // if (errorDetails?.includes(ErrorCode.SomeOtherError)) {
      //   return {
      //     headingTranslationKey: 'Heading.CopyCreatedWithErrors',
      //     descriptionTranslationKey: 'Description.CopyCreatedWithSomeOtherError',
      //   };
      // }
      return {
        headingTranslationKey: 'Heading.CopyCreatedWithErrors',
        descriptionTranslationKey: 'Description.CopyCreatedWithErrors',
      };

    case OperationStatus.Failed:
    default:
      return {
        headingTranslationKey: 'Heading.CopyFailed',
        descriptionTranslationKey: 'Description.DeepCopyFailed',
      };
  }
}

const SellingPaidModelCopyResultModal: FunctionComponent<
  React.PropsWithChildren<SellingPaidModelCopyResultModalProps>
> = ({ open, result, assetUrl, errorDetails, onClose }) => {
  const { translate } = useTranslation();
  const { classes } = useSellingPaidModelCopyResultModalStyles();
  const { headingTranslationKey, descriptionTranslationKey } = getTranslationKeys(
    result,
    errorDetails,
  );

  return (
    <Dialog open={open} PaperProps={{ classes: { root: classes.dialogPaper } }}>
      <DialogTitle>
        <div className={classes.titleRow}>
          <Typography component='span' variant='h5'>
            {translate(headingTranslationKey)}
          </Typography>
          {result === OperationStatus.Succeeded ? (
            <CheckCircleOutlineIcon color='success' />
          ) : (
            <ErrorOutlineOutlinedIcon color='error' />
          )}
        </div>
      </DialogTitle>
      <DialogContent classes={{ root: classes.content }}>
        <Grid container>
          <Typography variant='body1'>{translate(descriptionTranslationKey)}</Typography>
        </Grid>
      </DialogContent>
      <DialogActions classes={{ root: classes.actions }}>
        <Button color='secondary' variant='outlined' onClick={onClose}>
          {translate('Action.Close')}
        </Button>
        {result !== OperationStatus.Failed && assetUrl && (
          <Button component={Link} href={assetUrl} target='_blank' variant='contained'>
            {translate('Action.Configure')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default SellingPaidModelCopyResultModal;
