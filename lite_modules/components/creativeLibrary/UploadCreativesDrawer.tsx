import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { useQueryClient } from '@tanstack/react-query';
import { type FC, useCallback, useEffect, useState } from 'react';

import CreativeUploadTab, {
  type CreativeUploadFooterActions,
  CreativeUploadFooterActionsContent,
} from '@components/common/creative/CreativeUploadTab';
import GameUniverseDropdown, {
  NO_GAME_DROPDOWN_VALUE,
} from '@components/common/creative/GameUniverseDropdown';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useUniverseOptionsForAdCreation from '@hooks/useUniverseOptionsForAdCreation';
import { useAppStore } from '@stores/appStoreProvider';
import { type AppStoreStateType } from '@type/appStore';

interface UploadCreativesDrawerProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

// Library-page Add Creatives drawer: composes CreativeUploadTab inside the
// Foundation Sheet shell.
const UploadCreativesDrawer: FC<UploadCreativesDrawerProps> = ({ onOpenChange, open }) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const queryClient = useQueryClient();
  // Scopes the post-upload cache invalidation to the Library page's
  // getAdCreatives query key so we don't invalidate every account.
  const adAccountId = useAppStore((state: AppStoreStateType) => state.appData.adAccountInfo?.id);

  // Mirrors CreativeUploadTab's batch lifecycle so we can gate Esc on
  // actual in-flight work without leaking through a global store.
  const [isUploadBatchInProgress, setIsUploadBatchInProgress] = useState<boolean>(false);
  const [uploadFooterActions, setUploadFooterActions] =
    useState<CreativeUploadFooterActions | null>(null);

  // Reset to "No game" each open so prior picks don't bleed across sessions.
  const [selectedUniverseId, setSelectedUniverseId] = useState<string>(NO_GAME_DROPDOWN_VALUE);
  useEffect(() => {
    if (open) {
      setSelectedUniverseId(NO_GAME_DROPDOWN_VALUE);
    }
  }, [open]);

  const { groupId, universeOptions: advertisableUniverses } = useUniverseOptionsForAdCreation();

  const handleClose = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // CreativeUploadTab owns the registration call; this is purely cache
  // invalidation so just-registered assets appear in the grid.
  const handleRegistered = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['adCreatives', adAccountId] });
    onOpenChange(false);
  }, [adAccountId, onOpenChange, queryClient]);

  const universeIdForUpload =
    selectedUniverseId === NO_GAME_DROPDOWN_VALUE ? undefined : Number(selectedUniverseId);

  return (
    <SheetRoot onOpenChange={onOpenChange} open={open}>
      <SheetContent
        closeLabel={translate('Action.Close')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'
        // Block outside clicks so a stray click can't lose drawer state.
        // Esc is only blocked while a batch upload is in flight (a11y:
        // Esc-to-dismiss is the keyboard-user expectation otherwise).
        onEscapeKeyDown={(e) => {
          if (isUploadBatchInProgress) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}>
        <SheetTitle>{translate('Heading.AddAssets')}</SheetTitle>
        <SheetBody>
          <CreativeUploadTab
            assetSource='AD_CREATIVE_ASSET_SOURCE_UPLOAD'
            autoUploadOnSelect
            deferredAddActionLabelKey='Action.AddAssets'
            gameDropdown={
              <GameUniverseDropdown
                advertisableUniverses={advertisableUniverses}
                hint={translate('Description.AssetsAssignedToGame')}
                label={translate('Label.GameOptional')}
                onValueChange={setSelectedUniverseId}
                placeholder={translate('Label.SelectAGame')}
                staticOptions={[{ label: translate('Label.None'), value: NO_GAME_DROPDOWN_VALUE }]}
                value={selectedUniverseId}
              />
            }
            groupId={groupId}
            onBatchInProgressChange={setIsUploadBatchInProgress}
            onFooterActionsChange={setUploadFooterActions}
            onRegistered={handleRegistered}
            registerOnAdd
            universeId={universeIdForUpload}
          />
        </SheetBody>
        <SheetActions className='flex flex-row wrap items-center gap-small'>
          {uploadFooterActions != null ? (
            <CreativeUploadFooterActionsContent actions={uploadFooterActions} />
          ) : null}
          <Button onClick={handleClose} size='Medium' variant='Standard'>
            {translate('Action.Close')}
          </Button>
        </SheetActions>
      </SheetContent>
    </SheetRoot>
  );
};

export default UploadCreativesDrawer;
