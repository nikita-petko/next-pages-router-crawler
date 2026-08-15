import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  CloseIcon,
  InfoOutlinedIcon,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useSnackbar,
} from '@rbx/ui';
import { useAuthentication } from '@modules/authentication/providers';
import itemconfigurationClient from '@modules/clients/itemconfiguration';
import {
  getPublishingPreferences,
  createPublishingPreferences,
  getPreferencesErrorStatus,
  PublishingType,
  SaleLocationType,
} from '@modules/clients/publishingPreferences';
import tryParseResponseError from '@modules/clients/utils/tryParseResponseError';
import { useCurrentGroup } from '@modules/providers/groups/GroupsProvider';
import useGetMetadata from '@modules/react-query/itemConfiguration/itemConfigurationQueries';
import { DefaultMaxCollectiblePrice } from '../../unifiedFeeSystem/helper/UnifiedFeeSystemConstants';

interface StudioPublishSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_PLACES = 5;
const TOAST_DURATION_MS = 3000;
const HTTP_STATUS_NOT_FOUND = 404;
// PublishingPreferencesErrors.UserDoesNotHavePermissionsForGroup in item-configuration-api.
const PREFERENCES_ERROR_MISSING_GROUP_PERMISSION = 9;
const ROW_GRID = 'grid [grid-template-columns:175px_1fr] items-center padding-y-large';

interface SettingsRowProps {
  label: string;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

const SettingsRow: FunctionComponent<SettingsRowProps> = ({
  label,
  children,
  className,
  labelClassName,
}) => (
  <>
    <div className={className ?? ROW_GRID}>
      <span className={`text-label-large ${labelClassName ?? ''}`}>{label}</span>
      {children}
    </div>
    <Divider />
  </>
);

// The publish path requires a place id for these two and rejects one supplied for the other two.
function saleLocationRequiresPlaces(saleLocationType: SaleLocationType): boolean {
  return (
    saleLocationType === SaleLocationType.ShopAndExperiencesById ||
    saleLocationType === SaleLocationType.ExperiencesAndDeveloperApi
  );
}

function deriveSaleLocationType(
  sellInMarketplace: boolean,
  sellInExperiences: boolean,
  experienceLocationMode: 'all' | 'specific',
): SaleLocationType {
  if (sellInMarketplace && sellInExperiences && experienceLocationMode === 'all') {
    return SaleLocationType.ShopAndAllExperiences;
  }
  if (sellInMarketplace && sellInExperiences && experienceLocationMode === 'specific') {
    return SaleLocationType.ShopAndExperiencesById;
  }
  if (sellInMarketplace && !sellInExperiences) {
    return SaleLocationType.ShopOnly;
  }
  if (!sellInMarketplace && sellInExperiences) {
    return SaleLocationType.ExperiencesAndDeveloperApi;
  }
  // Selling nowhere has no location. Save is already blocked here, so this is only reached if that guard is
  // ever lost, and then the API rejects Invalid rather than storing "sell everywhere". Matches the item flow.
  return SaleLocationType.Invalid;
}

// saleLocationType arrives as a NUMBER (the API never emits the enum's string names), so this
// must compare numeric values — matching on strings here silently fell through to the default
// and showed every creator "shop and all experiences" regardless of what they had saved.
function parseSaleLocationType(saleLocationType: SaleLocationType): {
  sellInMarketplace: boolean;
  sellInExperiences: boolean;
  experienceLocationMode: 'all' | 'specific';
} {
  switch (saleLocationType) {
    case SaleLocationType.ShopOnly:
      return { sellInMarketplace: true, sellInExperiences: false, experienceLocationMode: 'all' };
    // Specific, so a stored record's place ids stay visible instead of being dropped on the next save.
    case SaleLocationType.ExperiencesAndDeveloperApi:
      return {
        sellInMarketplace: false,
        sellInExperiences: true,
        experienceLocationMode: 'specific',
      };
    case SaleLocationType.ShopAndExperiencesById:
      return {
        sellInMarketplace: true,
        sellInExperiences: true,
        experienceLocationMode: 'specific',
      };
    // Invalid (0) should never be stored, but fall back to the same default as an unrecognised
    // value rather than rendering an empty selection.
    case SaleLocationType.Invalid:
    case SaleLocationType.ShopAndAllExperiences:
    default:
      return { sellInMarketplace: true, sellInExperiences: true, experienceLocationMode: 'all' };
  }
}

const StudioPublishSettingsModal: FunctionComponent<StudioPublishSettingsModalProps> = ({
  open,
  onClose,
}) => {
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const { user } = useAuthentication();
  // Deliberately useCurrentGroup, NOT useCurrentOrganization: the organization record is fetched
  // separately and OrganizationProvider sets it to null when that fetch fails, while currentGroup
  // stays set. Deriving the creator from the organization therefore meant that a failed org lookup
  // silently switched this modal to the personal creator while the page still showed the group's
  // items — reading, displaying and then overwriting the creator's own preferences as if they were
  // the group's. currentGroup is the same source the item grid uses, so the two cannot diverge.
  const currentGroup = useCurrentGroup();
  const groupId = currentGroup?.id;

  // Bound the price inputs by Settings.MaxCollectiblePrice, a dynamic runtime setting rather than a
  // constant, read the same way Pricing.tsx and SavePanel.tsx read it.
  // Be aware this currently ALWAYS resolves to the fallback: ICA emits the field as
  // "MaxCollectiblePrice" (PascalCase, via [DataMember] on CollectiblesMetadataResponse) while the
  // generated client's type — and therefore its FromJSON mapping — expects "maxCollectiblePrice".
  // Verified against sitetest3: the response carries 'MaxCollectiblePrice': 999999999. So this line
  // is equivalent to hardcoding 999999999 today, exactly as it is for the two components above.
  // It is written this way so that if the casing is reconciled, all three start tracking the real
  // cap together rather than this one silently keeping a stale duplicate.
  const { data: collectiblesMetadata } = useGetMetadata(itemconfigurationClient);
  const maxPrice = collectiblesMetadata?.maxCollectiblePrice ?? DefaultMaxCollectiblePrice;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // isRentalOptIn defaults to false per the preferences contract, so a creator who never touches
  // this switch must not be opted into timed options. Only the first-save default is affected:
  // loading an existing record overwrites this from prefs.isRentalOptIn below.
  const [isTimedOption, setIsTimedOption] = useState(false);
  const [priceOffset, setPriceOffset] = useState('');
  const [priceFloorMinimum, setPriceFloorMinimum] = useState('');
  const [enableRegionalPricing, setEnableRegionalPricing] = useState(true);
  const [sellInMarketplace, setSellInMarketplace] = useState(true);
  const [sellInExperiences, setSellInExperiences] = useState(true);
  const [experienceLocationMode, setExperienceLocationMode] = useState<'all' | 'specific'>('all');
  const [placeIds, setPlaceIds] = useState('');
  const [didLoadFail, setDidLoadFail] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    void getPublishingPreferences(groupId)
      .then((prefs) => {
        setPriceOffset(String(prefs.priceOffset));
        setPriceFloorMinimum(prefs.priceInRobux > 0 ? String(prefs.priceInRobux) : '');
        setEnableRegionalPricing(prefs.enableRegionalPricing);
        setIsTimedOption(prefs.isRentalOptIn);
        const parsed = parseSaleLocationType(prefs.saleLocationType);
        setSellInMarketplace(parsed.sellInMarketplace);
        setSellInExperiences(parsed.sellInExperiences);
        setExperienceLocationMode(parsed.experienceLocationMode);
        if (prefs.places.length > 0) {
          setPlaceIds(prefs.places.join(','));
        }
      })
      .catch((error: unknown) => {
        // Only a 404 means "this creator has no preferences yet", which is an expected state the
        // defaults already represent. Every other failure has to be surfaced: swallowing it left
        // the form showing defaults that look exactly like a first-time setup, so the next Save
        // silently full-replaced whatever was actually stored. Block saving in that case.
        if (getPreferencesErrorStatus(error) === HTTP_STATUS_NOT_FOUND) {
          return;
        }
        setDidLoadFail(true);
        enqueue({
          message: translate('Message.ErrorProcessingRequest'),
          autoHide: true,
          autoHideDuration: TOAST_DURATION_MS,
          anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
        });
      })
      .finally(() => setIsLoading(false));
  }, [open, groupId, enqueue, translate]);

  const handleSave = useCallback(async () => {
    if (!user?.id) {
      return;
    }
    setIsSaving(true);
    try {
      const saleLocationType = deriveSaleLocationType(
        sellInMarketplace,
        sellInExperiences,
        experienceLocationMode,
      );
      const places = saleLocationRequiresPlaces(saleLocationType)
        ? placeIds
            .split(',')
            .filter(Boolean)
            .map((id) => Number(id))
        : [];

      await createPublishingPreferences({
        creatorUserId: user.id,
        creatorGroupId: groupId,
        publishingType: PublishingType.NonLimited,
        saleLocationType,
        places,
        priceInRobux: Number(priceFloorMinimum) || 0,
        priceOffset: Number(priceOffset),
        isFree: false,
        enableRegionalPricing,
        isRentalOptIn: isTimedOption,
        autoPublishEnabled: true,
      });

      enqueue({
        message: translate('Message.PublishingDefaultsSaved'),
        autoHide: true,
        autoHideDuration: TOAST_DURATION_MS,
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
      });
      onClose();
    } catch (e: unknown) {
      // The preferences endpoint has its own error enum, so this deliberately does NOT reuse
      // getTranslationKeyForItemConfigurationError — that helper maps the collectibles codes,
      // where 9 is LimitedPublishLimit rather than our UserDoesNotHavePermissionsForGroup, so
      // every code would render the wrong message.
      const error = await tryParseResponseError(e);
      enqueue({
        message: translate(
          error?.code === PREFERENCES_ERROR_MISSING_GROUP_PERMISSION
            ? 'Message.UserMissingGroupPermissions'
            : 'Message.PublishingUnsuccessful',
        ),
        autoHide: true,
        autoHideDuration: TOAST_DURATION_MS,
        anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    user,
    groupId,
    sellInMarketplace,
    sellInExperiences,
    experienceLocationMode,
    placeIds,
    priceFloorMinimum,
    priceOffset,
    enableRegionalPricing,
    isTimedOption,
    enqueue,
    onClose,
    translate,
  ]);

  const handleSaveClick = useCallback(() => {
    void handleSave();
  }, [handleSave]);

  const handlePriceOffsetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value.replaceAll(/[^0-9]/g, '').replace(/^0+(\d)/, '$1');
      if (val === '' || +val <= maxPrice) {
        setPriceOffset(val);
      }
    },
    [maxPrice],
  );

  const handlePriceFloorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.value.replaceAll(/[^0-9]/g, '').replace(/^0+(\d)/, '$1');
      if (val === '' || +val <= maxPrice) {
        setPriceFloorMinimum(val);
      }
    },
    [maxPrice],
  );

  const handlePlaceIdsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const raw = e.target.value.replaceAll(/[^0-9,]/g, '');
      const collapsed = raw.replaceAll(/,{2,}/g, ',').replace(/^,/, '');
      const normalized = collapsed
        .split(',')
        .map((p) => p.replace(/^0+(\d)/, '$1'))
        .filter((p) => p !== '0')
        .join(',');
      const ids = normalized.split(',').filter(Boolean);
      if (ids.length > MAX_PLACES) {
        return;
      }
      if (ids.length === MAX_PLACES && normalized.endsWith(',')) {
        setPlaceIds(normalized.slice(0, -1));
        return;
      }
      setPlaceIds(normalized);
    },
    [],
  );

  const isSaveDisabled =
    isLoading ||
    isSaving ||
    // The form is showing defaults because the read failed, not because none are stored, so
    // saving here would replace real preferences with values the creator never chose.
    didLoadFail ||
    (!sellInMarketplace && !sellInExperiences) ||
    priceOffset === '' ||
    priceFloorMinimum === '' ||
    Number(priceFloorMinimum) <= 0 ||
    // Keyed on the location that will be sent, not the radio, so it cannot disagree with the publish path.
    (saleLocationRequiresPlaces(
      deriveSaleLocationType(sellInMarketplace, sellInExperiences, experienceLocationMode),
    ) &&
      placeIds.split(',').filter(Boolean).length === 0);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='Medium'
      color='primaryBrand'
      PaperProps={{ className: '[width:580px]' }}>
      <DialogTitle className='padding-bottom-none'>
        <div className='flex justify-between items-start'>
          <span className='text-heading-small'>{translate('Heading.StudioPublishSettings')}</span>
          <IconButton aria-label='Close' onClick={onClose} size='small' color='inherit'>
            <CloseIcon />
          </IconButton>
        </div>
      </DialogTitle>

      <DialogContent className='padding-top-small'>
        <Typography variant='body2' className='[opacity:0.7] padding-bottom-medium'>
          {translate('Description.StudioPublishSettingsSubtitle')}
        </Typography>

        <SettingsRow label={translate('Label.Availability')}>
          <span className='text-label-large [margin-left:12px]'>
            {translate('Label.NonLimited')}
          </span>
        </SettingsRow>

        <SettingsRow label={translate('Label.TimedOption')}>
          <Switch
            checked={isTimedOption}
            onChange={() => setIsTimedOption((prev) => !prev)}
            aria-label='Timed Option'
          />
        </SettingsRow>

        <SettingsRow
          label={translate('Label.PriceConfigurations')}
          className='grid [grid-template-columns:175px_1fr] padding-y-large gap-xsmall'
          labelClassName='padding-top-small'>
          <div className='flex flex-col [flex:1] gap-xsmall'>
            <div className='flex items-center gap-xsmall'>
              <TextField
                id='price-offset'
                label=''
                placeholder={translate('Placeholder.AmountAbovePriceFloor')}
                variant='outlined'
                size='small'
                value={priceOffset}
                onChange={handlePriceOffsetChange}
                fullWidth
              />
              <Tooltip title={translate('Tooltip.AmountAbovePriceFloor')}>
                <IconButton aria-label='price offset info' size='small'>
                  <InfoOutlinedIcon />
                </IconButton>
              </Tooltip>
            </div>
            <div className='flex items-center gap-xsmall'>
              <TextField
                id='price-floor-minimum'
                label=''
                placeholder={translate('Placeholder.DoNotPriceBelow')}
                variant='outlined'
                size='small'
                value={priceFloorMinimum}
                onChange={handlePriceFloorChange}
                fullWidth
              />
              <Tooltip title={translate('Tooltip.MinimumPriceFloor')}>
                <IconButton aria-label='minimum price info' size='small'>
                  <InfoOutlinedIcon />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </SettingsRow>

        <SettingsRow label={translate('Label.RegionalPricing')}>
          <Switch
            checked={enableRegionalPricing}
            onChange={() => setEnableRegionalPricing((prev) => !prev)}
            aria-label='Regional Pricing'
          />
        </SettingsRow>

        <SettingsRow label={translate('Label.SellInMarketplace')}>
          <Switch
            checked={sellInMarketplace}
            onChange={() => {
              const nextSellInMarketplace = !sellInMarketplace;
              // Without the shop the only location left is experiences-and-dev-API, which needs a place id.
              if (!nextSellInMarketplace) {
                setExperienceLocationMode('specific');
              }
              setSellInMarketplace(nextSellInMarketplace);
            }}
            aria-label='Sell in Marketplace'
          />
        </SettingsRow>

        <SettingsRow label={translate('Label.SellInExperiences')}>
          <Switch
            checked={sellInExperiences}
            onChange={() => setSellInExperiences((prev) => !prev)}
            aria-label='Sell in experiences'
          />
        </SettingsRow>

        {sellInExperiences && (
          <>
            <Divider />
            <div className='padding-y-large'>
              <div className='grid [grid-template-columns:175px_1fr] items-center'>
                <span className='text-label-large'>{translate('Label.ExperienceLocations')}</span>
                <RadioGroup
                  row
                  value={experienceLocationMode}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === 'all' || value === 'specific') {
                      setExperienceLocationMode(value);
                    }
                  }}
                  className='flex flex-row no-wrap gap-xsmall [margin-left:12px]'>
                  <FormControlLabel
                    value='all'
                    disabled={!sellInMarketplace}
                    control={<Radio aria-label={translate('Label.AllGames')} size='small' />}
                    label={translate('Label.AllGames')}
                    className='margin-right-medium'
                  />
                  <FormControlLabel
                    value='specific'
                    control={
                      <Radio aria-label={translate('Label.SpecificExperiences')} size='small' />
                    }
                    label={translate('Label.SpecificExperiences')}
                  />
                </RadioGroup>
              </div>
              {experienceLocationMode === 'specific' && (
                <div className='[margin-left:187px] [margin-top:10px]'>
                  <TextField
                    id='place-ids'
                    label=''
                    placeholder={translate('Placeholder.EnterExperienceIDs')}
                    variant='outlined'
                    size='small'
                    value={placeIds}
                    onChange={handlePlaceIdsChange}
                    fullWidth
                  />
                  <Typography variant='caption' className='[opacity:0.6] block [margin-top:4px]'>
                    {placeIds ? placeIds.split(',').filter(Boolean).length : 0}/{MAX_PLACES}{' '}
                    {translate('Label.ExperiencesCount')}
                  </Typography>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>

      <div className='flex padding-x-large padding-y-medium gap-small'>
        <Button
          variant='contained'
          color='primaryBrand'
          onClick={handleSaveClick}
          disabled={isSaveDisabled}
          size='large'
          className='[flex:1] radius-medium'>
          {translate('Action.Save')}
        </Button>
        <Button
          variant='contained'
          color='secondary'
          onClick={onClose}
          size='large'
          className='[flex:1] radius-medium'>
          {translate('Action.Cancel')}
        </Button>
      </div>
    </Dialog>
  );
};

export default StudioPublishSettingsModal;
