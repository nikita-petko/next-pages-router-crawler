import React, { FunctionComponent } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  Grid,
  RobuxIcon,
  SearchIcon,
  StarIcon,
  useSnackbar,
  Typography,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useRouter } from 'next/router';
import useModalStyles from '../useModalStyles';
import useDropClaimItem from '../../../hooks/useDropClaimItem';

export interface ReleaseFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  accountId: string;
  claimId: string;
  claimItemId: string;
}

// ReleaseForm displays a modal for the rights holder to drop claim
const ReleaseForm: FunctionComponent<ReleaseFormProps> = ({
  open,
  setOpen,
  accountId,
  claimId,
  claimItemId,
}) => {
  const { ready, translate, translateHTML } = useTranslation();
  const {
    classes: { container, buttonContainerEnd, iconContainer },
  } = useModalStyles();
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const router = useRouter();

  const showSnackbar = (success: boolean) => {
    enqueue(
      {
        message: (
          <Typography>
            {success ? translate('Message.ClaimDrop') : translate('Message.ClaimDropFailed')}
          </Typography>
        ),
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: 3000,
        autoHide: true,
        onClose: closeSnackbar,
      },
      (reason) => reason === 'timeout',
    );
  };

  const onSuccess = () => {
    showSnackbar(true);
    router.reload();
  };

  const onError = () => {
    showSnackbar(false);
  };

  const { mutate, isPending } = useDropClaimItem(onSuccess, onError);

  if (!ready) {
    return null;
  }

  const consequences = [
    'Description.ReleaseConsequence1',
    'Description.ReleaseConsequence2',
    'Description.ReleaseConsequence3',
  ];
  const icons = (key: string) => {
    switch (key) {
      case 'Description.ReleaseConsequence1':
        return <RobuxIcon />;
      case 'Description.ReleaseConsequence2':
        return <SearchIcon />;
      case 'Description.ReleaseConsequence3':
        return <StarIcon />;
      default:
        return null;
    }
  };
  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='Medium'>
      <DialogTitle>{translate('Heading.ReleaseClaim')}</DialogTitle>
      <Grid container item XSmall={12} rowSpacing={3} className={container}>
        <Grid item XSmall={12} sx={{ marginTop: '0px' }}>
          <Typography>{translate('Description.ReleaseClaimSub')}</Typography>
        </Grid>
        <Grid container item XSmall={12} rowSpacing={1}>
          {consequences.map((key) => (
            <Grid container item key={key}>
              <Grid item className={iconContainer}>
                {icons(key)}
              </Grid>
              <Typography>
                {translateHTML(key, [
                  {
                    opening: 'boldStart',
                    closing: 'boldEnd',
                    content(chunks) {
                      return <strong>{chunks}</strong>;
                    },
                  },
                ])}
              </Typography>
            </Grid>
          ))}
        </Grid>
        <Grid container item XSmall={12} columnGap={2} className={buttonContainerEnd}>
          <Button onClick={() => setOpen(false)} variant='contained' color='secondary'>
            {translate('Label.Cancel')}
          </Button>
          <Button
            onClick={() => mutate({ accountId, claimId, claimItemId })}
            variant='contained'
            color='primaryBrand'
            disabled={isPending}>
            {translate('Label.ReleaseClaim')}
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default withTranslation(ReleaseForm, [TranslationNamespace.RightsPortal]);
