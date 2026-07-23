import { useRouter } from 'next/router';
import { useCallback } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
  CircularProgress,
  useTheme,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import useBatchArchiveMatches from '../../hooks/useBatchArchiveMatches';
import CartItemRow from './CartItemRow';
import type Match from './Match';

interface ArchiveMatchesDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  matchIds: string[];
  cartItems: Match[];
  removeFromCart: (item: Match) => void;
}

const ArchiveMatchesDialog = ({
  open,
  onClose,
  accountId,
  matchIds,
  cartItems,
  removeFromCart,
}: ArchiveMatchesDialogProps) => {
  const theme = useTheme();
  const router = useRouter();
  const { translate } = useTranslation();

  const { enqueueErrorSnackbar } = useIpSnackbar();

  const { mutate: archiveMatches, isPending } = useBatchArchiveMatches(
    () => {
      onClose();
      router.reload();
    },
    () => enqueueErrorSnackbar(),
  );

  const handleReject = useCallback(() => {
    archiveMatches({
      accountId,
      matchIds,
      rationale: 'Archived by User',
      removeConsequences: false,
    });
  }, [archiveMatches, accountId, matchIds]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='Medium'>
      <DialogTitle>{translate('Action.ArchiveMatches')}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mt: 1 }}>
          {translate('Description.ArchiveMatches')}
        </DialogContentText>
        {cartItems.length > 0 && (
          <div
            style={{
              marginTop: 16,
              padding: 16,
              border: `1px solid ${theme.palette.surface[400]}`,
              borderRadius: 4,
              maxHeight: 350,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}>
            <Typography variant='body2' color='secondary' sx={{ mb: 1 }}>
              {translate(cartItems.length === 1 ? 'Label.ItemSelected' : 'Label.ItemsSelected', {
                count: `${cartItems.length}`,
              })}
            </Typography>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cartItems.map((match) => (
                <CartItemRow
                  key={`${match.searchContent.contentId}${match.searchContent.contentType}`}
                  match={match}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color='secondary' variant='outlined' disabled={isPending}>
          {translate('Label.Cancel')}
        </Button>
        <Button
          onClick={handleReject}
          color='destructive'
          variant='contained'
          disabled={isPending || matchIds.length === 0}
          startIcon={isPending ? <CircularProgress size={16} /> : undefined}>
          {translate('Action.ArchiveMatches')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(ArchiveMatchesDialog, [TranslationNamespace.RightsPortal]);
