import type { FunctionComponent } from 'react';
import Link from 'next/link';
import type { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
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
import EmptyState from '@modules/miscellaneous/components/EmptyState/EmptyState';
import EmptyStateBorder from '@modules/miscellaneous/components/EmptyState/EmptyStateBorder';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import IpLoadError from '../../../components/error/IpLoadError';
import {
  IP_AGREEMENTS_TABLE_CREATION_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_DURATION_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_LAST_UPDATED_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_LICENSE_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_LICENSE_TYPE_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_REVENUE_SHARE_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_REVENUE_SHARE_TIMING_COL_WIDTH_PX,
  IP_AGREEMENTS_TABLE_STATUS_COL_WIDTH_PX,
} from '../../agreements/components/IpAgreementsTable.style';
import { LICENSE_TYPE_TABLE_HEADER_KEY } from '../../utils/licenseTypeTableLabelKeys';
import type { LicenseManagerImpressionEvent } from '../../utils/logger';
import { useLicenseManagerLoggerLogOnce } from '../../utils/logger';
import { creatorAgreementTabsConfig, type EmptyStateKeys } from '../constants';
import { useGetCreatorAgreementsByStatus } from '../hooks/useGetCreatorAgreementsByStatus';
import CreatorAgreementRow from './CreatorAgreementRow';

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
  return filter?.statusEnums ?? [];
};

export const getEmptyStateKeysForTab = (tabKey: string | undefined): EmptyStateKeys => {
  const filter = creatorAgreementTabsConfig.find((config) => config.keyName === tabKey);
  return filter?.translationKeys ?? { headingKey: '', descriptionKey: '', button: undefined };
};

export const getEmptyStateImpressionEventForTab = (
  tabKey: string | undefined,
): LicenseManagerImpressionEvent | undefined => {
  const filter = creatorAgreementTabsConfig.find((config) => config.keyName === tabKey);
  return filter?.emptyTableImpressionEvent ?? undefined;
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
  const { isFetched } = useSettings();
  const { frontendFlags, loadingFrontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;

  const creatorAgreementsRequest = useGetCreatorAgreementsByStatus({
    agreementStatus: getAgreementEnumsForTab(selectedTab),
  });

  if (!isFetched || creatorAgreementsRequest.isPending || loadingFrontendFlags) {
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
            <TableCell width={`${IP_AGREEMENTS_TABLE_CREATION_COL_WIDTH_PX}px`}>
              {translate('Label.Creation')}
            </TableCell>
            <TableCell width={`${IP_AGREEMENTS_TABLE_LICENSE_COL_WIDTH_PX}px`}>
              {translate('Label.License')}
            </TableCell>
            {enableCollaborationLicensing && (
              <TableCell width={`${IP_AGREEMENTS_TABLE_LICENSE_TYPE_COL_WIDTH_PX}px`}>
                {translate(LICENSE_TYPE_TABLE_HEADER_KEY)}
              </TableCell>
            )}
            <TableCell width={`${IP_AGREEMENTS_TABLE_DURATION_COL_WIDTH_PX}px`}>
              {translate('Label.Duration')}
            </TableCell>
            <TableCell width={`${IP_AGREEMENTS_TABLE_REVENUE_SHARE_COL_WIDTH_PX}px`}>
              {translate('Label.RevenueShare')}
            </TableCell>
            <TableCell width={`${IP_AGREEMENTS_TABLE_REVENUE_SHARE_TIMING_COL_WIDTH_PX}px`}>
              {translate('Label.RevenueShareTiming')}
            </TableCell>
            <TableCell width={`${IP_AGREEMENTS_TABLE_STATUS_COL_WIDTH_PX}px`}>
              {translate('Label.Status')}
            </TableCell>
            <TableCell width={`${IP_AGREEMENTS_TABLE_LAST_UPDATED_COL_WIDTH_PX}px`}>
              {translate('Label.LastUpdated')}
            </TableCell>
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
