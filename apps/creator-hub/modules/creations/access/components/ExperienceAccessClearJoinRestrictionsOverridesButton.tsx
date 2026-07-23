/* oxlint-disable react/react-compiler -- dialog callbacks include exhaustive dependencies; compiler flags the stable dialog close callback as extra */
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { Button, DialogTemplate, useDialog } from '@rbx/ui';
import universesClient from '@modules/clients/universes';
import { toast } from '@modules/monetization-shared/snackbar/actions';

type Props = {
  universeId: number;
  isSpecificJoinToNonRootPlacesAllowed: boolean;
  handleClear: () => void;
};

function ExperienceAccessClearJoinRestrictionsOverridesButton({
  universeId,
  isSpecificJoinToNonRootPlacesAllowed,
  handleClear,
}: Props) {
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const { open, close: closeDialog, configure } = useDialog();
  const { translate } = useTranslation();

  const handleClearJoinRestrictionsOverrides = useCallback(async () => {
    setIsClearing(true);
    try {
      await universesClient.clearJoinRestrictionsOverrides({ universeId });
      toast({ title: translate('Message.ClearJoinRestrictionsOverridesSuccess') });
      handleClear();
    } catch {
      toast({ title: translate('Message.ClearJoinRestrictionsOverridesError') });
    } finally {
      setIsClearing(false);
      closeDialog();
    }
  }, [universeId, translate, handleClear, closeDialog]);

  const confirmClearJoinRestrictionsOverrides = useMemo(
    () => (
      <DialogTemplate
        color='destructive'
        onConfirm={handleClearJoinRestrictionsOverrides}
        onCancel={closeDialog}
        title={translate('Title.ClearJoinRestrictionOverrides')}
        content={translate(
          isSpecificJoinToNonRootPlacesAllowed
            ? 'Description.ClearJoinRestrictionsOverridesAllowAccessDialog'
            : 'Description.ClearJoinRestrictionsOverridesRemoveAccessDialog',
        )}
        confirmText={translate('Action.ConfirmReset')}
        cancelText={translate('Action.Cancel')}
        loading={isClearing}
      />
    ),
    [
      isClearing,
      handleClearJoinRestrictionsOverrides,
      closeDialog,
      translate,
      isSpecificJoinToNonRootPlacesAllowed,
    ],
  );

  const handleOpenDialog = useCallback(() => {
    configure(confirmClearJoinRestrictionsOverrides);
    open();
  }, [configure, confirmClearJoinRestrictionsOverrides, open]);

  return (
    <Button size='small' onClick={handleOpenDialog}>
      {translate('Action.Reset')}
    </Button>
  );
}

export default ExperienceAccessClearJoinRestrictionsOverridesButton;
