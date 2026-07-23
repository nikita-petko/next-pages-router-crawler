import { SheetContent, SheetRoot } from '@rbx/foundation-ui';
import { useCallback, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import LogoUploadDrawerContent from '@components/campaignBuilder/common/creative/reachSection/LogoUploadDrawerContent';
import type { CreativeUploadPersistedEntry } from '@components/common/creative/CreativeUploadTab';
import { FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';

interface LogoUploadDrawerProps {
  onClose: () => void;
}

const LogoUploadDrawer = ({ onClose }: LogoUploadDrawerProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);

  const { getValues } = useFormContext<FormType>();

  const setLogoDrawerOpen = useCampaignBuilderStore((state) => state.setLogoDrawerOpen);
  const logoDrawerOpen = useCampaignBuilderStore((state) => state.logoDrawerOpen);
  const isCreativeLibraryRegistrationInProgress = useCampaignBuilderStore(
    (state) => state.isCreativeLibraryRegistrationInProgress,
  );
  const [persistedUploadEntries, setPersistedUploadEntries] = useState<
    CreativeUploadPersistedEntry[]
  >([]);

  // Don't retain uploaded (`complete`) rows across a reopen: a finished upload
  // already lives in the creative library (and is added to the campaign form),
  // so it's viewable there and shouldn't linger in the drawer. Only in-progress
  // rows (staged / failed) are persisted so unfinished work survives a reopen.
  const persistUploadEntries = useCallback((entries: CreativeUploadPersistedEntry[]) => {
    setPersistedUploadEntries(entries.filter((entry) => entry.status !== 'complete'));
  }, []);

  const close = useCallback(() => {
    setLogoDrawerOpen(false, getValues(FormField.EXPERIENCE).universe_id);
    onClose();
  }, [getValues, onClose, setLogoDrawerOpen]);

  return (
    <SheetRoot
      onOpenChange={(open) => {
        if (!open) {
          close();
        }
      }}
      open={logoDrawerOpen}>
      <SheetContent
        closeLabel={translate('Description.CloseLogoDrawer')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'
        // Block outside clicks so a stray click can't lose drawer state.
        // Esc is only blocked while a batch upload is in flight (a11y:
        // Esc-to-dismiss is the keyboard-user expectation otherwise).
        onEscapeKeyDown={(e) => {
          if (isCreativeLibraryRegistrationInProgress) {
            e.preventDefault();
          }
        }}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}>
        <LogoUploadDrawerContent
          onPersistedUploadEntriesChange={persistUploadEntries}
          persistedUploadEntries={persistedUploadEntries}
        />
      </SheetContent>
    </SheetRoot>
  );
};

export default LogoUploadDrawer;
