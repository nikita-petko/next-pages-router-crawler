import type { FunctionComponent } from 'react';
import type { ClaimItem } from '@rbx/client-rights/v1';
import { ClaimItemStatusEnum } from '@rbx/client-rights/v1';
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
import useAcceptClaimItem from '../../hooks/useAcceptClaimItem';
import useModalStyles from '../claimItem/useModalStyles';

export interface AcceptAllFormProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  claimItems: ClaimItem[];
  invalidateClaimitems: () => void;
}

// AcceptForm displays a modal for the alleged infringer to accept all pending claims against them
const AcceptAllForm: FunctionComponent<AcceptAllFormProps> = ({
  open,
  setOpen,
  claimItems,
  invalidateClaimitems,
}) => {
  const { ready, translate, translateHTML } = useTranslation();
  const {
    classes: { container, buttonContainerEnd, iconContainer },
  } = useModalStyles();
  const { enqueue, close: closeSnackbar } = useSnackbar();

  const showSnackbar = (success: boolean) => {
    enqueue(
      {
        message: (
          <Typography>
            {success
              ? translate('Message.ClaimAcceptAll')
              : translate('Message.ClaimAcceptAllFailed')}
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

  const { mutateAsync, isPending } = useAcceptClaimItem();
  if (!ready) {
    return null;
  }

  const handleSubmit = () => {
    const mutations: Promise<void>[] = [];
    claimItems.forEach((claimItem) => {
      if (claimItem.status === ClaimItemStatusEnum.Pending) {
        mutations.push(
          mutateAsync({
            accountId: claimItem.targetAccountId ?? '',
            claimId: claimItem.claimId ?? '',
            claimItemId: claimItem.id ?? '',
          }),
        );
      }
    });
    Promise.all(mutations)
      .then(() => {
        showSnackbar(true);
      })
      .catch(() => {
        showSnackbar(false);
      })
      .finally(() => {
        invalidateClaimitems();
        setOpen(false);
      });
  };

  const consequences = [
    'Description.AcceptConsequence1',
    'Description.AcceptConsequence2',
    'Description.AcceptConsequence3',
    'Description.AcceptConsequence4',
  ];
  const icons = [
    <RobuxIcon key='icon2' />,
    <SearchIcon key='icon3' />,
    <StarIcon key='icon4' />,
    <StarIcon key='icon5' />,
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
            onClick={handleSubmit}
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

export default withTranslation(AcceptAllForm, [TranslationNamespace.RightsPortal]);
