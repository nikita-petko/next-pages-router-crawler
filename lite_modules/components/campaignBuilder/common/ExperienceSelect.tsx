import { ProgressCircle } from '@rbx/foundation-ui';
import { Autocomplete, FormControl, TextField, Tooltip } from '@rbx/ui';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useFormContext, UseFormReturn } from 'react-hook-form';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import { FormField as AdvancedTargetingFormField } from '@constants/advancedTargeting';
import {
  AllDetailedTargetingMatchTypes,
  experienceNotFoundOption,
  FlowTypes,
  FORM_HELPER_TEXT_PROPS,
  FormField,
  INPUT_LABEL_PROPS,
  noExperiencesOption,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import { PUBLIC_UNIVERSE_PRIVACY_TYPE } from '@constants/universeConstants';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { getUniverses } from '@services/ads/getUniversesService';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { ThumbnailStoreType, useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { ThumbnailType } from '@type/thumbnail';
import { UniverseShapeType } from '@type/universe';
import { ResetForm as ResetAdvancedTargetingForm } from '@utils/advancedTargeting';
import { GetEditCampaignDisabledTooltipText } from '@utils/campaignBuilder';
import { EmptyRequestStateType } from '@utils/zustandUtils';

const TooltipTextMapping: Record<string, string> = {
  [FlowTypes.CLONE]: 'Description.CannotChangeExperience',
  [FlowTypes.CREATE]: '',
  [FlowTypes.EDIT]: 'Description.EditDisabledPublished',
};

const maybeGetUniverseFilterThumbnail = (
  universeFilter: UniverseShapeType,
  thumbnailsByUniverseId: Record<number, EmptyRequestStateType<ThumbnailType>>,
) =>
  universeFilter && universeFilter.universe_id !== 0 ? (
    <UniverseFilterAvatar
      src={thumbnailsByUniverseId[universeFilter.universe_id]?.data?.imageUrl}
    />
  ) : null;

interface CreatableUniverseOption extends UniverseShapeType {
  inputValue?: string;
}

interface ExperienceSelectProps {
  advancedTargetingFormMethods: UseFormReturn<AdvancedTargetingFormType>;
}

const ExperienceSelect = ({ advancedTargetingFormMethods }: ExperienceSelectProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { control, getValues, setValue } = useFormContext<FormType>();
  const { fetchInitialAudienceEstimates, flowType, getAudienceEstimate } =
    useCampaignBuilderStore();
  const editMode = flowType === FlowTypes.EDIT;
  const cloneMode = flowType === FlowTypes.CLONE;
  const campaignStatus = useCampaignBuilderStore(
    (state) => state.simplifiedCampaign?.data?.display_status,
  );
  const {
    data: universes,
    isError: fetchUniversesCanAdvertiseIsError,
    isLoading: fetchUniversesCanAdvertiseIsLoading,
  } = useCampaignBuilderStore((state) => state.universesCanAdvertise);

  const isUniverseOwnershipBypassEnabled =
    useAppStore.getState().appMetadataState?.data?.isUniverseOwnershipBypassEnabled ?? false;

  const [pendingUniverseId, setPendingUniverseId] = useState<number | null>(null);
  const [resolutionAttempt, setResolutionAttempt] = useState<number>(0);
  const isInitResolutionRef = useRef<boolean>(false);
  const hasAttemptedInitResolutionRef = useRef<boolean>(false);

  useEffect(() => {
    if (
      hasAttemptedInitResolutionRef.current ||
      !(editMode || cloneMode) ||
      !isUniverseOwnershipBypassEnabled ||
      !universes ||
      fetchUniversesCanAdvertiseIsLoading
    ) {
      return;
    }
    const currentValue = getValues(FormField.EXPERIENCE);
    if (
      currentValue?.universe_id > 0 &&
      !universes.some((u) => u.universe_id === currentValue.universe_id)
    ) {
      hasAttemptedInitResolutionRef.current = true;
      isInitResolutionRef.current = true;
      setPendingUniverseId(currentValue.universe_id);
      setResolutionAttempt((prev) => prev + 1);
    }
  }, [
    editMode,
    cloneMode,
    isUniverseOwnershipBypassEnabled,
    universes,
    fetchUniversesCanAdvertiseIsLoading,
    getValues,
  ]);

  const thumbnailsByUniverseId = useThumbnailStore(
    (state: ThumbnailStoreType) => state.thumbnailsByUniverseId,
  );

  const {
    data: resolvedUniverse,
    isError: isResolutionError,
    isFetching: isResolvingUniverse,
  } = useQuery({
    enabled: isUniverseOwnershipBypassEnabled && pendingUniverseId !== null,
    queryFn: () => getUniverses([pendingUniverseId!]),
    queryKey: ['resolveUniverse', pendingUniverseId, resolutionAttempt],
    retry: false,
    select: (response) => {
      const universe = response.data?.[0];
      if (!universe) {
        return null;
      }
      return {
        privacy_type: PUBLIC_UNIVERSE_PRIVACY_TYPE,
        root_place_id: universe.rootPlaceId,
        universe_id: universe.id,
        universe_name: universe.name,
      } as UniverseShapeType;
    },
  });

  const applyResolvedUniverse = useCallback(
    (universe: UniverseShapeType) => {
      setValue(FormField.EXPERIENCE, universe);
      advancedTargetingFormMethods.setValue(AdvancedTargetingFormField.UNIVERSE, universe);
      useThumbnailStore.getState().getThumbnail(universe.universe_id);
      fetchInitialAudienceEstimates({
        detailedTargetingMatchTypes: AllDetailedTargetingMatchTypes,
        universeId: universe.universe_id,
      });
      ResetAdvancedTargetingForm({
        getAudienceEstimate,
        getValues: advancedTargetingFormMethods.getValues,
        reset: advancedTargetingFormMethods.reset,
        setValue: advancedTargetingFormMethods.setValue,
        trigger: advancedTargetingFormMethods.trigger,
        universe,
      });
    },
    [advancedTargetingFormMethods, fetchInitialAudienceEstimates, getAudienceEstimate, setValue],
  );

  useEffect(() => {
    if (!isUniverseOwnershipBypassEnabled || pendingUniverseId === null || isResolvingUniverse) {
      return;
    }
    if (resolvedUniverse) {
      applyResolvedUniverse(resolvedUniverse);
      setPendingUniverseId(null);
      isInitResolutionRef.current = false;
    } else if (resolvedUniverse === null) {
      if (isInitResolutionRef.current) {
        setValue(FormField.EXPERIENCE, {
          ...experienceNotFoundOption,
          universe_name: translate(experienceNotFoundOption.universe_name),
        });
        logNativeImpressionEvent(EventName.ExperienceNoLongerEligible);
      } else {
        setValue(FormField.EXPERIENCE, {
          ...noExperiencesOption,
          universe_name: translate(noExperiencesOption.universe_name),
        });
      }
      setPendingUniverseId(null);
      isInitResolutionRef.current = false;
    } else if (isResolutionError) {
      if (!isInitResolutionRef.current) {
        setValue(FormField.EXPERIENCE, {
          ...noExperiencesOption,
          universe_name: translate(noExperiencesOption.universe_name),
        });
      }
      isInitResolutionRef.current = false;
    }
  }, [
    resolvedUniverse,
    isResolvingUniverse,
    isResolutionError,
    isUniverseOwnershipBypassEnabled,
    applyResolvedUniverse,
    pendingUniverseId,
    setValue,
    translate,
  ]);

  const isUniverseNotFound =
    !isResolvingUniverse &&
    !isResolutionError &&
    resolvedUniverse === null &&
    pendingUniverseId !== null;

  const getResolutionHelperText = (): string => {
    if (!isUniverseOwnershipBypassEnabled || pendingUniverseId === null) {
      return '';
    }
    if (isResolvingUniverse) {
      return translate('Description.ResolvingUniverse');
    }
    if (isResolutionError) {
      return translate('Description.UnableToVerifyUniverse');
    }
    if (isUniverseNotFound) {
      return translate('Description.UniverseNotFound');
    }
    return '';
  };

  const isResolutionErrorState =
    isUniverseOwnershipBypassEnabled && (isResolutionError || isUniverseNotFound);

  const GetTooltipText = () => {
    if (fetchUniversesCanAdvertiseIsError) {
      return translate('Description.TryReloading');
    }
    const editCampaignDisabledTooltip = GetEditCampaignDisabledTooltipText(
      flowType,
      campaignStatus,
    );
    if (editCampaignDisabledTooltip) {
      return translate(editCampaignDisabledTooltip);
    }
    const text = TooltipTextMapping[flowType ?? FlowTypes.CREATE];
    return text ? translate(text) : '';
  };

  return (
    <Controller
      control={control}
      name={FormField.EXPERIENCE}
      render={({ field: { onChange, value, ...rest } }) => (
        <Tooltip placement='top-start' title={GetTooltipText()}>
          <Autocomplete
            {...rest}
            {...(isUniverseOwnershipBypassEnabled && {
              clearOnBlur: true,
              handleHomeEndKeys: true,
              selectOnFocus: true,
            })}
            data-testid='experience-autocomplete'
            disableClearable
            disabled={
              fetchUniversesCanAdvertiseIsError ||
              fetchUniversesCanAdvertiseIsLoading ||
              editMode ||
              cloneMode
            }
            filterOptions={(options, params) => {
              const inputLower = params.inputValue.toLowerCase();
              const filtered = options.filter((option) =>
                option.universe_name.toLowerCase().includes(inputLower),
              );
              const trimmed = params.inputValue.trim();
              if (
                isUniverseOwnershipBypassEnabled &&
                trimmed &&
                /^\d+$/.test(trimmed) &&
                Number(trimmed) > 0
              ) {
                filtered.push({
                  inputValue: trimmed,
                  privacy_type: '',
                  root_place_id: 0,
                  universe_id: 0,
                  universe_name: translate('Action.AddUniverseId', {
                    universeId: trimmed,
                  }),
                } as UniverseShapeType);
              }
              return filtered;
            }}
            freeSolo={isUniverseOwnershipBypassEnabled}
            getOptionLabel={(option) => {
              if (typeof option === 'string') {
                return option;
              }
              return option.universe_name;
            }}
            id='universe-filter-picker'
            onChange={(_event, universeObj) => {
              if (!universeObj || typeof universeObj === 'string') {
                return;
              }

              const creatableOption = universeObj as CreatableUniverseOption;
              if (creatableOption.inputValue) {
                const targetId = Number(creatableOption.inputValue);
                setResolutionAttempt((prev) => prev + 1);
                setPendingUniverseId(targetId);
                onChange({
                  privacy_type: '',
                  root_place_id: 0,
                  universe_id: targetId,
                  universe_name: creatableOption.inputValue,
                } as UniverseShapeType);
                return;
              }

              setPendingUniverseId(null);

              const chosenOptionIndex = universes.findIndex(
                (universe) => universe.universe_id === universeObj.universe_id,
              );

              logNativeClickEvent(EventName.ExperienceChanged, {
                chosenOptionPosition: chosenOptionIndex.toString(),
                flowType,
                optionsLength: universes.length.toString(),
                previousValue: value.universe_id.toString(),
                value: universeObj.universe_id.toString(),
              });

              if (value.universe_id === universeObj.universe_id) {
                return;
              }

              onChange(universeObj);

              advancedTargetingFormMethods.setValue(
                AdvancedTargetingFormField.UNIVERSE,
                universeObj as UniverseShapeType,
              );
              fetchInitialAudienceEstimates({
                detailedTargetingMatchTypes: AllDetailedTargetingMatchTypes,
                universeId: universeObj.universe_id,
              });
              ResetAdvancedTargetingForm({
                getAudienceEstimate,
                getValues: advancedTargetingFormMethods.getValues,
                reset: advancedTargetingFormMethods.reset,
                setValue: advancedTargetingFormMethods.setValue,
                trigger: advancedTargetingFormMethods.trigger,
                universe: universeObj as UniverseShapeType,
              });
            }}
            options={universes}
            renderInput={(params) => {
              const resolutionHelperText = getResolutionHelperText();
              const hasError = fetchUniversesCanAdvertiseIsError || isResolutionErrorState;
              const helperText = fetchUniversesCanAdvertiseIsError
                ? translate('Description.FailedToFetch')
                : resolutionHelperText;

              return (
                <FormControl error={hasError} fullWidth variant='outlined'>
                  <TextField
                    helperText={helperText}
                    {...params}
                    error={hasError}
                    FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                    InputLabelProps={INPUT_LABEL_PROPS}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isUniverseOwnershipBypassEnabled && isResolvingUniverse && (
                            <ProgressCircle
                              ariaLabel={translateMisc('Label.Loading')}
                              size='Small'
                              variant='Indeterminate'
                            />
                          )}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                      startAdornment: maybeGetUniverseFilterThumbnail(
                        value as UniverseShapeType,
                        thumbnailsByUniverseId,
                      ),
                      style: {
                        height: '54px',
                        paddingTop: '9px',
                      },
                    }}
                    label={translate('Heading.Experience')}
                  />
                </FormControl>
              );
            }}
            value={value}
          />
        </Tooltip>
      )}
    />
  );
};

export default ExperienceSelect;
