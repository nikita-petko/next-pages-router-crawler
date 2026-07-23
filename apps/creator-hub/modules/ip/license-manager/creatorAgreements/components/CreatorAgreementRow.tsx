import { FunctionComponent } from 'react';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { CircularProgress, TableCell, Typography } from '@rbx/ui';
import {
  LicenseDurationType,
  type HydratedListAgreementResponse,
} from '@rbx/clients/contentLicensingApi/v1';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import { formatDate } from '@modules/miscellaneous/common/utils';
import { useRouter } from 'next/router';
import { useSettings } from '@modules/settings';

import IpTableRow from '../../../components/IpTableRow';
import CreatorAgreementStatusLabel from './CreatorAgreementStatusLabel';
import { CREATOR_AGREEMENT_DETAILS_HREF } from '../../urls';
import { useGetCreatorAgreementDetails } from '../hooks/useGetCreatorAgreementDetails';
import CellError from '../../../components/error/CellError';
import { LicenseManagerClickEvent, useLicenseManagerLogger } from '../../utils/logger';
import CreationCell from '../../agreements/components/CreationCell';
import LicenseCell from '../../agreements/components/LicenseCell';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../../agreements/hooks/games';
import { getDateRangeLabel } from '../../utils/timeLimitedLicense';
import { getRevShareTimingKey } from '../../utils/revShareTiming';

interface CreateAgreementRowProps {
  agreement: HydratedListAgreementResponse;
}

const CreatorAgreementRow: FunctionComponent<CreateAgreementRowProps> = ({ agreement }) => {
  const router = useRouter();
  const { locale } = useLocalization();
  const { translate } = useTranslation();
  const { logEvent } = useLicenseManagerLogger();
  const { settings, isFetched } = useSettings();
  const { enableIpPlatformTimeboundLicenses } = settings;

  const handleActivate = () => {
    logEvent(LicenseManagerClickEvent.CreatorAgreementsTableViewAgreementClickEvent, {
      agreementId: agreement.id!,
    });
    router.push(CREATOR_AGREEMENT_DETAILS_HREF(agreement.id!));
  };

  const agreementDetailsRequest = useGetCreatorAgreementDetails({
    agreementId: agreement.id ?? undefined,
  });
  const universeId = agreement.agreementTargets
    ? Number(agreement.agreementTargets?.[0]?.contentId)
    : undefined;
  const universeRequest = useDebouncedGameDetails(universeId);

  if (!isFetched || agreementDetailsRequest.isPending || universeRequest.isPending) {
    return (
      <IpTableRow>
        <TableCell colSpan={enableIpPlatformTimeboundLicenses ? 7 : 6}>
          <CircularProgress />
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
        <TableCell colSpan={enableIpPlatformTimeboundLicenses ? 7 : 6}>
          <CellError />
        </TableCell>
      </IpTableRow>
    );
  }

  const { agreement: agreementData, license, listing } = agreementDetailsRequest.data;
  const universe = universeRequest.data;

  return (
    <IpTableRow onActivate={handleActivate}>
      <TableCell>
        <CreationCell
          universeId={universe.id!}
          universeName={universe.name!}
          creatorName={universe.creator?.name || ''}
        />
      </TableCell>
      <TableCell>
        <LicenseCell
          thumbnailAssetId={listing.thumbnailAssetIds![0]!}
          licenseName={license.name!}
        />
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
        <CreatorAgreementStatusLabel agreement={agreementData} isCompact />
      </TableCell>
      <TableCell>
        <Typography variant='body2' color='primary'>
          {formatDate(agreement.updatedAt!, locale ?? Locale.English)}
        </Typography>
      </TableCell>
    </IpTableRow>
  );
};

export default CreatorAgreementRow;
