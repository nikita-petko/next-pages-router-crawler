import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  TextField,
  Typography,
  useTheme,
} from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import useBatchArchiveMatches from '../../hooks/useBatchArchiveMatches';
import type Match from './Match';
import SmallContentThumbnail from './SmallContentThumbnail';

interface RejectMatchDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  matchId: string;
  matchContent: Match;
}

const RejectMatchDialog = ({
  open,
  onClose,
  accountId,
  matchId,
  matchContent,
}: RejectMatchDialogProps) => {
  const theme = useTheme();
  const router = useRouter();
  const { translate } = useTranslation();
  const [rationale, setRationale] = useState('');
  const { enqueueErrorSnackbar } = useIpSnackbar();

  const { mutate: archiveMatch, isPending } = useBatchArchiveMatches(
    () => {
      setRationale('');
      onClose();
      router.reload();
    },
    () => enqueueErrorSnackbar(),
  );

  const handleReject = useCallback(() => {
    archiveMatch({ accountId, matchIds: [matchId], rationale, removeConsequences: true });
  }, [archiveMatch, accountId, matchId, rationale]);

  const handleClose = useCallback(() => {
    if (!isPending) {
      setRationale('');
      onClose();
    }
  }, [isPending, onClose]);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='Medium'>
      <DialogTitle>{translate('Action.RejectMatch')}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mt: 1 }}>{translate('Description.RejectMatch')}</DialogContentText>
        <div
          style={{
            marginTop: 16,
            padding: 16,
            border: `1px solid ${theme.palette.surface[400]}`,
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
          <div style={{ flexShrink: 0 }}>
            <SmallContentThumbnail content={matchContent.searchContent} />
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <Typography
              variant='body2'
              sx={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {matchContent.searchContent.contentName}
            </Typography>
            <Typography variant='caption' color='secondary' sx={{ display: 'block' }}>
              {`@${matchContent.searchContent.creator?.displayName}`}
            </Typography>
          </div>
        </div>
        <TextField
          id='reject-single-match-rationale'
          sx={{ mt: 3 }}
          label={translate('Label.Rationale')}
          placeholder={translate('Label.RationalePlaceholder')}
          multiline
          minRows={2}
          maxRows={3}
          fullWidth
          value={rationale}
          onChange={(e) => setRationale(e.target.value.slice(0, 400))}
          inputProps={{ maxLength: 400 }}
          helperText={`${rationale.length}/400`}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='secondary' variant='outlined' disabled={isPending}>
          {translate('Label.Cancel')}
        </Button>
        <Button
          onClick={handleReject}
          color='destructive'
          variant='contained'
          disabled={isPending || rationale.trim().length === 0}
          startIcon={isPending ? <CircularProgress size={16} /> : undefined}>
          {translate('Action.RejectMatch')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default withTranslation(RejectMatchDialog, [TranslationNamespace.RightsPortal]);
