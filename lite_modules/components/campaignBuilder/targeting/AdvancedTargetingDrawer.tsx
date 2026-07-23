import {
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
} from '@rbx/foundation-ui';
import { Alert } from '@rbx/ui';
import { useRef } from 'react';
import { useFormContext } from 'react-hook-form';

import { EventName, logNativeClickEvent } from '@clients/unifiedLogger';
import AdvancedTargetingAudienceSection from '@components/campaignBuilder/targeting/AdvancedTargetingAudienceSection';
import useDrawerStyles from '@components/common/Drawer.styles';
import { FlowTypes } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType as AdvancedTargetingFormType } from '@hooks/campaignBuilder/advancedTargetingFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useCampaignBuilderStore } from '@stores/campaignBuilderStoreProvider';
import { HaveFormValuesChanged, ResetForm } from '@utils/advancedTargeting';

const AdvancedTargetingDrawer = () => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const {
    classes: { educationText },
  } = useDrawerStyles();

  const { advancedTargetingDrawerOpen, getAudienceEstimate, setAdvancedTargetingDrawerOpen } =
    useCampaignBuilderStore();

  const editMode = useCampaignBuilderStore((state) => state.flowType === FlowTypes.EDIT);

  const { getValues, reset, setValue, trigger } = useFormContext<AdvancedTargetingFormType>();

  // onOpenChange fires for every dismissal path, so we can't tell backdrop /
  // Escape from the X affordance there. Capture the reason from Radix's
  // dismiss callbacks first to preserve the legacy analytics distinction
  // (outside-click / Escape => 'outside', close affordance => 'closeButton').
  const closeLocationRef = useRef<'closeButton' | 'outside'>('closeButton');

  const maybeRenderResetButton = () => {
    if (editMode) {
      return null;
    }
    return (
      <Button
        isDisabled={!HaveFormValuesChanged(getValues)}
        onClick={() => {
          logNativeClickEvent(EventName.ResetAdvancedTargeting, {
            location: 'drawerFooter',
          });
          ResetForm({
            getAudienceEstimate,
            getValues,
            reset,
            setValue,
            trigger,
          });
        }}
        size='Medium'
        variant='Emphasis'>
        {translate('Action.ResetAll')}
      </Button>
    );
  };

  const maybeRenderEducationBanner = () => {
    if (editMode) {
      return null;
    }
    return (
      <Alert data-testid='educationWarning' severity='warning'>
        <span className={`text-body-large ${educationText}`} data-testid='educationWarningHeader'>
          {translate('Description.TargetingWarning')}
        </span>
      </Alert>
    );
  };

  return (
    <SheetRoot
      onOpenChange={(open) => {
        if (!open) {
          logNativeClickEvent(EventName.AdvancedTargetingDrawerClosed, {
            location: closeLocationRef.current,
          });
          closeLocationRef.current = 'closeButton';
          setAdvancedTargetingDrawerOpen(false);
        }
      }}
      open={advancedTargetingDrawerOpen}>
      <SheetContent
        closeLabel={translate('Description.CloseTargetingDrawer')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'
        onEscapeKeyDown={() => {
          closeLocationRef.current = 'outside';
        }}
        onInteractOutside={() => {
          closeLocationRef.current = 'outside';
        }}>
        <SheetTitle>{translate('Heading.AudienceTargeting')}</SheetTitle>
        <SheetBody className='flex flex-col gap-xxlarge'>
          {maybeRenderEducationBanner()}
          <AdvancedTargetingAudienceSection />
        </SheetBody>
        {!editMode && <SheetActions>{maybeRenderResetButton()}</SheetActions>}
      </SheetContent>
    </SheetRoot>
  );
};

export default AdvancedTargetingDrawer;
