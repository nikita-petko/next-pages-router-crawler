import {
  Autocomplete,
  AutocompleteOption,
  Button,
  IconButton,
  Link,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  TextArea,
  TextInput,
} from '@rbx/foundation-ui';
import { Alert } from '@rbx/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import AppTooltip from '@components/common/AppTooltip';
import useDrawerStyles from '@components/common/Drawer.styles';
import GenericSnackBar from '@components/common/GenericSnackBar';
import { FlowTypes, FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { validateUniverseText } from '@services/ads/campaignBuilderService';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { GetSitetestBaseUrl, GetUrlWithParams } from '@utils/url';

const API_ERROR_TYPE = 'api';
const LAUNCH_DATA_VALIDATION_DEBOUNCE_MS = 500;

const AdvancedJoinOptionsDrawer = () => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: { drawerSection, inlineRow },
  } = useDrawerStyles();

  const {
    advancedJoinDrawerOpen,
    flowType,
    getPlaces,
    placesByUniverseId,
    setAdvancedJoinDrawerOpen,
  } = useCampaignBuilderStore();

  const editMode = flowType === FlowTypes.EDIT;
  const { clearErrors, control, formState, setError, setValue } = useFormContext<FormType>();

  const clearApiError = useCallback(() => {
    if (formState.errors[FormField.LAUNCH_DATA]?.type === API_ERROR_TYPE) {
      clearErrors(FormField.LAUNCH_DATA);
    }
  }, [clearErrors, formState.errors]);

  const experience = useWatch<FormType, typeof FormField.EXPERIENCE>({
    name: FormField.EXPERIENCE,
  });
  const placeIdOverride = useWatch<FormType, typeof FormField.PLACE_ID_OVERRIDE>({
    name: FormField.PLACE_ID_OVERRIDE,
  });
  const launchData = useWatch<FormType, typeof FormField.LAUNCH_DATA>({
    name: FormField.LAUNCH_DATA,
  });

  const places = useMemo(
    () => placesByUniverseId[experience?.universe_id]?.data?.places || [],
    [placesByUniverseId, experience?.universe_id],
  );
  const placesLoading = placesByUniverseId[experience?.universe_id]?.isLoading ?? false;

  useEffect(() => {
    if (experience?.universe_id && experience.universe_id !== 0) {
      getPlaces(experience.universe_id);
    }
  }, [experience?.universe_id, getPlaces]);

  const launchDataCacheRef = useRef<{ isValid: boolean; value: string } | null>(null);

  useEffect(() => {
    if (editMode) {
      return undefined;
    }

    if (!launchData) {
      clearApiError();
      return undefined;
    }

    const cached = launchDataCacheRef.current;
    if (cached && cached.value === launchData) {
      if (!cached.isValid) {
        setError(FormField.LAUNCH_DATA, {
          message: translate('Validation.LaunchDataRejected'),
          type: API_ERROR_TYPE,
        });
      } else {
        clearApiError();
      }
      return undefined;
    }

    let cancelled = false;
    const timeoutId = setTimeout(async () => {
      try {
        const { is_valid } = await validateUniverseText(launchData);
        if (cancelled) {
          return;
        }
        launchDataCacheRef.current = { isValid: is_valid, value: launchData };
        if (!is_valid) {
          setError(FormField.LAUNCH_DATA, {
            message: translate('Validation.LaunchDataRejected'),
            type: API_ERROR_TYPE,
          });
        } else {
          clearApiError();
        }
      } catch {
        // Leave field without error on network failure
      }
    }, LAUNCH_DATA_VALIDATION_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [editMode, launchData, setError, clearApiError, translate]);

  const rootPlaceId = useMemo(() => places.find((p) => p.is_root_place)?.place_id, [places]);

  const selectedPlace = useMemo(
    () => places.find((p) => p.place_id === placeIdOverride),
    [places, placeIdOverride],
  );
  const [placeInputValue, setPlaceInputValue] = useState<string>(selectedPlace?.place_name ?? '');

  // Resync the text when the override changes outside the field (places finishing
  // loading, "Reset all") so a stale place name is never shown.
  useEffect(() => {
    setPlaceInputValue(selectedPlace?.place_name ?? '');
  }, [selectedPlace?.place_id, selectedPlace?.place_name]);

  // MUI filtered options internally from `getOptionLabel`; Foundation expects the
  // caller to render the filtered set. Text equal to the current selection shows
  // the full list so clicking into the field does not narrow it to one row.
  const placeQuery = placeInputValue.trim().toLocaleLowerCase();
  const visiblePlaces =
    !placeQuery || placeQuery === (selectedPlace?.place_name ?? '').toLocaleLowerCase()
      ? places
      : places.filter((p) => p.place_name.toLocaleLowerCase().includes(placeQuery));

  const launchUrl = useMemo(() => {
    const base = `https://www.${GetSitetestBaseUrl()}`;
    const placeIdForUrl = placeIdOverride ?? rootPlaceId;
    const pathSegment = placeIdForUrl ? `/games/${placeIdForUrl}` : '/games';

    return GetUrlWithParams(`${base}${pathSegment}`, {
      launchData: launchData || undefined,
      placeIdOverride: placeIdOverride ? String(placeIdOverride) : undefined,
    });
  }, [launchData, placeIdOverride, rootPlaceId]);

  const [showCopySuccess, setShowCopySuccess] = useState<boolean>(false);
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(launchUrl);
      setShowCopySuccess(true);
    } catch {
      // Clipboard write failed (e.g. permission denied)
    }
  };

  const handleResetAll = useCallback(() => {
    setValue(FormField.PLACE_ID_OVERRIDE, undefined, { shouldDirty: true });
    setValue(FormField.LAUNCH_DATA, undefined, { shouldDirty: true });
    clearErrors(FormField.LAUNCH_DATA);
    launchDataCacheRef.current = null;
  }, [setValue, clearErrors]);

  const hasCustomSettings = !!placeIdOverride || !!launchData;
  const [warningDismissed, setWarningDismissed] = useState<boolean>(false);

  return (
    <SheetRoot
      onOpenChange={(open) => {
        if (!open) {
          setAdvancedJoinDrawerOpen(false);
        }
      }}
      open={advancedJoinDrawerOpen}>
      <SheetContent
        closeLabel={translate('Description.CloseAdvancedJoinDrawer')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'>
        <SheetTitle>{translate('Heading.AdvancedJoinOptions')}</SheetTitle>
        <SheetBody className='flex flex-col gap-xxlarge'>
          <span className='text-body-large content-default'>
            {translateHTML('Description.AdvancedJoinOptions', [
              {
                closing: 'linkEnd',
                content: (chunks) => (
                  <Link
                    href={`https://create.${GetSitetestBaseUrl()}/docs/production/promotion/ads-manager#advanced-join-options`}
                    target='_blank'>
                    {chunks}
                  </Link>
                ),
                opening: 'linkStart',
              },
            ])}
          </span>
          {!warningDismissed && (
            <Alert onClose={() => setWarningDismissed(true)} severity='warning' variant='standard'>
              {translate('Message.CodeSetupRequired')}
            </Alert>
          )}
          <div className={drawerSection}>
            <Controller
              control={control}
              name={FormField.PLACE_ID_OVERRIDE}
              render={({ field }) => (
                <div className='flex flex-col gap-small'>
                  <Autocomplete
                    data-testid='place-override-autocomplete'
                    emptyState={placesLoading ? translateMisc('Label.Loading') : undefined}
                    inputValue={placeInputValue}
                    isDisabled={editMode}
                    label={translate('Label.StartPlace')}
                    // Foundation keeps edited text on blur, so restore the selected
                    // place name when the user typed without picking an option.
                    onBlur={() => setPlaceInputValue(selectedPlace?.place_name ?? '')}
                    onInputValueChange={setPlaceInputValue}
                    onValueChange={(nextValue) => {
                      const place = places.find((p) => String(p.place_id) === nextValue);
                      if (!place) {
                        return;
                      }
                      field.onChange(place.place_id);
                      setPlaceInputValue(place.place_name);
                    }}
                    size='Medium'
                    value={selectedPlace ? String(selectedPlace.place_id) : undefined}>
                    {visiblePlaces.map((place) => (
                      <AutocompleteOption
                        key={place.place_id}
                        title={place.place_name}
                        value={String(place.place_id)}
                      />
                    ))}
                  </Autocomplete>
                  <span className='text-caption-small content-default'>
                    {translateHTML('Description.CheckAccessSettings', [
                      {
                        closing: 'linkEnd',
                        content: (chunks) => (
                          <Link
                            href={`https://create.${GetSitetestBaseUrl()}/dashboard/creations/experiences/${experience?.universe_id}/places`}
                            target='_blank'>
                            {chunks}
                          </Link>
                        ),
                        opening: 'linkStart',
                      },
                    ])}
                  </span>
                </div>
              )}
            />
            <Controller
              control={control}
              name={FormField.LAUNCH_DATA}
              render={({ field, fieldState: { error } }) => (
                <TextArea
                  {...field}
                  data-testid='launch-data-input'
                  hasError={!!error}
                  helperText={
                    error?.message
                      ? error.message
                      : translateHTML('Description.LaunchDataRequiresScript', [
                          {
                            closing: 'linkEnd',
                            content: (chunks) => (
                              <Link
                                href={`https://create.${GetSitetestBaseUrl()}/docs/production/promotion/ads-manager#advanced-join-options`}
                                target='_blank'>
                                {chunks}
                              </Link>
                            ),
                            opening: 'linkStart',
                          },
                        ])
                  }
                  id='launch-data-input'
                  isDisabled={editMode}
                  label={translate('Label.LaunchDataParameters')}
                  rows={3}
                  size='Medium'
                  value={field.value ?? ''}
                />
              )}
            />
            <div className={inlineRow}>
              <TextInput
                helperText={translate('Description.LaunchUrlHelper')}
                id='launch-url'
                isDisabled
                label={translate('Label.LaunchUrl')}
                readOnly
                size='Medium'
                value={launchUrl}
              />
              <AppTooltip position='top-center' title={translate('Action.CopyUrlToClipboard')}>
                <IconButton
                  ariaLabel={translate('Action.CopyUrlToClipboard')}
                  className='grow-0 shrink-0 margin-top-small'
                  data-testid='copy-launch-url'
                  icon='icon-regular-two-stacked-squares'
                  onClick={handleCopyUrl}
                  variant='Utility'
                />
              </AppTooltip>
            </div>
          </div>
        </SheetBody>
        <SheetActions>
          <Button
            data-testid='reset-all-advanced-join'
            isDisabled={!hasCustomSettings || editMode}
            onClick={handleResetAll}
            size='Medium'
            variant='Standard'>
            {translate('Action.ResetAll')}
          </Button>
        </SheetActions>
        {showCopySuccess && (
          <GenericSnackBar
            message={translate('Message.UrlCopied')}
            onClose={() => setShowCopySuccess(false)}
            severity='success'
          />
        )}
      </SheetContent>
    </SheetRoot>
  );
};

export default AdvancedJoinOptionsDrawer;
