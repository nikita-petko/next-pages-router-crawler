import type { ChangeEvent, FunctionComponent, ReactNode } from 'react';
import { useCallback, useMemo } from 'react';
import type {
  CreatorType,
  HydratedListAgreementResponse,
} from '@rbx/client-content-licensing-api/v1';
import { AgreementStatus } from '@rbx/client-content-licensing-api/v1';
import { getProductionCreatorHubUrl } from '@rbx/env-utils';
import { Badge } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { ReturnPolicy, Thumbnail2d, ThumbnailTypes, AssetThumbnailSize } from '@rbx/thumbnails';
import { Select, MenuItem, ListItemText, Link, Typography, Grid } from '@rbx/ui';
import { formatRoyaltyRate } from '@modules/licenses/utils/format';
import useSelectableLicenseAgreements from '../hooks/useSelectableLicenseAgreements';

// Creator Hub IP-licensing docs (https://create.roblox.com/docs/ip-licensing).
const LICENSE_LEARN_MORE_PATH = '/docs/ip-licensing';

interface StatusPresentation {
  labelKey: string;
  variant: 'Success' | 'Neutral';
}

// Only the statuses the picker ever surfaces (the hook filters to Active/Accepted).
const STATUS_PRESENTATION: Partial<Record<AgreementStatus, StatusPresentation>> = {
  [AgreementStatus.Active]: { labelKey: 'Label.AgreementStatusActive', variant: 'Success' },
  [AgreementStatus.Accepted]: { labelKey: 'Label.AgreementStatusAccepted', variant: 'Neutral' },
};

export interface LicensePickerProps {
  creatorType: CreatorType;
  creatorId: string;
  /** The currently-selected agreement, or undefined when none is chosen. */
  selectedAgreement?: HydratedListAgreementResponse;
  onSelect: (agreement: HydratedListAgreementResponse | undefined) => void;
  /** Disabled for already-published items — the license can't be changed going forward. */
  disabled?: boolean;
}

/**
 * License picker row for the item Configure page (UCP-1808). Rendered as the first row of the
 * "Item Attributes" section: a two-column layout with the label/description on the left and the
 * agreement dropdown on the right. Selecting an agreement surfaces the IP brand, royalty rate,
 * and agreement status. Disabled (and locked) for already-published items.
 */
const LicensePicker: FunctionComponent<LicensePickerProps> = ({
  creatorType,
  creatorId,
  selectedAgreement,
  onSelect,
  disabled = false,
}) => {
  const { translate } = useTranslation();

  const { agreements, isPending } = useSelectableLicenseAgreements({
    creatorType,
    creatorId,
    // No point fetching for an item that can no longer change its license.
    enabled: !disabled,
  });

  const isEmpty = !isPending && agreements.length === 0;
  // Keep the field visible (per design, licensing is surfaced to all creators) but inert
  // when there is nothing selectable or the item is already published.
  const isDisabled = disabled || isEmpty || isPending;

  // Display the brand / IP-listing name (e.g. "Nike"), per the Marketplace Licensing mock.
  const getAgreementName = useCallback(
    (agreement: HydratedListAgreementResponse): string =>
      agreement.listing?.name ?? agreement.license?.listingName ?? '',
    [],
  );

  // formatRoyaltyRate applies locale-aware percent formatting (e.g. "20%", "12.5%").
  const getRoyaltyText = useCallback(
    (agreement: HydratedListAgreementResponse): string =>
      translate('Label.PercentOfCreatorShare', {
        percent: formatRoyaltyRate(agreement.license?.royaltyRate),
      }),
    [translate],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<{ value: string }>) => {
      const agreementId = event.target.value;
      onSelect(agreements.find((agreement) => agreement.id === agreementId));
    },
    [agreements, onSelect],
  );

  const helperText = useMemo(() => {
    if (disabled) {
      return translate('Message.LicenseFieldLockedAfterPublish');
    }
    if (isEmpty) {
      return translate('Message.NoEligibleLicenseAgreements');
    }
    return undefined;
  }, [disabled, isEmpty, translate]);

  const renderSelectedValue = useCallback(
    (value: unknown): ReactNode => {
      // Prefer the selectedAgreement prop so the display stays authoritative even when the
      // fetch is skipped (published items) or the query cache has dropped the row.
      const agreement =
        selectedAgreement?.id === value
          ? selectedAgreement
          : agreements.find((item) => item.id === value);
      if (!agreement) {
        return (
          <Typography variant='body2' color='secondary'>
            {translate('Placeholder.SelectLicenseAgreement')}
          </Typography>
        );
      }
      return getAgreementName(agreement);
    },
    [selectedAgreement, agreements, getAgreementName, translate],
  );

  return (
    <Grid container item XSmall={12} rowGap={2} alignItems='center'>
      <Grid item XSmall={12} Large={5}>
        <Typography display='block' style={{ fontSize: '18px', fontWeight: '450' }}>
          {translate('Label.LicenseAgreements')}
        </Typography>
        <Typography display='block' variant='body2' color='secondary' style={{ marginTop: 4 }}>
          {translate('Description.LicenseAgreements')}{' '}
          <Link
            href={`${getProductionCreatorHubUrl(process.env.buildTarget)}${LICENSE_LEARN_MORE_PATH}`}
            target='_blank'>
            {translate('Action.LearnMore')}
          </Link>
        </Typography>
      </Grid>
      <Grid item XSmall={12} Large={7}>
        <Select
          fullWidth
          size='medium'
          margin='dense'
          displayEmpty
          disabled={isDisabled}
          value={selectedAgreement?.id ?? ''}
          onChange={handleChange}
          renderValue={renderSelectedValue}
          helperText={helperText}
          SelectProps={{ 'aria-label': translate('Label.LicenseAgreements') }}>
          {agreements.map((agreement) => {
            const statusPresentation =
              agreement.status != null ? STATUS_PRESENTATION[agreement.status] : undefined;
            const thumbnailAssetId = agreement.listing?.thumbnailAssetIds?.[0];
            return (
              <MenuItem key={agreement.id ?? ''} value={agreement.id ?? ''}>
                <div className='flex items-center justify-between gap-small width-full'>
                  <div className='flex items-center gap-medium min-width-0'>
                    {thumbnailAssetId != null && (
                      <div className='relative size-[32px] radius-circle clip shrink-0'>
                        <Thumbnail2d
                          targetId={thumbnailAssetId}
                          type={ThumbnailTypes.assetThumbnail}
                          alt={getAgreementName(agreement)}
                          returnPolicy={ReturnPolicy.PlaceHolder}
                          includeBackground={false}
                          // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
                          size={AssetThumbnailSize._150x150}
                          // [position:static] lets the Thumbnail2d span fill the sized parent above;
                          // [object-fit:cover] has no Foundation token (core utility emits no CSS).
                          containerClass='[position:static] size-full'
                          imgClassName='size-full [object-fit:cover]'
                        />
                      </div>
                    )}
                    <ListItemText
                      primary={getAgreementName(agreement)}
                      secondary={getRoyaltyText(agreement)}
                    />
                  </div>
                  {statusPresentation != null && (
                    <Badge
                      label={translate(statusPresentation.labelKey)}
                      variant={statusPresentation.variant}
                      size='Small'
                      shape='Pill'
                    />
                  )}
                </div>
              </MenuItem>
            );
          })}
        </Select>
      </Grid>
    </Grid>
  );
};

export default LicensePicker;
