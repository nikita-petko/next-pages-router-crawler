import { ClaimItem, ClaimItemStatusEnum } from '@rbx/clients/rightsV1';
import { Grid, InfoOutlinedIcon, Tooltip } from '@rbx/ui';
import React, { FunctionComponent } from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { Badge } from '@rbx/foundation-ui';

interface StatusAlertProps {
  claimItem: ClaimItem;
  isAllegedInfringer?: boolean;
}

// status label for detail claim item page
const StatusAlert: FunctionComponent<StatusAlertProps> = ({
  claimItem,
  isAllegedInfringer = false,
}) => {
  const { translate } = useTranslation();
  switch (claimItem?.status) {
    case ClaimItemStatusEnum.Open:
      return (
        <Grid container item direction='row' columnGap={1}>
          <Badge variant='Alert' label={translate('Description.AutomaticallyEscalated')} />
          <Grid item alignSelf='center'>
            <Tooltip arrow title={translate('Description.EscalatedInfo')} placement='right'>
              <InfoOutlinedIcon fontSize='large' />
            </Tooltip>
          </Grid>
        </Grid>
      );
    case ClaimItemStatusEnum.Pending:
      return isAllegedInfringer ? (
        <Badge
          variant='Alert'
          label={`${translate('Description.ResponseDueBy')} ${claimItem?.statusExpireAt?.toLocaleDateString()}`}
        />
      ) : (
        <Badge variant='Neutral' label={translate('Description.Pending')} />
      );
    case ClaimItemStatusEnum.Keep:
      return <Badge variant='Alert' label={translate('Description.RejectedByRoblox')} />;
    case ClaimItemStatusEnum.Takedown:
      return <Badge variant='Success' label={translate('Description.ApprovedByRoblox')} />;
    case ClaimItemStatusEnum.Accept:
      return <Badge variant='Success' label={translate('Description.Accepted')} />;
    case ClaimItemStatusEnum.Dispute:
      return isAllegedInfringer ? (
        <Badge variant='Warning' label={translate('Description.Disputed')} />
      ) : (
        <Badge
          variant='Warning'
          label={`${translate('Description.DisputedResponseDueBy')} ${claimItem?.statusExpireAt?.toLocaleDateString()}`}
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
      return (
        <Badge
          variant='Neutral'
          icon='icon-filled-star'
          label={translate('Description.Creating')}
        />
      );
    case ClaimItemStatusEnum.Failure:
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

export default withTranslation(StatusAlert, [TranslationNamespace.RightsPortal]);
