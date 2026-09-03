import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import CreativeLibrarySheetBody from '@components/campaignBuilder/common/creative/CreativeLibrarySheetBody';
import {
  type CreativeUploadPersistedEntry,
  type RegisteredAsset,
} from '@components/common/creative/CreativeUploadTab';
import { AssetSource, FormField, MAX_LOGO_SELECTIONS } from '@constants/campaignBuilder';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import { useAppStore } from '@stores/appStoreProvider';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { LOGO_ASPECT_RATIO_VALIDATION } from '@utils/creativeFormat';

interface LogoUploadDrawerContentProps {
  onPersistedUploadEntriesChange?: (entries: CreativeUploadPersistedEntry[]) => void;
  persistedUploadEntries?: CreativeUploadPersistedEntry[];
}

const LogoUploadDrawerContent = ({
  onPersistedUploadEntriesChange,
  persistedUploadEntries = [],
}: LogoUploadDrawerContentProps = {}) => {
  const adAccountId = useAppStore((state) => state.appData.adAccountInfo?.id);
  const queryClient = useQueryClient();
  const setLogoDrawerOpen = useCampaignBuilderStore((state) => state.setLogoDrawerOpen);
  const setCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.setCreativeLibraryRegistrationInProgress,
  );
  const logos = useWatch<FormType, typeof FormField.LOGO_ASSETS>({
    name: FormField.LOGO_ASSETS,
  });

  const { getValues, setValue, trigger } = useFormContext<FormType>();

  const selected = logos.filter(({ isSelected }) => isSelected).length;

  // Flagged-path-only: called by CreativeUploadTab after library registration;
  // appends new ids and auto-selects the first one if none selected (Reach
  // allows one logo). Stamp `aspectRatio` from the upload validator — the
  // same field library import reads from GET width/height. Upload never
  // wrote it, so create omitted `logo_asset_aspect_width` for both 2x1
  // and 1x2. A later in-drawer deselect/reselect also cannot recover it:
  // that path only flips `isSelected`, and the library list usually has
  // no dims until a full page refresh.
  const handleNewlyRegisteredLogos = (registered: RegisteredAsset[]) => {
    if (registered.length === 0) {
      return;
    }
    const currentLogos = getValues(FormField.LOGO_ASSETS);
    const existingIds = new Set(currentLogos.map((logo) => logo.assetId));
    const newRegistered = registered.filter(({ assetId }) => !existingIds.has(assetId));
    if (newRegistered.length === 0) {
      return;
    }
    let alreadySelected = currentLogos.some((logo) => logo.isSelected);
    const additions = newRegistered.map(({ aspectRatio, assetId }) => {
      const isSelected = !alreadySelected;
      if (isSelected) {
        alreadySelected = true;
      }
      return {
        ...(aspectRatio != null && { aspectRatio }),
        assetId,
        existing: false,
        isSelected,
        source: AssetSource.ADS_MANAGER,
      };
    });
    setValue(FormField.LOGO_ASSETS, [...currentLogos, ...additions], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    trigger(FormField.LOGO_ASSETS);
    // Bust the shared Creative Library cache so the standalone library
    // page (and any sibling drawer) sees the freshly-registered logos
    // on its next mount instead of serving the pre-upload snapshot.
    if (adAccountId != null) {
      queryClient.invalidateQueries({ queryKey: ['adCreatives', adAccountId] });
    }
  };

  const handleRemoveUploadedLogo = useCallback(
    (assetId: number) => {
      const currentLogos = getValues(FormField.LOGO_ASSETS);
      const nextLogos = currentLogos.filter((logo) => logo.assetId !== assetId);
      if (nextLogos.length === currentLogos.length) {
        return;
      }
      setValue(FormField.LOGO_ASSETS, nextLogos, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      trigger(FormField.LOGO_ASSETS);
    },
    [getValues, setValue, trigger],
  );

  return (
    <CreativeLibrarySheetBody
      // Gate the Upload tab on the same client-side validator the
      // legacy drag-and-drop zone uses (1:1 / 3:1 with shared
      // tolerance). Library imports are already filtered to compatible
      // ratios in `CreativeImportTab`, so the gate only matters on the
      // Upload tab — but it lives on the sheet body since that's
      // where CreativeUploadTab is mounted.
      aspectRatioValidation={LOGO_ASPECT_RATIO_VALIDATION}
      formField={FormField.LOGO_ASSETS}
      isSelectMediaDisabled={selected >= MAX_LOGO_SELECTIONS}
      maxAllowedSelections={MAX_LOGO_SELECTIONS}
      maxUploadFiles={MAX_LOGO_SELECTIONS}
      onClose={() => setLogoDrawerOpen(false, getValues(FormField.EXPERIENCE).universe_id)}
      onPersistedUploadEntriesChange={onPersistedUploadEntriesChange}
      onRegistered={handleNewlyRegisteredLogos}
      onRemoveUploadedAsset={handleRemoveUploadedLogo}
      onUploadInProgressChange={setCreativeLibraryRegistrationInProgress}
      persistedUploadEntries={persistedUploadEntries}
      testIdPrefix='logo'
      universeId={
        // Coerce the "no experience" sentinel (0) to undefined so the
        // upload tab never tags new registrations with universe 0.
        (getValues(FormField.EXPERIENCE)?.universe_id ?? 0) > 0
          ? getValues(FormField.EXPERIENCE)?.universe_id
          : undefined
      }
    />
  );
};

export default LogoUploadDrawerContent;
