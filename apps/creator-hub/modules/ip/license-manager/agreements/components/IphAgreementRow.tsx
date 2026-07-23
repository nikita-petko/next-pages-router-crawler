import { FunctionComponent } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { CircularProgress, TableCell, Typography } from '@rbx/ui';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { formatDate } from '@modules/miscellaneous/common/utils';
import {
  LicenseDurationType,
  type HydratedListAgreementResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import { useRouter } from 'next/router';
import { useSettings } from '@modules/settings';

import IpTableRow from '../../../components/IpTableRow';
import IphAgreementStatusLabel from './IphAgreementStatusLabel';
import useSharedAgreementRowStyles from './SharedAgreementRow.styles';
import { IPH_AGREEMENT_DETAILS_HREF } from '../../urls';
import { useIpListingQuery } from '../../ipListings/hooks/ipListings';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import CellError from '../../../components/error/CellError';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import CreationCell from './CreationCell';
import LicenseCell from './LicenseCell';
import { getLifetimeVisitsRangeLabelFromEnum } from '../../utils/dauEnum';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import { getRevShareTimingKey } from '../../utils/revShareTiming';

interface IphAgreementRowProps {
  agreement: HydratedListAgreementResponse;
}

const IphAgreementRow: FunctionComponent<IphAgreementRowProps> = ({ agreement }) => {
  const router = useRouter();
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const {
    cx,
    classes: { truncateTwoLines, ipFamilyName },
  } = useSharedAgreementRowStyles();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const handleActivate = () => {
    logEvent(LicenseManagerClickEvent.IphAgreementsTableViewAgreementClickEvent, {
      agreementId: agreement.id!,
    });
    router.push(IPH_AGREEMENT_DETAILS_HREF(agreement.id!));
  };

  const license = agreement.license!;
  const ipListingRequest = useIpListingQuery(license.listingId ?? undefined);
  const ipFamilyRequest = useIpFamilyQuery(ipListingRequest.data?.ipFamilyId ?? undefined);
  const universeId = Number(agreement.agreementTargets?.[0]?.contentId);
  const gameDetailsRequest = useDebouncedGameDetails(universeId);

  if (
    ipListingRequest.isError ||
    ipFamilyRequest.isError ||
    gameDetailsRequest.isError ||
    gameDetailsRequest.data === NO_GAME_FOUND_FOR_ID
  ) {
    return (
      <IpTableRow>
        <TableCell colSpan={enableIpPlatformTimeboundLicenses ? 9 : 8}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  }

  if (
    !isFetched ||
    ipListingRequest.isPending ||
    ipFamilyRequest.isPending ||
    gameDetailsRequest.isPending
  ) {
    return (
      <IpTableRow>
        <TableCell colSpan={enableIpPlatformTimeboundLicenses ? 9 : 8}>
          <CircularProgress />
        </TableCell>
      </IpTableRow>
    );
  }

  const listing = ipListingRequest.data;
  const ipFamily = ipFamilyRequest.data;
  const game = gameDetailsRequest.data;

  return (
    <IpTableRow onActivate={handleActivate}>
      <TableCell>
        <CreationCell
          universeId={game.id!}
          universeName={game.name!}
          creatorName={game.creator?.name || ''}
        />
      </TableCell>
      <TableCell>
        <LicenseCell
          thumbnailAssetId={listing.thumbnailAssetIds![0]!}
          licenseName={license.name!}
        />
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='primary' className={cx(truncateTwoLines, ipFamilyName)}>
          {ipFamily.name}
        </Typography>
      </TableCell>
      {enableIpPlatformTimeboundLicenses && (
        <TableCell>
          <Typography variant='body2' color='primary'>
            {license.licenseDuration?.durationType === LicenseDurationType.TimeLimited
              ? getDateRangeLabel(agreement.startTime, agreement.endTime, locale ?? Locale.English)
              : translate('Label.Perpetual')}
          </Typography>
        </TableCell>
      )}
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
          {formatDate(agreement.updatedAt!, locale ?? Locale.English)}
        </Typography>
      </TableCell>
    </IpTableRow>
  );
};

export default IphAgreementRow;
