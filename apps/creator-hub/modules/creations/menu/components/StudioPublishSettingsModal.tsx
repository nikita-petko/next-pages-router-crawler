import type { FunctionComponent } from 'react';
import React, { useCallback, useState } from 'react';
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

interface StudioPublishSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const MAX_PLACES = 5;
const MAX_PRICE = 999_999_999;
const TOAST_DURATION_MS = 3000;
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

const StudioPublishSettingsModal: FunctionComponent<StudioPublishSettingsModalProps> = ({
  open,
  onClose,
}) => {
  const { translate } = useTranslation();
  const { enqueue } = useSnackbar();
  const [isTimedOption, setIsTimedOption] = useState(true);
  const [priceOffset, setPriceOffset] = useState('');
  const [priceFloorMinimum, setPriceFloorMinimum] = useState('');
  const [enableRegionalPricing, setEnableRegionalPricing] = useState(true);
  const [sellInMarketplace, setSellInMarketplace] = useState(true);
  const [sellInExperiences, setSellInExperiences] = useState(true);
  const [experienceLocationMode, setExperienceLocationMode] = useState<'all' | 'specific'>('all');
  const [placeIds, setPlaceIds] = useState('');

  // TODO: persist to backend via publishingPreferences API (UCP-1565)
  const handleSave = useCallback(() => {
    enqueue({
      message: translate('Message.PublishingDefaultsSaved'),
      autoHide: true,
      autoHideDuration: TOAST_DURATION_MS,
      anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
    });
    onClose();
  }, [enqueue, onClose, translate]);

  const handlePriceOffsetChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Strip non-digits, then remove leading zeros (e.g. "00100" → "100", "0" stays "0")
      const val = e.target.value.replaceAll(/[^0-9]/g, '').replace(/^0+(\d)/, '$1');
      if (val === '' || +val <= MAX_PRICE) {
        setPriceOffset(val);
      }
    },
    [],
  );

  const handlePriceFloorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      // Strip non-digits, then remove leading zeros (e.g. "00100" → "100", "0" stays "0")
      const val = e.target.value.replaceAll(/[^0-9]/g, '').replace(/^0+(\d)/, '$1');
      if (val === '' || +val <= MAX_PRICE) {
        setPriceFloorMinimum(val);
      }
    },
    [],
  );

  // Sanitize place IDs: allow only digits/commas, collapse consecutive commas,
  // strip leading zeros from each ID, filter out "0", and cap at MAX_PLACES entries
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
    priceOffset === '' ||
    (experienceLocationMode === 'specific' &&
      sellInExperiences &&
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
            onChange={() => setSellInMarketplace((prev) => !prev)}
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

        {/* Experience locations */}
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

      {/* Footer */}
      <div className='flex padding-x-large padding-y-medium gap-small'>
        <Button
          variant='contained'
          color='primaryBrand'
          onClick={handleSave}
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
