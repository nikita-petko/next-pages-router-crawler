import { useCallback } from 'react';
import {
  Typography,
  Skeleton,
  FileCopyOutlinedIcon,
  Grid,
  makeStyles,
  Alert,
  useSnackbar,
  IconButton,
} from '@rbx/ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { toastDurationTime } from '@modules/miscellaneous/common';

type Props = {
  id: string;
  isLoading: boolean;
};

const useSubIdStyles = makeStyles()(() => ({
  copyIconStyle: {
    marginLeft: 1,
  },
}));

function ItemCardExperienceSubscriptionsId({ id, isLoading }: Props) {
  const { enqueue, close: closeSnackbar } = useSnackbar();
  const {
    classes: { copyIconStyle },
  } = useSubIdStyles();
  const { translate } = useTranslation();

  const showSnackbar = useCallback(
    (msg: string) => {
      enqueue({
        children: <Alert severity='success'>{msg}</Alert>,
        anchorOrigin: { vertical: 'top', horizontal: 'center' },
        autoHideDuration: toastDurationTime,
        autoHide: true,
        onClose: closeSnackbar,
      });
    },
    [enqueue, closeSnackbar],
  );

  const copyToClipboard = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    navigator.clipboard.writeText(id);
    showSnackbar(translate('Message.CopiedSubscriptionID'));
  };

  return (
    <Grid direction='row' alignItems='center' justifyContent='center'>
      <Typography noWrap variant='body2'>
        {isLoading ? <Skeleton /> : `${translate('Label.ID')}: ${id}`}
      </Typography>
      <IconButton
        aria-label='copy'
        color='secondary'
        size='small'
        classes={{ root: copyIconStyle }}
        onClick={copyToClipboard}>
        <FileCopyOutlinedIcon fontSize='small' color='inherit' />
      </IconButton>
    </Grid>
  );
}

export default withTranslation(ItemCardExperienceSubscriptionsId, [
  TranslationNamespace.ExperienceSubscriptions,
]);
