import { RightsClaimItem } from '@modules/clients';
import { ClaimItemStatusEnum } from '@rbx/clients/rightsV1';
import { Badge } from '@rbx/foundation-ui';
import React, { FunctionComponent, useState } from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { Button, Grid } from '@rbx/ui';
import RejectReasonModal from '../common/RejectReasonModal';

interface ClaimItemStatusProps {
  claimItem: RightsClaimItem;
}

const ClaimItemStatus: FunctionComponent<React.PropsWithChildren<ClaimItemStatusProps>> = ({
  claimItem,
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { ready, translate } = useTranslation();

  if (!ready) {
    return null;
  }

  switch (claimItem.status) {
    case ClaimItemStatusEnum.Creating:
      return <Badge variant='Neutral' label={translate('Description.Creating')} />;
    case ClaimItemStatusEnum.Failure:
      return (
        <Badge
          variant='Neutral'
          icon='icon-filled-triangle-exclamation'
          label={translate('Label.Error')}
        />
      );
    case ClaimItemStatusEnum.Open:
      return <Badge variant='Neutral' label={translate('Label.Pending')} />;
    case ClaimItemStatusEnum.Keep:
      return (
        <Grid>
          <Badge variant='Alert' label={translate('Label.Rejected')} />
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
        </Grid>
      );
    case ClaimItemStatusEnum.Takedown:
      return <Badge variant='Success' label={translate('Label.Approved')} />;
    // Default to an error
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

export default withTranslation(ClaimItemStatus, [TranslationNamespace.RightsPortal]);
