import {
  Dialog,
  Typography,
  Grid,
  Radio,
  RadioGroup,
  FormControlLabel,
  DialogTitle,
  DialogContent,
  Button,
  DialogActions,
  AlertTitle,
  CloseIcon,
  IconButton,
  Alert,
} from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import React, { FunctionComponent, useCallback, useState } from 'react';
import { PlaceInfo } from '../types/PlaceInfo';
import PlacesChipSelect from './PlacesChipSelect';

export interface SaveConfigurationDialogProps {
  isDialogOpen: boolean;
  appliedPlaces: PlaceInfo[];
  onClose: () => void;
  onConfirm: (selectedPlaceIds: number[]) => void;
}

// scenario 1: if there are applied places, we show radio
// (1) Update for already assigned places (# of already assigned places)
// (2) Add / remove places assigned (removing a place will reset it to default Matchmaking weights)
// (1) is default selected
// scenario 2:if there are no applied places, we show radio
// (1) Decide later, or run a matchmaking experiment before fully rolling out (recommended)
// (2) Immediately enable for all users on a set of places
// (1) is default selected

// for both scenarios, if we detect a change in selected places that is different from the applied places, we show the alert, the alert can be dismissed by user toggling the close icon
// for scenario 1:
// if the user selects "decide later", we reset the selected places to the applied places, thus the alert will not be shown again
// if the user selects "immediately enable", we show the place selector
// for scenario 2:
// the alert will be shown unless user selects "Add / remove places assigned " and make chagnes to the selected places
// if the user selects "Update for already assigned places", at this stage, the selected places are applied places, thus the alert will not be shown
// if the user selects "Add / remove places assigned" and make changes to the selected places, the alert will be shown again, and the place selector will be shown

const SaveConfigurationDialog: FunctionComponent<
  React.PropsWithChildren<SaveConfigurationDialogProps>
> = ({ isDialogOpen, appliedPlaces, onClose, onConfirm }) => {
  const { translate } = useTranslation();
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceInfo[]>(appliedPlaces);
  const hasAppliedPlaces = appliedPlaces.length > 0;

  const [addOrRemovePlacesEnabled, setAddOrRemovePlacesEnabled] = useState<boolean>(false);
  const [showExperimentAlert, setShowExperimentAlert] = useState<boolean>(false);

  const isPlacesChanged = useCallback(() => {
    return (
      selectedPlaces.length !== appliedPlaces.length ||
      selectedPlaces.some(
        (place) => !appliedPlaces.some((appliedPlace) => appliedPlace.placeId === place.placeId),
      )
    );
  }, [selectedPlaces, appliedPlaces]);

  const handleSaveButtonClick = useCallback(() => {
    const placeIds = selectedPlaces.map((place) => place.placeId).filter((id) => id !== undefined);
    onConfirm(placeIds);
  }, [onConfirm, selectedPlaces]);

  const handleRadioChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enableAddOrRemovePlaces = event.target.value === 'true';
    // Reset selected places to original when choosing not to make changes to the selected places
    if (!enableAddOrRemovePlaces) {
      setSelectedPlaces(appliedPlaces);
    }
    setShowExperimentAlert(enableAddOrRemovePlaces);
    setAddOrRemovePlacesEnabled(enableAddOrRemovePlaces);
  };
  return (
    <Dialog open={isDialogOpen} onClose={() => onClose()} color='primaryBrand' fullWidth>
      <DialogTitle>{translate('Dialog.SaveConfiguration')}</DialogTitle>
      <DialogContent>
        <Grid container direction='column' gap='24px'>
          <Typography variant='body1'>{translate('Dialog.SaveConfiguration.Subtitle')}</Typography>
          {isPlacesChanged() && showExperimentAlert && (
            <Alert
              severity='info'
              action={[
                <IconButton aria-label='Close' key='iconButton' size='small' color='inherit'>
                  <CloseIcon fontSize='small' onClick={() => setShowExperimentAlert(false)} />
                </IconButton>,
              ]}>
              <AlertTitle paddingTop={0.5} paddingBottom={0.5}>
                {translate('Alert.Title.SaveConfigurationExperimentNudge')}
              </AlertTitle>
              <Typography variant='smallLabel1'>
                {translate('Alert.Body.SaveConfigurationExperimentNudge')}
              </Typography>
            </Alert>
          )}
          <RadioGroup value={addOrRemovePlacesEnabled} onChange={handleRadioChange}>
            <FormControlLabel
              value={false}
              control={<Radio aria-label='applyConfigurationToPlacesLater' />}
              label={
                <Typography variant='captionBody'>
                  {hasAppliedPlaces
                    ? translate('Dialog.SaveConfiguration.Option.NoAssignedPlacesChange', {
                        assignedPlacesCount: appliedPlaces.length.toString(),
                      })
                    : translate('Dialog.SaveConfiguration.Option.DecideLater')}
                </Typography>
              }
            />
            <FormControlLabel
              value
              control={<Radio aria-label='applyConfigurationToPlacesNow' />}
              label={
                <Typography variant='captionBody'>
                  {hasAppliedPlaces
                    ? translate('Dialog.SaveConfiguration.Option.AddOrRemovePlaces')
                    : translate('Dialog.SaveConfiguration.Option.ImmediatelyEnable')}
                </Typography>
              }
            />
          </RadioGroup>
          {addOrRemovePlacesEnabled && (
            <PlacesChipSelect
              disabled={false}
              showOptional={false}
              appliedPlaces={selectedPlaces}
              onSelectedPlacesChange={(places: PlaceInfo[]) => setSelectedPlaces(places)}
            />
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button variant='outlined' color='secondary' onClick={onClose}>
          {translate('Button.Cancel')}
        </Button>
        <Button
          variant='contained'
          color='primaryBrand'
          disabled={addOrRemovePlacesEnabled && !isPlacesChanged()}
          onClick={handleSaveButtonClick}>
          {translate('Button.SaveConfiguration')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaveConfigurationDialog;
