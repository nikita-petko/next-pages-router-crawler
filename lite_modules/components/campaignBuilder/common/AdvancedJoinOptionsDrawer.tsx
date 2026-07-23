import {
  Button,
  IconButton,
  Link,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { Alert, Autocomplete, TextField, Tooltip } from '@rbx/ui';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import useDrawerStyles from '@components/common/Drawer.styles';
import GenericSnackBar from '@components/common/GenericSnackBar';
import {
  FlowTypes,
  FORM_HELPER_TEXT_PROPS,
  FormField,
  INPUT_LABEL_PROPS,
} from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { validateUniverseText } from '@services/ads/campaignBuilderService';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { Place } from '@type/place';
import { GetSitetestBaseUrl, GetUrlWithParams } from '@utils/url';

const API_ERROR_TYPE = 'api';
const LAUNCH_DATA_VALIDATION_DEBOUNCE_MS = 500;

const AdvancedJoinOptionsDrawer = () => {
  const { translate, translateHTML } = useNamespacedTranslation(TranslationNamespace.Campaign);
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
                    isExternal={false}
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
                <Autocomplete
                  data-testid='place-override-autocomplete'
                  disabled={editMode}
                  // Render the dropdown inside the Sheet (Radix Dialog) instead
                  // of portaling to <body>: the body is inert (pointer-events
                  // none) while the Sheet is open, and a body-portaled popper
                  // counts as an outside interaction that dismisses the Sheet.
                  disablePortal
                  getOptionLabel={(option: Place) => option.place_name}
                  isOptionEqualToValue={(option, val) => option.place_id === val.place_id}
                  loading={placesLoading}
                  onChange={(_, selectedPlace) => field.onChange(selectedPlace?.place_id)}
                  options={places}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                      helperText={translateHTML('Description.CheckAccessSettings', [
                        {
                          closing: 'linkEnd',
                          content: (chunks) => (
                            <Link
                              href={`https://create.${GetSitetestBaseUrl()}/dashboard/creations/experiences/${experience?.universe_id}/places`}
                              isExternal={false}
                              target='_blank'>
                              {chunks}
                            </Link>
                          ),
                          opening: 'linkStart',
                        },
                      ])}
                      InputLabelProps={INPUT_LABEL_PROPS}
                      label={translate('Label.StartPlace')}
                      variant='outlined'
                    />
                  )}
                  value={places.find((p) => p.place_id === field.value) || null}
                />
              )}
            />
            <Controller
              control={control}
              name={FormField.LAUNCH_DATA}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  data-testid='launch-data-input'
                  disabled={editMode}
                  error={!!error}
                  FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                  helperText={
                    error?.message
                      ? error.message
                      : translateHTML('Description.LaunchDataRequiresScript', [
                          {
                            closing: 'linkEnd',
                            content: (chunks) => (
                              <Link
                                href={`https://create.${GetSitetestBaseUrl()}/docs/production/promotion/ads-manager#advanced-join-options`}
                                isExternal={false}
                                target='_blank'>
                                {chunks}
                              </Link>
                            ),
                            opening: 'linkStart',
                          },
                        ])
                  }
                  id='launch-data-input'
                  InputLabelProps={INPUT_LABEL_PROPS}
                  label={translate('Label.LaunchDataParameters')}
                  multiline
                  rows={3}
                  value={field.value ?? ''}
                  variant='outlined'
                />
              )}
            />
            <div className={inlineRow}>
              <TextField
                disabled
                FormHelperTextProps={FORM_HELPER_TEXT_PROPS}
                fullWidth
                helperText={translate('Description.LaunchUrlHelper')}
                id='launch-url'
                InputLabelProps={INPUT_LABEL_PROPS}
                InputProps={{ readOnly: true }}
                label={translate('Label.LaunchUrl')}
                value={launchUrl}
                variant='outlined'
              />
              <Tooltip placement='top' title={translate('Action.CopyUrlToClipboard')}>
                <IconButton
                  ariaLabel={translate('Action.CopyUrlToClipboard')}
                  className='grow-0 shrink-0 margin-top-small'
                  data-testid='copy-launch-url'
                  icon='icon-regular-two-stacked-squares'
                  onClick={handleCopyUrl}
                  variant='Utility'
                />
              </Tooltip>
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
