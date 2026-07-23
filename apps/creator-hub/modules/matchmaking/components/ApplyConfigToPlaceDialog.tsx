import React, { useState, useCallback } from 'react';
import { useTranslation } from '@rbx/intl';
import { Dialog, DialogTemplate, Grid, MenuItem, Select } from '@rbx/ui';
import useConfigurationManagement from '../hooks/useConfigurationManagement';
import useMatchmakingExperiments from '../hooks/useMatchmakingExperiments';
import type { PlaceInfo } from '../types/PlaceInfo';
import { getPlacesInfoFromConfigId } from '../utils/ConfigurationUtils';
import ExperimentationNudgeAlert from './ExperimentComponents/ExperimentationNudgeAlert';
import PlacesChipSelect from './PlacesChipSelect';

type ApplyConfigToPlaceDialogProps = {
  configId?: string;
  isOpen: boolean;
  onApplyToPlaces: (configId: string, placeIds: number[]) => void;
  onClose: () => void;
};

const ApplyConfigToPlaceDialog = ({
  configId,
  isOpen,
  onApplyToPlaces,
  onClose,
}: ApplyConfigToPlaceDialogProps) => {
  const { translate } = useTranslation();
  const { allConfigurationBriefInfoList } = useConfigurationManagement();
  const [selectedConfigId, setSelectedConfigId] = useState<string | undefined>(configId);
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceInfo[]>(
    getPlacesInfoFromConfigId(configId, allConfigurationBriefInfoList),
  );

  const { showExperimentNudge } = useMatchmakingExperiments();

  const handleConfirmApplyToPlaces = useCallback(() => {
    const placeIds =
      selectedPlaces?.map((place) => place.placeId).filter((id) => id !== undefined) ?? [];
    if (selectedConfigId) {
      onApplyToPlaces(selectedConfigId, placeIds);
    }
  }, [onApplyToPlaces, selectedConfigId, selectedPlaces]);

  const handleConfigChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const id = e?.target?.value;
      setSelectedConfigId(id);
      setSelectedPlaces(getPlacesInfoFromConfigId(id, allConfigurationBriefInfoList));
    },
    [allConfigurationBriefInfoList],
  );

  return (
    <Dialog open={isOpen} maxWidth='Large'>
      <DialogTemplate
        color='primaryBrand'
        title={translate('Label.AddConfigToPlace')}
        cancelText={translate('Button.Cancel')}
        confirmText={translate('Button.SaveConfiguration')}
        onConfirm={handleConfirmApplyToPlaces}
        onCancel={onClose}
        content={
          <Grid container direction='column' gap='24px' marginTop='24px'>
            {showExperimentNudge && <ExperimentationNudgeAlert />}
            <Select
              fullWidth
              value={configId}
              label={translate('Label.SelectConfig')}
              onChange={handleConfigChange}>
              {allConfigurationBriefInfoList?.map((config) => (
                <MenuItem key={config.id} value={config.id}>
                  {config.name}
                </MenuItem>
              ))}
            </Select>
            <PlacesChipSelect
              disabled={!selectedConfigId}
              showOptional={false}
              appliedPlaces={selectedPlaces}
              onSelectedPlacesChange={(places: PlaceInfo[]) => setSelectedPlaces(places)}
            />
          </Grid>
        }
      />
    </Dialog>
  );
};

export default ApplyConfigToPlaceDialog;
