import { useRouter } from 'next/router';
import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
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
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useAcceptClaimItem from '../../../hooks/useAcceptClaimItem';
import useModalStyles from '../useModalStyles';

export interface AcceptFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  accountId: string;
  claimId: string;
  claimItemId: string;
}

// AcceptForm displays a modal for the alleged infringer to accept a pending claim against them
const AcceptForm: FunctionComponent<AcceptFormProps> = ({
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
            {success ? translate('Message.ClaimAccept') : translate('Message.ClaimAcceptFailed')}
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

  const { mutate, isPending } = useAcceptClaimItem();
  if (!ready) {
    return null;
  }

  const consequences = [
    'Description.AcceptConsequence1',
    'Description.AcceptConsequence2',
    'Description.AcceptConsequence3',
    'Description.AcceptConsequence4',
  ];

  const icons = [
    <RobuxIcon key='icon1' />,
    <SearchIcon key='icon2' />,
    <StarIcon key='icon3' />,
    <StarIcon key='icon4' />,
  ];

  return (
    <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth='Medium'>
      <DialogTitle>{translate('Heading.AcceptThisClaim')}</DialogTitle>
      <Grid container item XSmall={12} rowSpacing={3} className={container}>
        <Grid item XSmall={12}>
          <Typography>{translate('Description.AcceptClaimSub')}</Typography>
        </Grid>
        <Grid container item XSmall={12} rowSpacing={1}>
          {consequences.map((key, index) => (
            <Grid container item key={key}>
              <Grid item className={iconContainer}>
                {icons[index]}
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
            onClick={() =>
              mutate(
                { accountId, claimId, claimItemId },
                {
                  onSuccess,
                  onError,
                },
              )
            }
            variant='contained'
            color='destructive'
            disabled={isPending}>
            {translate('Label.AcceptClaim')}
          </Button>
        </Grid>
      </Grid>
    </Dialog>
  );
};

export default withTranslation(AcceptForm, [TranslationNamespace.RightsPortal]);
