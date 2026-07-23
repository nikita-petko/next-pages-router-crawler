import { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  CircularProgress,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@rbx/ui';
import { EmptyState, EmptyStateBorder } from '@modules/miscellaneous/common/components';
import type { AgreementStatus } from '@rbx/clients/contentLicensingApi/v1';
import Link from 'next/link';
import { useSettings } from '@modules/settings';

import { useGetCreatorAgreementsByStatus } from '../hooks/useGetCreatorAgreementsByStatus';
import CreatorAgreementRow from './CreatorAgreementRow';
import { creatorAgreementTabsConfig, EmptyStateKeys } from '../CreatorAgreementsContainer';
import IpLoadError from '../../../components/error/IpLoadError';
import { LicenseManagerImpressionEvent, useLicenseManagerLoggerLogOnce } from '../../utils/logger';

const useStyles = makeStyles()({
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: 200,
  },
  emptyStateContainer: {
    marginTop: 24,
  },
  tableHeaders: {
    whiteSpace: 'nowrap',
  },
});

export const getAgreementEnumsForTab = (tabKey: string | undefined): AgreementStatus[] => {
  const filter = creatorAgreementTabsConfig.find((config) => config.keyName === tabKey);
  return filter?.statusEnums || [];
};

export const getEmptyStateKeysForTab = (tabKey: string | undefined): EmptyStateKeys => {
  const filter = creatorAgreementTabsConfig.find((config) => config.keyName === tabKey);
  return filter?.translationKeys || { headingKey: '', descriptionKey: '', button: undefined };
};

export const getEmptyStateImpressionEventForTab = (
  tabKey: string | undefined,
): LicenseManagerImpressionEvent | undefined => {
  const filter = creatorAgreementTabsConfig.find((config) => config.keyName === tabKey);
  return filter?.emptyTableImpressionEvent || undefined;
};

/**
 * This component displays a table of agreements that the creator manages,
 * grouped in tabs based on the status of the agreement.
 *
 * Tabs: Offers, My Requests, Active, Inactive.
 */

interface CreatorAgreementsTableProps {
  selectedTab?: string;
}

const CreatorAgreementsTable: FunctionComponent<CreatorAgreementsTableProps> = ({
  selectedTab,
}) => {
  const { translate } = useTranslation();
  const { classes } = useStyles();
  const { logOnce } = useLicenseManagerLoggerLogOnce();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const creatorAgreementsRequest = useGetCreatorAgreementsByStatus({
    agreementStatus: getAgreementEnumsForTab(selectedTab),
  });

  if (!isFetched || creatorAgreementsRequest.isPending) {
    return (
      <div className={classes.loading}>
        <CircularProgress />
      </div>
    );
  }

  if (creatorAgreementsRequest.isError) {
    return <IpLoadError error={creatorAgreementsRequest.error} />;
  }

  const { agreements } = creatorAgreementsRequest.data;

  if (agreements.length === 0) {
    const impressionEvent = getEmptyStateImpressionEventForTab(selectedTab);
    if (impressionEvent) {
      logOnce(impressionEvent);
    }

    const emptyTableKeys = getEmptyStateKeysForTab(selectedTab);

    return (
      <div className={classes.emptyStateContainer}>
        <EmptyStateBorder>
          <EmptyState
            size='small'
            title={translate(emptyTableKeys.headingKey)}
            description={translate(emptyTableKeys.descriptionKey)}>
            {emptyTableKeys.button && (
              <Button
                component={Link}
                href={emptyTableKeys.button.href}
                variant='contained'
                color='primaryBrand'>
                {translate(emptyTableKeys.button.key)}
              </Button>
            )}
          </EmptyState>
        </EmptyStateBorder>
      </div>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow className={classes.tableHeaders}>
            <TableCell width='30%'>{translate('Label.Creation')}</TableCell>
            <TableCell width='30%'>{translate('Label.License')}</TableCell>
            {enableIpPlatformTimeboundLicenses && (
              <TableCell width='10%'>{translate('Label.Duration')}</TableCell>
            )}
            <TableCell width='10%'>{translate('Label.RevenueShare')}</TableCell>
            <TableCell width='10%'>{translate('Label.RevenueShareTiming')}</TableCell>
            <TableCell width='10%'>{translate('Label.Status')}</TableCell>
            <TableCell width='10%'>{translate('Label.LastUpdated')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {agreements.map((agreement) => (
            <CreatorAgreementRow key={agreement.id} agreement={agreement} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CreatorAgreementsTable;
