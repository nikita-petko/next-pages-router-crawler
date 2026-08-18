import { Autocomplete, AutocompleteOption, ProgressCircle } from '@rbx/foundation-ui';
import { useQuery } from '@tanstack/react-query';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext, UseFormReturn, useWatch } from 'react-hook-form';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AppTooltip from '@components/common/AppTooltip';
import UniverseFilterAvatar from '@components/common/UniverseFilterAvatar';
import { FormField as AdvancedTargetingFormField } from '@constants/advancedTargeting';
import {
  AllDetailedTargetingMatchTypes,
  experienceNotFoundOption,
  FlowTypes,
  FormField,
  noExperiencesOption,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import { PUBLIC_UNIVERSE_PRIVACY_TYPE } from '@constants/universeConstants';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useWorkspaceUniverseMemory from '@hooks/useWorkspaceUniverseMemory';
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
  universeFilter: Pick<UniverseShapeType, 'universe_id'>,
  thumbnailsByUniverseId: Record<number, EmptyRequestStateType<ThumbnailType>>,
) =>
  universeFilter && universeFilter.universe_id !== 0 ? (
    <UniverseFilterAvatar
      src={thumbnailsByUniverseId[universeFilter.universe_id]?.data?.imageUrl}
    />
  ) : undefined;

interface ExperienceSelectProps {
  advancedTargetingFormMethods: UseFormReturn<AdvancedTargetingFormType>;
}

const ExperienceSelect = ({ advancedTargetingFormMethods }: ExperienceSelectProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const { control, getValues, setValue } = useFormContext<FormType>();
  const { rememberUniverseId } = useWorkspaceUniverseMemory();
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
  const hasEligibleUniverses = universes.length > 0;
  const noEligibleUniverseOption: UniverseShapeType = useMemo(
    () => ({
      ...noExperiencesOption,
      privacy_type: '',
      root_place_id: 0,
      universe_name: translate(noExperiencesOption.universe_name),
    }),
    [translate],
  );
  const universeOptions = hasEligibleUniverses ? universes : [noEligibleUniverseOption];

  const experienceValue = useWatch<FormType, typeof FormField.EXPERIENCE>({
    control,
    name: FormField.EXPERIENCE,
  });
  const selectedUniverse = hasEligibleUniverses ? experienceValue : noEligibleUniverseOption;

  const [inputValue, setInputValue] = useState<string>(selectedUniverse.universe_name);

  // Resync the text whenever the selection changes outside the field (universes
  // finishing loading, a bypass id resolving) so a stale name is never shown.
  useEffect(() => {
    setInputValue(selectedUniverse.universe_name);
  }, [selectedUniverse.universe_id, selectedUniverse.universe_name]);

  // MUI filtered options internally from `getOptionLabel`; Foundation expects the
  // caller to render the filtered set. Text equal to the current selection shows
  // the full list so clicking into the field does not narrow it to one row.
  const trimmedInput = inputValue.trim();
  const query = trimmedInput.toLocaleLowerCase();
  const visibleOptions =
    !query || query === selectedUniverse.universe_name.toLocaleLowerCase()
      ? universeOptions
      : universeOptions.filter((option) =>
          option.universe_name.toLocaleLowerCase().includes(query),
        );

  // Foundation's Autocomplete has no `freeSolo`, so the "advertise a universe you
  // do not own" affordance is a consumer-rendered extra option: a positive
  // integer that is not already an eligible universe becomes a selectable row
  // whose value is the typed id, routed into the resolution flow on select.
  const creatableUniverseId =
    isUniverseOwnershipBypassEnabled &&
    /^\d+$/.test(trimmedInput) &&
    Number(trimmedInput) > 0 &&
    !universeOptions.some((option) => String(option.universe_id) === trimmedInput)
      ? trimmedInput
      : undefined;

  const optionNodes: ReactNode[] = visibleOptions.map((option) => (
    <AutocompleteOption
      key={option.universe_id}
      leading={maybeGetUniverseFilterThumbnail(option, thumbnailsByUniverseId)}
      title={option.universe_name}
      value={String(option.universe_id)}
    />
  ));
  if (creatableUniverseId) {
    optionNodes.push(
      <AutocompleteOption
        key={`add-universe-${creatableUniverseId}`}
        title={translate('Action.AddUniverseId', { universeId: creatableUniverseId })}
        value={creatableUniverseId}
      />,
    );
  }

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

  const hasFieldError = fetchUniversesCanAdvertiseIsError || isResolutionErrorState;
  const fieldMessage = fetchUniversesCanAdvertiseIsError
    ? translate('Description.FailedToFetch')
    : getResolutionHelperText();

  return (
    <Controller
      control={control}
      name={FormField.EXPERIENCE}
      render={({ field: { onChange } }) => (
        <AppTooltip title={GetTooltipText()}>
          <div className='width-full'>
            <Autocomplete
              data-testid='experience-autocomplete'
              error={hasFieldError ? fieldMessage : undefined}
              hasError={hasFieldError}
              helperText={hasFieldError ? undefined : fieldMessage || undefined}
              inputValue={inputValue}
              isDisabled={
                fetchUniversesCanAdvertiseIsError ||
                fetchUniversesCanAdvertiseIsLoading ||
                !hasEligibleUniverses ||
                editMode ||
                cloneMode
              }
              label={translate('Heading.Experience')}
              leadingIconNode={
                isUniverseOwnershipBypassEnabled && isResolvingUniverse ? (
                  <ProgressCircle
                    ariaLabel={translateMisc('Label.Loading')}
                    size='Small'
                    variant='Indeterminate'
                  />
                ) : (
                  maybeGetUniverseFilterThumbnail(selectedUniverse, thumbnailsByUniverseId)
                )
              }
              // Foundation keeps edited text on blur, so restore the selected name
              // when the user typed without picking an option.
              onBlur={() => setInputValue(selectedUniverse.universe_name)}
              onInputValueChange={setInputValue}
              onValueChange={(nextValue) => {
                if (!nextValue) {
                  return;
                }

                const universeObj = universeOptions.find(
                  (option) => String(option.universe_id) === nextValue,
                );

                // Anything that is not an eligible universe came from the
                // consumer-rendered "add universe id" row.
                if (!universeObj) {
                  const targetId = Number(nextValue);
                  setResolutionAttempt((prev) => prev + 1);
                  setPendingUniverseId(targetId);
                  onChange({
                    privacy_type: '',
                    root_place_id: 0,
                    universe_id: targetId,
                    universe_name: nextValue,
                  } as UniverseShapeType);
                  return;
                }

                setPendingUniverseId(null);
                setInputValue(universeObj.universe_name);
                rememberUniverseId(universeObj.universe_id);

                const chosenOptionIndex = universes.findIndex(
                  (universe) => universe.universe_id === universeObj.universe_id,
                );

                logNativeClickEvent(EventName.ExperienceChanged, {
                  chosenOptionPosition: chosenOptionIndex.toString(),
                  flowType,
                  optionsLength: universes.length.toString(),
                  previousValue: selectedUniverse.universe_id.toString(),
                  value: universeObj.universe_id.toString(),
                });

                if (selectedUniverse.universe_id === universeObj.universe_id) {
                  return;
                }

                onChange(universeObj);

                advancedTargetingFormMethods.setValue(
                  AdvancedTargetingFormField.UNIVERSE,
                  universeObj,
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
                  universe: universeObj,
                });
              }}
              size='Medium'
              value={String(selectedUniverse.universe_id)}>
              {optionNodes}
            </Autocomplete>
          </div>
        </AppTooltip>
      )}
    />
  );
};

export default ExperienceSelect;
