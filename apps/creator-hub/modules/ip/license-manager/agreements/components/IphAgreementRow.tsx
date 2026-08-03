import type { FunctionComponent } from 'react';
import { useRouter } from 'next/router';
import {
  LicenseDurationType,
  type HydratedListAgreementResponse,
} from '@rbx/client-content-licensing-api/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Skeleton, TableCell, Typography } from '@rbx/ui';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { formatDate } from '@modules/miscellaneous/utils/dateUtils';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import { FrontendFlagName } from '@modules/toolboxService/toolboxFeatureManagement';
import { useToolboxServiceApiProvider } from '@modules/toolboxService/ToolboxServiceApiProvider';
import CellError from '../../../components/error/CellError';
import IpTableRow from '../../../components/IpTableRow';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { useIpListingQuery } from '../../ipListings/hooks/ipListings';
import { IPH_AGREEMENT_DETAILS_HREF } from '../../urls';
import { getLifetimeVisitsRangeLabelFromEnum } from '../../utils/dauEnum';
import { getLicenseTypeTableLabelKey } from '../../utils/licenseTypeTableLabelKeys';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { getRevShareTimingKey } from '../../utils/revShareTiming';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import CreationCell from './CreationCell';
import IphAgreementStatusLabel from './IphAgreementStatusLabel';
import LicenseCell from './LicenseCell';
import useSharedAgreementRowStyles, {
  AGREEMENT_ROW_THUMBNAIL_GRID_FIRST_COL_WIDTH_PX,
  AGREEMENT_ROW_THUMBNAIL_SKELETON_CLASSNAME,
  AGREEMENT_ROW_THUMBNAIL_SKELETON_HEIGHT_PX,
} from './SharedAgreementRow.styles';

interface IphAgreementRowProps {
  agreement: HydratedListAgreementResponse;
}

const IPH_AGREEMENTS_TABLE_BASE_COLUMN_COUNT = 9;

const IphAgreementRow: FunctionComponent<IphAgreementRowProps> = ({ agreement }) => {
  const router = useRouter();
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const {
    cx,
    classes: { truncateTwoLines, ipFamilyName, twoColumnGrid },
  } = useSharedAgreementRowStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { isFetched } = useSettings();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;
  const columnCount =
    IPH_AGREEMENTS_TABLE_BASE_COLUMN_COUNT + (enableCollaborationLicensing ? 1 : 0);

  const handleActivate = () => {
    const agreementId = agreement.id;
    if (!agreementId) {
      return;
    }
    logEvent(LicenseManagerClickEvent.IphAgreementsTableViewAgreementClickEvent, {
      agreementId,
    });
    void router.push(IPH_AGREEMENT_DETAILS_HREF(agreementId));
  };

  const license = agreement.license;
  const ipListingRequest = useIpListingQuery(license?.listingId ?? undefined);
  const ipFamilyRequest = useIpFamilyQuery(ipListingRequest.data?.ipFamilyId ?? undefined);
  const universeId = Number(agreement.agreementTargets?.[0]?.contentId);
  const gameDetailsRequest = useDebouncedGameDetails(universeId);
  const isRowPending =
    !isFetched ||
    ipListingRequest.isPending ||
    ipFamilyRequest.isPending ||
    gameDetailsRequest.isPending;

  if (
    ipListingRequest.isError ||
    ipFamilyRequest.isError ||
    gameDetailsRequest.isError ||
    gameDetailsRequest.data === NO_GAME_FOUND_FOR_ID
  ) {
    return (
      <IpTableRow>
        <TableCell colSpan={columnCount}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  }

  if (isRowPending) {
    return (
      <IpTableRow>
        <TableCell>
          <div className={twoColumnGrid}>
            <Skeleton
              variant='rectangular'
              animate
              width={AGREEMENT_ROW_THUMBNAIL_GRID_FIRST_COL_WIDTH_PX}
              height={AGREEMENT_ROW_THUMBNAIL_SKELETON_HEIGHT_PX}
              className={AGREEMENT_ROW_THUMBNAIL_SKELETON_CLASSNAME}
            />
            <div>
              <Skeleton variant='text' animate width='50%' />
              <Skeleton variant='text' animate width='50%' />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className={twoColumnGrid}>
            <Skeleton
              variant='rectangular'
              animate
              width={AGREEMENT_ROW_THUMBNAIL_GRID_FIRST_COL_WIDTH_PX}
              height={AGREEMENT_ROW_THUMBNAIL_SKELETON_HEIGHT_PX}
              className={AGREEMENT_ROW_THUMBNAIL_SKELETON_CLASSNAME}
            />
            <div>
              <Skeleton variant='text' animate width='70%' />
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' className={cx(ipFamilyName)} />
        </TableCell>
        {enableCollaborationLicensing && (
          <TableCell>
            <Skeleton variant='text' animate width='50%' />
          </TableCell>
        )}
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='60%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
      </IpTableRow>
    );
  }

  const listing = ipListingRequest.data;
  const ipFamily = ipFamilyRequest.data;
  const gameData = gameDetailsRequest.data;

  if (
    !license ||
    !listing ||
    !ipFamily ||
    !gameData ||
    listing.thumbnailAssetIds?.[0] === undefined ||
    gameData.id === undefined ||
    gameData.name === undefined
  ) {
    return (
      <IpTableRow>
        <TableCell colSpan={columnCount}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  }

  const game = gameData;
  const thumbnailAssetId = listing.thumbnailAssetIds[0];

  return (
    <IpTableRow onActivate={handleActivate}>
      <TableCell>
        <CreationCell
          universeId={gameData.id}
          universeName={gameData.name}
          creatorName={game.creator?.name ?? ''}
        />
      </TableCell>
      <TableCell>
        <LicenseCell thumbnailAssetId={thumbnailAssetId} licenseName={license.name ?? ''} />
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='primary' className={cx(truncateTwoLines, ipFamilyName)}>
          {ipFamily.name}
        </Typography>
      </TableCell>
      {enableCollaborationLicensing && (
        <TableCell>
          <Typography variant='body2' color='primary'>
            {translate(getLicenseTypeTableLabelKey(license.licenseType))}
          </Typography>
        </TableCell>
      )}
      <TableCell>
        <Typography variant='body2' color='primary'>
          {license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
            ? getDateRangeLabel(agreement.startTime, agreement.endTime, locale ?? Locale.English)
            : translate('Label.Perpetual')}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='primary'>
          {license.royaltyRate && license.royaltyRate > 0
            ? formatRoyaltyRate(license.royaltyRate)
            : translate('Label.NotMonetized')}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='primary'>
          {translate(getRevShareTimingKey(agreement))}
        </Typography>
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='primary'>
          {translate(
            getLifetimeVisitsRangeLabelFromEnum(agreement.creatorLifetimeVisitBucket ?? undefined),
          )}
        </Typography>
      </TableCell>
      <TableCell>
        <IphAgreementStatusLabel agreement={agreement} isCompact />
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='primary'>
          {agreement.updatedAt
            ? formatDate(agreement.updatedAt, locale ?? Locale.English)
            : translate('Label.Unknown')}
        </Typography>
      </TableCell>
    </IpTableRow>
  );
};

export default IphAgreementRow;
