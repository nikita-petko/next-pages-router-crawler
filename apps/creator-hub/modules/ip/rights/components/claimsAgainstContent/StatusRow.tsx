import type { FunctionComponent } from 'react';
import { useState } from 'react';
import type { ClaimItem } from '@rbx/client-rights/v1';
import { ClaimItemStatusEnum } from '@rbx/client-rights/v1';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Button, CircularProgress, Grid, InfoOutlinedIcon, Tooltip } from '@rbx/ui';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import RejectReasonModal from '../common/RejectReasonModal';

interface StatusRowProps {
  claimItem: ClaimItem;
  isAllegedInfringer?: boolean;
  showRejectReason?: boolean;
}

// status label for within a table (claim by me table or claim against content table)
const StatusRow: FunctionComponent<StatusRowProps> = ({
  claimItem,
  isAllegedInfringer = false,
  showRejectReason = true,
}) => {
  const { translate } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);

  switch (claimItem?.status) {
    case ClaimItemStatusEnum.Open:
      return (
        <Grid container item direction='row' columnGap={1} alignItems='center' flexWrap='nowrap'>
          <Badge variant='Alert' label={translate('Description.AutomaticallyEscalated')} />
          <Tooltip arrow title={translate('Description.EscalatedInfo')} placement='bottom'>
            <InfoOutlinedIcon fontSize='medium' />
          </Tooltip>
        </Grid>
      );
    case ClaimItemStatusEnum.Pending:
      return isAllegedInfringer ? (
        <Badge variant='Neutral' label={translate('Label.PendingResponse')} />
      ) : (
        <Badge variant='Neutral' label={translate('Label.Pending')} />
      );
    case ClaimItemStatusEnum.Keep:
      return (
        <Grid>
          <Badge variant='Alert' label={translate('Description.RejectedByRoblox')} />
          {showRejectReason && (
            <Grid item>
              <Button
                sx={{ textTransform: 'none' }}
                size='small'
                onClick={(event) => {
                  setDialogOpen(true);
                  event.stopPropagation();
                }}>
                {translate('Label.ViewRejectReason')}
              </Button>
              <RejectReasonModal
                reason={claimItem.statusReason}
                dialogOpen={dialogOpen}
                setDialogOpen={setDialogOpen}
              />
            </Grid>
          )}
        </Grid>
      );
    case ClaimItemStatusEnum.Takedown:
      return <Badge variant='Success' label={translate('Description.ApprovedByRoblox')} />;
    case ClaimItemStatusEnum.Accept:
      return <Badge variant='Success' label={translate('Description.Accepted')} />;
    case ClaimItemStatusEnum.Dispute:
      return (
        <Badge
          variant='Neutral'
          icon='icon-filled-triangle-exclamation'
          label={translate('Description.Disputed')}
        />
      );
    case ClaimItemStatusEnum.Drop:
    case ClaimItemStatusEnum.DropAfterDispute:
      return (
        <Badge
          variant='Neutral'
          icon='icon-filled-star'
          label={translate('Description.Released')}
        />
      );
    case ClaimItemStatusEnum.Escalate:
      return <Badge variant='Alert' label={translate('Description.EscalatedToRoblox')} />;
    case ClaimItemStatusEnum.Creating:
      return <CircularProgress />;
    case ClaimItemStatusEnum.Failure:
      return (
        <Badge
          variant='Neutral'
          icon='icon-filled-triangle-exclamation'
          label={translate('Label.Error')}
        />
      );
    default:
      return (
        <Badge
          variant='Neutral'
          icon='icon-filled-triangle-exclamation'
          label={translate('Label.Error')}
        />
      );
  }
};

export default withTranslation(StatusRow, [TranslationNamespace.RightsPortal]);
