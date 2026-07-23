import type { ChangeEvent, FunctionComponent } from 'react';
import React, { useEffect, useState } from 'react';
import type { RobloxApiDevelopModelsUniverseModel } from '@rbx/client-develop/v1';
import type { RobloxGamesApiModelsResponsePlaceDetails } from '@rbx/client-games/v1';
import { useTranslation } from '@rbx/intl';
import {
  Autocomplete,
  FormControl,
  Grid,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
  WarningIcon,
} from '@rbx/ui';
import developClient from '@modules/clients/develop';
import gamesClient from '@modules/clients/games';
import { IXPLayers } from '@modules/clients/ixpExperiments';
import useIXPParameters from '@modules/miscellaneous/hooks/useIXPParameters';
import { Audience } from '../../common/audiences';
import { SaleLocationEnum } from '../helper/UnifiedFeeSystemConstants';

interface PlaceSelectorInputs {
  numAllowedPlaces: number;
  disabled: boolean;
  selectedPlaces: Array<string>;
  availablePlaces: Array<string>;
  handleChange: (
    event: ChangeEvent<{}>,
    value: string[],
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue. */
    reason: any,
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any -- NOTE (jcountryman, 6/10/24): Turned off to check in text field consolidation work. Codeowners is
     * responsible for triaging issue. */
    details?: any,
  ) => void;
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any -- matches MUI Autocomplete handler signature; any on reason per existing pattern
  handleInputChange: (event: ChangeEvent<{}>, value: string, reason: any) => void;
}

const PlaceIdSelector: FunctionComponent<React.PropsWithChildren<PlaceSelectorInputs>> = ({
  numAllowedPlaces,
  disabled,
  selectedPlaces,
  availablePlaces,
  handleChange,
  handleInputChange,
}) => {
  const { translate } = useTranslation();
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

      multigetDetails.forEach(async (multigetResponse) => {
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
      });
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
            style={{
              paddingTop: '5px',
            }}
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
        <Typography
          variant='body2'
          color='warning'
          style={{ display: 'inline-flex', marginTop: '5px' }}>
          <WarningIcon fontSize='small' color='inherit' style={{ marginRight: '5px' }} />
          {translate(placeIdError)}
        </Typography>
      )}
    </Grid>
  );
};

interface SaleLocationProps {
  saleLocation: SaleLocationEnum;
  setSaleLocation: (saleLocation: SaleLocationEnum) => void;
  selectedPlaces: string[];
  setSelectedPlaces: (selectedPlaces: string[]) => void;
  availablePlaces: string[];
  setAvailablePlaces: (availablePlaces: string[]) => void;
}

function SaleLocation(props: SaleLocationProps) {
  const {
    saleLocation,
    setSaleLocation,
    selectedPlaces,
    setSelectedPlaces,
    availablePlaces,
    setAvailablePlaces,
  } = props;
  const { translate } = useTranslation();
  const theme = useTheme();

  return (
    <div>
      <Typography variant='h5' style={{ fontSize: '24px', fontWeight: '450' }}>
        {translate('Label.SaleLocation')}
      </Typography>
      <Grid container item XSmall={12} rowGap={2} marginTop='32px'>
        <Grid item XSmall={12} Large={5}>
          <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
            {translate('Label.Location')}
          </Typography>
          <br />
          <Typography variant='body2' style={{ color: theme.palette.content.muted }}>
            {translate('Message.ItemAvailableLocation')}
          </Typography>
        </Grid>
        <Grid item XSmall={12} Large={7}>
          <FormControl fullWidth>
            <Select
              id='sale-location-select'
              value={saleLocation}
              label='Location'
              onChange={(event) => setSaleLocation(+event.target.value)}>
              <MenuItem value={1}>{translate('Label.MarketplaceAndAllExperiences')}</MenuItem>
              <MenuItem value={2}>{translate('Label.ExperiencesAndDevAPIOnly')}</MenuItem>
              <MenuItem value={3}>{translate('Label.MarketplaceOnly')}</MenuItem>
              <MenuItem value={4}>{translate('Label.MarketplaceandExperiencesById')}</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      {(saleLocation === SaleLocationEnum.ExperiencesAndDevAPIOnly ||
        saleLocation === SaleLocationEnum.MarketplaceAndExperiencesById) && (
        <Grid container item XSmall={12} marginTop='32px'>
          <Grid item XSmall={5} style={{ paddingRight: '20px' }}>
            <Typography style={{ fontSize: '18px', fontWeight: '450' }}>
              {translate('Label.ExperiencesbyPlaceId')}
            </Typography>
            <br />
            <Typography variant='body2' style={{ color: theme.palette.content.muted }}>
              {translate('Label.ExperiencesbyPlaceIdDescription')}
            </Typography>
          </Grid>
          <Grid item XSmall={7}>
            <PlaceIdSelector
              numAllowedPlaces={5}
              disabled={false}
              selectedPlaces={selectedPlaces}
              availablePlaces={availablePlaces}
              handleChange={async (event: object, value: string[], reason: string) => {
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
              handleInputChange={async (event: object, value: string, reason: string) => {
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
    </div>
  );
}

export default SaleLocation;
