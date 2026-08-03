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
import CreationCell from '../../agreements/components/CreationCell';
import LicenseCell from '../../agreements/components/LicenseCell';
import useSharedAgreementRowStyles, {
  AGREEMENT_ROW_THUMBNAIL_GRID_FIRST_COL_WIDTH_PX,
  AGREEMENT_ROW_THUMBNAIL_SKELETON_CLASSNAME,
  AGREEMENT_ROW_THUMBNAIL_SKELETON_HEIGHT_PX,
} from '../../agreements/components/SharedAgreementRow.styles';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../../agreements/hooks/games';
import { CREATOR_AGREEMENT_DETAILS_HREF } from '../../urls';
import { getLicenseTypeTableLabelKey } from '../../utils/licenseTypeTableLabelKeys';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import { getRevShareTimingKey } from '../../utils/revShareTiming';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import { useGetCreatorAgreementDetails } from '../hooks/useGetCreatorAgreementDetails';
import CreatorAgreementStatusLabel from './CreatorAgreementStatusLabel';

interface CreateAgreementRowProps {
  agreement: HydratedListAgreementResponse;
}

const CREATOR_AGREEMENTS_TABLE_BASE_COLUMN_COUNT = 7;

const CreatorAgreementRow: FunctionComponent<CreateAgreementRowProps> = ({ agreement }) => {
  const router = useRouter();
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const {
    classes: { twoColumnGrid },
  } = useSharedAgreementRowStyles();
  const { isFetched } = useSettings();
  const { frontendFlags } = useToolboxServiceApiProvider();
  const enableCollaborationLicensing =
    frontendFlags[FrontendFlagName.FrontendFlagEnableCreatorCollaborationLicensing] ?? false;
  const columnCount =
    CREATOR_AGREEMENTS_TABLE_BASE_COLUMN_COUNT + (enableCollaborationLicensing ? 1 : 0);

  const handleActivate = () => {
    const agreementId = agreement.id;
    if (!agreementId) {
      return;
    }
    logEvent(LicenseManagerClickEvent.CreatorAgreementsTableViewAgreementClickEvent, {
      agreementId,
    });
    void router.push(CREATOR_AGREEMENT_DETAILS_HREF(agreementId));
  };

  const agreementDetailsRequest = useGetCreatorAgreementDetails({
    agreementId: agreement.id ?? undefined,
  });
  const universeId = agreement.agreementTargets
    ? Number(agreement.agreementTargets?.[0]?.contentId)
    : undefined;
  const universeRequest = useDebouncedGameDetails(universeId);
  const isRowPending = !isFetched || agreementDetailsRequest.isPending || universeRequest.isPending;

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
          <Skeleton variant='text' animate width='60%' />
        </TableCell>
        <TableCell>
          <Skeleton variant='text' animate width='50%' />
        </TableCell>
      </IpTableRow>
    );
  }

  if (
    agreementDetailsRequest.isError ||
    !agreementDetailsRequest.data ||
    universeRequest.isError ||
    universeRequest.data === NO_GAME_FOUND_FOR_ID
  ) {
    return (
      <IpTableRow>
        <TableCell colSpan={columnCount}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  }

  const { agreement: agreementData, license, listing } = agreementDetailsRequest.data;
  const universe = universeRequest.data;

  if (
    listing.thumbnailAssetIds?.[0] === undefined ||
    universe.id === undefined ||
    universe.name === undefined
  ) {
    return (
      <IpTableRow>
        <TableCell colSpan={columnCount}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  }

  const thumbnailAssetId = listing.thumbnailAssetIds[0];

  return (
    <IpTableRow onActivate={handleActivate}>
      <TableCell>
        <CreationCell
          universeId={universe.id}
          universeName={universe.name}
          creatorName={universe.creator?.name ?? ''}
        />
      </TableCell>
      <TableCell>
        <LicenseCell thumbnailAssetId={thumbnailAssetId} licenseName={license.name ?? ''} />
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
        <CreatorAgreementStatusLabel agreement={agreementData} isCompact />
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

export default CreatorAgreementRow;
