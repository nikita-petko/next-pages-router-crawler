import React from 'react';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useTranslation, withTranslation } from '@rbx/intl';
import { makeStyles, TableCell, TableRow, Tooltip, Typography } from '@rbx/ui';
import { ClaimItem, ClaimItemDiscoveredFromEnum } from '@rbx/clients/rightsV1';
import { useRouter } from 'next/router';
import { ClaimContentRole } from '../../types/types';
import ClaimItemContentGrid from '../common/ClaimItemContentGrid';
import { ClaimPages, ViewClaimItemURL } from '../claimItem/ViewClaimItemContainer';
import StatusRow from '../claimsAgainstContent/StatusRow';
import SnapshotContentGrid from '../common/SnapshotContentGrid';

const useStyles = makeStyles()((theme) => ({
  tableRow: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.actionV2.secondary.containedHoverFocus,
      color: theme.palette.actionV2.primary.containedHoverFocus,
    },
  },
}));

// ClaimByMeRow is a table row that displays a C&D Claim filed by me.
const ClaimByMeRow = ({ claim }: { claim: ClaimItem }) => {
  const router = useRouter();
  const { ready, translate } = useTranslation();
  const {
    classes: { tableRow },
  } = useStyles();
  if (!ready) {
    return null;
  }
  const MAX_CLAIM_ID_LENGTH = 8; // first section of a uuid
  let shortenedId = claim.id?.replaceAll('-', '') ?? '';
  shortenedId = shortenedId.substring(0, Math.min(shortenedId.length, MAX_CLAIM_ID_LENGTH));

  const viewClaimItemURL = ViewClaimItemURL(claim.claimId || '', claim.id || '');

  let claimContentGrid: React.ReactNode;
  if (claim.discoveredFrom === ClaimItemDiscoveredFromEnum.Snapshot) {
    claimContentGrid = <SnapshotContentGrid claim={claim} />;
  } else {
    claimContentGrid = (
      <ClaimItemContentGrid claimItem={claim} role={ClaimContentRole.Infringing} />
    );
  }
  return (
    <TableRow
      key={claim.id ?? ''}
      className={tableRow}
      onClick={() =>
        router.push({ pathname: viewClaimItemURL, query: { claim: ClaimPages.ByMe } })
      }>
      <TableCell>{claimContentGrid}</TableCell>
      <TableCell>
        {claim.content ? (
          <ClaimItemContentGrid claimItem={claim} role={ClaimContentRole.Original} isMyCreation />
        ) : (
          <Typography variant='body2'>{translate('Label.NoOriginalContent')}</Typography>
        )}
      </TableCell>
      <TableCell>
        <StatusRow claimItem={claim} />
      </TableCell>
      <TableCell>
        <Tooltip arrow placement='bottom' title={claim.id}>
          <Typography noWrap variant='body1'>
            {shortenedId}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell>
        <Typography>{claim.createdAt?.toLocaleDateString()}</Typography>
      </TableCell>
      <TableCell>
        <Typography>{claim.updatedAt?.toLocaleDateString()}</Typography>
      </TableCell>
    </TableRow>
  );
};

export default withTranslation(ClaimByMeRow, [TranslationNamespace.RightsPortal]);
