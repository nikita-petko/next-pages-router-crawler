import type { FunctionComponent } from 'react';
import React from 'react';
import { useTranslation, withTranslation } from '@rbx/intl';
import {
  Collapse,
  ExpandLessIcon,
  ExpandMoreIcon,
  IconButton,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
  makeStyles,
} from '@rbx/ui';
import type { Claim as RightsClaim } from '@modules/clients/rights';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import ClaimItemTable from './ClaimItemTable';

// This is the length of the first section of a UUIDv4
const MAX_CLAIM_ID_LENGTH = 8;

interface RemovalRequestsRowProps {
  accountId: string;
  claim: RightsClaim;
}

const useStyles = makeStyles()(() => ({
  collapseTableCell: {
    padding: 0,
  },
}));

const RemovalRequestRow: FunctionComponent<React.PropsWithChildren<RemovalRequestsRowProps>> = ({
  accountId,
  claim,
}) => {
  const { ready, translate } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const {
    classes: { collapseTableCell },
  } = useStyles();

  const getShortenedClaimId = () => {
    let shortenedId = claim.id?.replaceAll('-', '') ?? '';
    shortenedId = shortenedId.substring(0, Math.min(shortenedId.length, MAX_CLAIM_ID_LENGTH));
    return shortenedId;
  };

  const getClaimStatusText = () => {
    if (claim.numReviewed && claim.numReviewed > 0) {
      return translate('Label.NumReviewed', {
        numReviewed: `${claim.numReviewed}`,
        numClaims: `${claim.numClaims}`,
      });
    }
    return translate('Label.NumPending', { numClaims: `${claim.numClaims}` });
  };

  if (!ready) {
    return null;
  }

  return (
    <>
      <TableRow key={claim.id}>
        <TableCell>
          <IconButton
            color='secondary'
            aria-label={translate('Label.ExpandRow')}
            size='small'
            onClick={() => setOpen(!open)}>
            {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
          <Typography noWrap variant='body1'>
            {claim.description}
          </Typography>
        </TableCell>
        <TableCell>
          <Tooltip arrow placement='top' title={claim.id}>
            <Typography noWrap variant='body1'>
              {getShortenedClaimId()}
            </Typography>
          </Tooltip>
        </TableCell>
        <TableCell>
          <Typography variant='body1'>{getClaimStatusText()}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant='body1'>{claim.createdAt?.toLocaleDateString()}</Typography>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={5} className={collapseTableCell}>
          <Collapse in={open} timeout='auto' unmountOnExit={false}>
            <ClaimItemTable accountId={accountId} claim={claim} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default withTranslation(RemovalRequestRow, [TranslationNamespace.RightsPortal]);
