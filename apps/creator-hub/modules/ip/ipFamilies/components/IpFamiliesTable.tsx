import React, { useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  makeStyles,
  Grid,
} from '@rbx/ui';
import { IPFamily, IPFamilyStatusEnum } from '@rbx/clients/rightsV1';
import { useRouter } from 'next/router';

import {
  LicenseManagerClickEvent,
  useLicenseManagerLogger,
} from '../../license-manager/utils/logger';
import IpTableRow from '../../components/IpTableRow';
import IpFamilyStatusChip from './IpFamilyStatusChip';
import { IP_FAMILY_DETAILS_HREF } from '../urls';
import LinkButton from '../../components/LinkButton';
import IpFamilyRejectReasonModal from './IpFamilyRejectReasonModal';

const useStyles = makeStyles()((theme) => ({
  keywordsCell: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    maxWidth: '12vw',
  },
  linkButton: {
    paddingTop: '10px',
    fontSize: theme.typography.body2.fontSize,
  },
}));

/**
 * Pull out each row, since we need to fetch data for each IP Family.
 */
const IpFamilyTableRow: React.FC<{ ipFamily: IPFamily }> = ({ ipFamily }) => {
  const { classes } = useStyles();
  const router = useRouter();
  const { translate } = useTranslation();
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [rejectedIpFamily, setRejectedIpFamily] = useState<IPFamily | null>(null);
  const { logEvent } = useLicenseManagerLogger();

  const handleActivate = () => {
    logEvent(LicenseManagerClickEvent.ViewIpFamilyContentsClickEvent, {
      ipFamilyId: ipFamily.id!,
    });
    router.push(IP_FAMILY_DETAILS_HREF(ipFamily.id!));
  };

  return (
    <IpTableRow onActivate={handleActivate}>
      <TableCell>{ipFamily.name}</TableCell>
      <TableCell>
        <IpFamilyStatusChip ipFamily={ipFamily} />
        {ipFamily.status === IPFamilyStatusEnum.Rejected && ipFamily.statusReason && (
          <Grid item>
            <LinkButton
              className={classes.linkButton}
              onClick={(event) => {
                setRejectedIpFamily(ipFamily);
                setReasonDialogOpen(true);
                event.stopPropagation();
              }}>
              {translate('Label.ViewRejectReason')}
            </LinkButton>
            <IpFamilyRejectReasonModal
              ipFamily={rejectedIpFamily}
              reason={ipFamily.statusReason}
              dialogOpen={reasonDialogOpen}
              onDialogClose={() => {
                setReasonDialogOpen(false);
                setRejectedIpFamily(null);
              }}
            />
          </Grid>
        )}
      </TableCell>
      <TableCell>
        {ipFamily.createdAt ? new Date(ipFamily.createdAt).toLocaleDateString() : ''}
      </TableCell>
    </IpTableRow>
  );
};

const IpFamilyTableHeaders = () => {
  const { translate } = useTranslation();

  return (
    <TableRow>
      <TableCell>{translate('Label.IPFamily')}</TableCell>
      <TableCell>{translate('Label.Status')}</TableCell>
      <TableCell>{translate('Label.CreatedDate')}</TableCell>
    </TableRow>
  );
};

interface Props {
  ipFamilies: IPFamily[];
}

/**
 * Table that lists IP Families.
 */
const IpFamiliesTable: React.FC<Props> = ({ ipFamilies }) => {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <IpFamilyTableHeaders />
        </TableHead>
        <TableBody>
          {ipFamilies.map((ipFamily) => (
            <IpFamilyTableRow key={ipFamily.id} ipFamily={ipFamily} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default IpFamiliesTable;
