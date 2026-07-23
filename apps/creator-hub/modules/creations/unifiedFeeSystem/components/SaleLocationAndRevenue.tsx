import type { FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import type { RobloxApiDevelopModelsUniverseModel } from '@rbx/client-develop/v1';
import type { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/client-games/v1';
import { Toggle } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import {
  Alert,
  Autocomplete,
  CloseIcon,
  FormControlLabel,
  Grid,
  IconButton,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  WarningIcon,
} from '@rbx/ui';
import developClient from '@modules/clients/develop';
import gamesClient from '@modules/clients/games';
import itemConfigurationClient from '@modules/clients/itemconfiguration';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { Audience } from '../../common/audiences';
import { useSaleLocationAndRevenueStyles } from '../helper/StyleHooks';
import { PurchasePlatformEnum, SaleLocationEnum } from '../helper/UnifiedFeeSystemConstants';
import SplitBar from './SplitBar';

interface TPlaceSelectorInputs {
  numAllowedPlaces: number;
  disabled: boolean;
  selectedPlaces: Array<string>;
  availablePlaces: Array<string>;
  handleChange: (
    event: React.SyntheticEvent,
    value: string[],
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue. */
    reason: any,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue. */
    details?: any,
  ) => void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
   * responsible for triaging issue. */
  handleInputChange: (event: React.SyntheticEvent, value: string, reason: any) => void;
}

const PlaceIdSelector: FunctionComponent<React.PropsWithChildren<TPlaceSelectorInputs>> = ({
  numAllowedPlaces,
  disabled,
  selectedPlaces,
  availablePlaces,
  handleChange,
  handleInputChange,
}) => {
  const { translate } = useTranslation();
  const { classes } = useSaleLocationAndRevenueStyles();
  const [placeIdError, setPlaceIdError] = useState('');
  const {
    params: { enableAudiencesReplacement },
  } = useIXPParameters(IXPLayers.CreatorHubCreationsPermission);
  const audiencesReplacementOn = enableAudiencesReplacement === true;

  useEffect(() => {
    async function validatePlaceIdList() {
      setPlaceIdError('');

      if (selectedPlaces.length === 0) {
        return;
      }

      let multigetDetails: RobloxGamesApiModelsResponsePlaceDetails[];
      try {
        const selectedPlacesAsInts = selectedPlaces.map((placeString: string) =>
          parseInt(placeString, 10),
        );
        multigetDetails = await gamesClient.multigetPlaceDetails(selectedPlacesAsInts);
      } catch {
        setPlaceIdError('Message.PublishError');
        return;
      }

      if (multigetDetails.length !== selectedPlaces.length) {
        setPlaceIdError('Message.PlaceIDNotExperience');
        return;
      }

      const removeDupes: number[] = [];

      for (const multigetResponse of multigetDetails) {
        const vUniverseId = multigetResponse.universeId;
        if (vUniverseId === undefined) {
          setPlaceIdError('Message.PublishError');
          return;
        }

        let universeConfig: RobloxApiDevelopModelsUniverseModel;
        try {
          universeConfig = await developClient.getUniverseDetails(vUniverseId);
        } catch {
          setPlaceIdError('Message.PublishError');
          return;
        }

        if (universeConfig === undefined) {
          setPlaceIdError('Message.PublishError');
          return;
        }

        if (universeConfig?.isArchived) {
          setPlaceIdError('Message.PlaceIDForArchivedEntered');
          return;
        }

        if (audiencesReplacementOn) {
          if (!universeConfig?.audiences?.includes(Audience.Public)) {
            setPlaceIdError('Message.PlaceIDForPrivateEntered');
            return;
          }
        } else if (universeConfig?.privacyType === 'Private') {
          setPlaceIdError('Message.PlaceIDForPrivateEntered');
          return;
        }

        if (!removeDupes.some((d) => d === vUniverseId)) {
          removeDupes.push(vUniverseId);
        } else {
          setPlaceIdError('Message.PlaceIDDuplicatesEntered');
        }
      }
    }

    void validatePlaceIdList();
  }, [selectedPlaces, audiencesReplacementOn]);

  return (
    <Grid item XSmall={12}>
      <Autocomplete
        multiple
        disabled={disabled}
        value={selectedPlaces}
        options={availablePlaces}
        onChange={handleChange}
        onInputChange={handleInputChange}
        noOptionsText={translate('Label.InvalidPlaceID')}
        getOptionLabel={(option) => option}
        renderInput={(params) => (
          <TextField
            {...params}
            error={selectedPlaces.length === 0}
            label={translate('Label.PlaceID')}
            className={classes.placeIdTextField}
          />
        )}
      />
      <Typography variant='body2' color='secondary'>
        {translate('Label.ExperienceCount', {
          experienceCount: `${selectedPlaces.length}`,
          totalExperiences: `${numAllowedPlaces}`,
        })}
        {'. '}
        {translate('Label.ExperienceSelectorHelperText')}
      </Typography>
      {placeIdError !== '' && (
        <Typography variant='body2' color='warning' className={classes.placeIdWarningContainer}>
          <WarningIcon fontSize='small' color='inherit' className={classes.placeIdWarningIcon} />
          {translate(placeIdError)}
        </Typography>
      )}
    </Grid>
  );
};

interface TSaleLocationAndRevenueProps {
  isBundle: boolean;
  targetId: string;
  isLimited: boolean;
  saleLocation: SaleLocationEnum;
  setSaleLocation: (saleLocation: SaleLocationEnum) => void;
  selectedPlaces: string[];
  setSelectedPlaces: (selectedPlaces: string[]) => void;
  availablePlaces: string[];
  setAvailablePlaces: (availablePlaces: string[]) => void;
  priceOffset: number;
  minimumPrice: number;
  isFree: boolean;
}

function SaleLocationAndRevenue(props: TSaleLocationAndRevenueProps) {
  const {
    isBundle,
    targetId,
    isLimited,
    saleLocation,
    setSaleLocation,
    selectedPlaces,
    setSelectedPlaces,
    availablePlaces,
    setAvailablePlaces,
    priceOffset,
    minimumPrice,
    isFree,
  } = props;
  const { translate } = useTranslation();
  const { classes } = useSaleLocationAndRevenueStyles();
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(true);
  const [experiencesEnabled, setExperiencesEnabled] = useState(true);
  const [marketplaceRevenueSplit, setMarketplaceRevenueSplit] = useState<number[]>([]);
  const [experiencesRevenueSplit, setExperiencesRevenueSplit] = useState<number[]>([]);
  const [allExperiencesEnabled, setAllExperiencesEnabled] = useState(true);
  const [increaseSplitBannerDismissed, setIncreaseSplitBannerDismissed] = useLocalStorage<boolean>(
    'increaseSplitBannerDismissed',
    false,
  );

  useEffect(() => {
    if (saleLocation === SaleLocationEnum.ExperiencesAndDevAPIOnly) {
      setMarketplaceEnabled(false);
      setExperiencesEnabled(true);
      setAllExperiencesEnabled(false);
    } else if (saleLocation === SaleLocationEnum.MarketplaceAndAllExperiences) {
      setMarketplaceEnabled(true);
      setExperiencesEnabled(true);
      setAllExperiencesEnabled(true);
    } else if (saleLocation === SaleLocationEnum.MarketplaceOnly) {
      setMarketplaceEnabled(true);
      setExperiencesEnabled(false);
    } else if (saleLocation === SaleLocationEnum.MarketplaceAndExperiencesById) {
      setMarketplaceEnabled(true);
      setExperiencesEnabled(true);
      setAllExperiencesEnabled(false);
    }
  }, [saleLocation, selectedPlaces.length]);

  useEffect(() => {
    // Update saleLocation based on changes to marketplaceEnabled and experiencesEnabled
    if (!marketplaceEnabled && experiencesEnabled) {
      setSaleLocation(SaleLocationEnum.ExperiencesAndDevAPIOnly);
    } else if (marketplaceEnabled && experiencesEnabled && allExperiencesEnabled) {
      setSaleLocation(SaleLocationEnum.MarketplaceAndAllExperiences);
    } else if (marketplaceEnabled && !experiencesEnabled) {
      setSaleLocation(SaleLocationEnum.MarketplaceOnly);
    } else if (marketplaceEnabled && experiencesEnabled && !allExperiencesEnabled) {
      setSaleLocation(SaleLocationEnum.MarketplaceAndExperiencesById);
    } else if (!marketplaceEnabled && !experiencesEnabled) {
      setSaleLocation(SaleLocationEnum.Invalid);
    }
  }, [marketplaceEnabled, experiencesEnabled, allExperiencesEnabled, setSaleLocation]);

  const latestCallNumber = React.useRef(0);

  useEffect(() => {
    const handler = setTimeout(() => {
      async function fetchRevenueSplits(callNumber: number) {
        if (isFree) {
          return;
        }
        // TODO @mryumae: durables - pass wear time to getRevenueSplit
        const marketplaceRevenueSplitCall = itemConfigurationClient.getRevenueSplit(
          isBundle,
          targetId,
          isLimited,
          minimumPrice,
          priceOffset,
          PurchasePlatformEnum.Marketplace,
        );

        const experiencesRevenueSplitCall = itemConfigurationClient.getRevenueSplit(
          isBundle,
          targetId,
          isLimited,
          minimumPrice,
          priceOffset,
          PurchasePlatformEnum.InExperience,
        );

        const [marketplaceRevenueSplitResponse, experiencesRevenueSplitResponse] =
          await Promise.all([marketplaceRevenueSplitCall, experiencesRevenueSplitCall]);

        if (callNumber !== latestCallNumber.current) {
          return;
        }

        setMarketplaceRevenueSplit([
          marketplaceRevenueSplitResponse.revenueSplit?.creatorSplitPercentage ?? 0,
          (marketplaceRevenueSplitResponse.revenueSplit?.marketplaceSplitPercentage ?? 0) +
            (marketplaceRevenueSplitResponse.revenueSplit?.sellerSplitPercentage ?? 0),
        ]);
        setExperiencesRevenueSplit([
          experiencesRevenueSplitResponse.revenueSplit?.creatorSplitPercentage ?? 0,
          experiencesRevenueSplitResponse.revenueSplit?.sellerSplitPercentage ?? 0,
          experiencesRevenueSplitResponse.revenueSplit?.marketplaceSplitPercentage ?? 0,
        ]);
      }
      const callNumber = latestCallNumber.current + 1;
      latestCallNumber.current = callNumber;
      void fetchRevenueSplits(callNumber);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [isBundle, isLimited, minimumPrice, priceOffset, targetId, isFree]);

  const MarketplaceNameKeys = ['Label.YourShare', 'Label.Roblox'];
  const ExperiencesNameKeys = ['Label.YourShare', 'Label.Experiences', 'Label.Roblox'];

  return (
    <div>
      <Typography variant='h5' className={classes.saleLocationSectionTitle}>
        {translate('Label.SaleLocationAndRevenue')}
      </Typography>
      <Grid container item XSmall={12} rowGap={4} className={classes.saleLocationMarginTop32}>
        <Grid container alignItems='flex-start' spacing={2}>
          <Grid item XSmall={12} Large={5}>
            <Typography className={classes.saleLocationSubsectionTitle}>
              {translate('Label.SellInMarketplace')}
            </Typography>
            <br />
            <Typography variant='body2' className={classes.saleLocationHelperText}>
              {translate('Message.ShareDependsOnPrice')}
            </Typography>
          </Grid>
          <Grid item Medium={12} Large={1}>
            <Toggle
              aria-label='Enable Marketplace Toggle'
              isChecked={marketplaceEnabled}
              onCheckedChange={() => {
                setMarketplaceEnabled(!marketplaceEnabled);
              }}
              size='Medium'
              placement='Start'
              label=''
            />
          </Grid>
          {marketplaceEnabled && !isFree && (
            <Grid item XSmall={12} Large={6}>
              <Grid container direction='column' rowGap={2}>
                <SplitBar percentages={marketplaceRevenueSplit} names={MarketplaceNameKeys} />
                {!increaseSplitBannerDismissed && (
                  <Alert
                    severity='info'
                    className={classes.increaseSplitBanner}
                    action={
                      <IconButton
                        aria-label='Close'
                        onClick={() => setIncreaseSplitBannerDismissed(true)}
                        className={classes.closeIconButton}>
                        <CloseIcon fontSize='small' color='action' />
                      </IconButton>
                    }>
                    <div className={classes.increaseSplitAlert}>
                      {translate('Message.HigherPriceIncreasesShare')}
                    </div>
                  </Alert>
                )}
              </Grid>
            </Grid>
          )}
        </Grid>
        <Grid container alignItems='flex-start' spacing={2}>
          <Grid item XSmall={12} Large={5}>
            <Typography className={classes.saleLocationSubsectionTitle}>
              {translate('Label.SellInExperiences')}
            </Typography>
          </Grid>
          <Grid item Medium={12} Large={1}>
            <Toggle
              aria-label='Enable Experiences Toggle'
              isChecked={experiencesEnabled}
              onCheckedChange={() => {
                setExperiencesEnabled(!experiencesEnabled);
              }}
              size='Medium'
              placement='Start'
              label=''
            />
          </Grid>
          {experiencesEnabled && !isFree && (
            <Grid item XSmall={12} Large={6}>
              <SplitBar percentages={experiencesRevenueSplit} names={ExperiencesNameKeys} />
            </Grid>
          )}
        </Grid>
        {experiencesEnabled && (
          <Grid container alignItems='flex-start' spacing={2}>
            <Grid item XSmall={12} Large={5}>
              <Typography className={classes.saleLocationSubsectionTitle}>
                {translate('Label.ExperienceLocations')}
              </Typography>
              <br />
              <Typography variant='body2' className={classes.saleLocationHelperText}>
                {translate('Label.CanSellAllOrSpecificExperiences')}
              </Typography>
            </Grid>
            <Grid item XSmall={12} Large={6}>
              <RadioGroup
                aria-label='Experience Locations Radio Group'
                value={allExperiencesEnabled ? 'all' : 'specific'}
                onChange={(event) => setAllExperiencesEnabled(event.target.value === 'all')}
                row>
                <FormControlLabel
                  value='all'
                  control={<Radio aria-label='AllExperiencesRadioButton' />}
                  label={translate('Label.AllExperiences')}
                  disabled={!marketplaceEnabled} // need to disable if marketplace is disabled
                />
                <FormControlLabel
                  value='specific'
                  control={<Radio aria-label='SpecificExperiencesRadioButton' />}
                  label={translate('Label.SpecificExperiences')}
                />
              </RadioGroup>
            </Grid>
          </Grid>
        )}
        {experiencesEnabled && !allExperiencesEnabled && (
          <Grid container alignItems='flex-start' spacing={2}>
            <Grid item XSmall={5} className={classes.experiencesDescriptionPadding}>
              <Typography className={classes.saleLocationSubsectionTitle}>
                {translate('Label.ExperiencesbyPlaceId')}
              </Typography>
              <br />
              <Typography variant='body2' className={classes.saleLocationHelperText}>
                {translate('Label.ExperiencesbyPlaceIdDescription')}
              </Typography>
            </Grid>
            <Grid item XSmall={7}>
              <PlaceIdSelector
                numAllowedPlaces={5}
                disabled={false}
                selectedPlaces={selectedPlaces}
                availablePlaces={availablePlaces}
                handleChange={(event: object, value: string[], reason: string) => {
                  if (reason === 'selectOption' || reason === 'removeOption') {
                    const removeDupes: string[] = [];
                    value.forEach((v) => {
                      if (!removeDupes.some((p) => p === v)) {
                        removeDupes.push(v);
                      }
                    });
                    if (removeDupes.length <= 5) {
                      setSelectedPlaces(removeDupes);
                    }
                  } else if (reason === 'clear') {
                    setSelectedPlaces([]);
                  }
                }}
                handleInputChange={(event: object, value: string, reason: string) => {
                  if (reason === 'input') {
                    if (/^\d+$/.test(value)) {
                      // if numeric
                      setAvailablePlaces([value]);
                    } else {
                      setAvailablePlaces([]);
                    }
                  }
                }}
              />
            </Grid>
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export default SaleLocationAndRevenue;
