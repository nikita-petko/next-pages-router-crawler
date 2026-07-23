import {
  Badge,
  Button,
  SheetActions,
  SheetBody,
  SheetContent,
  SheetRoot,
  SheetTitle,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { useQueryClient } from '@tanstack/react-query';
import { type FC, type ReactNode, useCallback, useEffect, useState } from 'react';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import AiCreateContent, {
  type AiCreateFooterState,
} from '@components/common/creative/AiCreateContent';
import { FOUNDATION_TOOLTIP_BODY_SMALL_CLASS } from '@components/common/creative/tooltipStyles';
import GenericSnackBar from '@components/common/GenericSnackBar';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAppStore } from '@stores/appStoreProvider';
import { type AppStoreStateType } from '@type/appStore';

interface AiCreateDrawerProps {
  /** Campaign builder: scope generation to the campaign experience. */
  fixedUniverseId?: number;
  /** Campaign drawer: max saved creatives the user may add at once. */
  maxCampaignAddCount?: number;
  onAddToCampaign?: (registered: Array<{ assetId: number; file: File }>) => void;
  onBusyChange?: (busy: boolean) => void;
  onOpenChange: (open: boolean) => void;
  onSaved?: (registered: Array<{ assetId: number; file: File }>) => void;
  open: boolean;
  /** Library standalone flow: show the advertisable-universe picker. */
  showGameSelector?: boolean;
}

const AiCreateDrawer: FC<AiCreateDrawerProps> = ({
  fixedUniverseId,
  maxCampaignAddCount,
  onAddToCampaign,
  onBusyChange,
  onOpenChange,
  onSaved,
  open,
  showGameSelector = false,
}) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  // `Label.Beta` is an existing live key in the Campaign namespace (reused from
  // the objective Beta badges); the CreativeLibrary namespace doesn't define it.
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const queryClient = useQueryClient();
  const adAccountId = useAppStore((state: AppStoreStateType) => state.appData.adAccountInfo?.id);
  const isGenAiCreativesEnabled = useAppStore(
    (state: AppStoreStateType) => state.appMetadataState?.data?.isGenAiCreativesEnabled ?? false,
  );
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const [footerState, setFooterState] = useState<AiCreateFooterState | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setIsBusy(false);
      setFooterState(null);
    }
  }, [open]);

  useEffect(() => {
    if (open && !isGenAiCreativesEnabled) {
      onOpenChange(false);
    }
  }, [isGenAiCreativesEnabled, onOpenChange, open]);

  useEffect(() => {
    if (!open) {
      return;
    }
    logNativeImpressionEvent(EventName.AiCreativeDrawerOpened, {
      context: showGameSelector ? 'creative_library' : 'campaign_builder',
    });
  }, [open, showGameSelector]);

  const handleClose = useCallback(() => {
    if (isBusy) {
      return;
    }
    onOpenChange(false);
  }, [isBusy, onOpenChange]);

  const handleBusyChange = useCallback(
    (busy: boolean) => {
      setIsBusy(busy);
      onBusyChange?.(busy);
    },
    [onBusyChange],
  );

  const handleSaved = useCallback(
    (registered: Array<{ assetId: number; file: File }>) => {
      onSaved?.(registered);
      if (adAccountId != null) {
        queryClient.invalidateQueries({ queryKey: ['adCreatives', adAccountId] });
      }
    },
    [adAccountId, onSaved, queryClient],
  );

  const handleRequestClose = useCallback(
    (options?: { showAddedToLibraryToast?: boolean }) => {
      onOpenChange(false);
      if (options?.showAddedToLibraryToast) {
        setToastMessage(translate('Message.AddedToLibrary'));
      }
    },
    [onOpenChange, translate],
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isBusy) {
        return;
      }
      onOpenChange(nextOpen);
    },
    [isBusy, onOpenChange],
  );

  if (!isGenAiCreativesEnabled) {
    return null;
  }

  const addToCampaign = footerState?.addToCampaign;
  let addToCampaignAction: ReactNode = null;
  if (addToCampaign != null) {
    const addToCampaignButton = (
      <Button
        isDisabled={addToCampaign.isDisabled}
        isLoading={addToCampaign.isLoading}
        onClick={addToCampaign.onClick}
        size='Medium'
        variant='Emphasis'>
        {addToCampaign.label}
      </Button>
    );
    // A natively-disabled button swallows pointer events, so wrap it in a span
    // trigger to keep the "limit reached" tooltip hoverable while disabled.
    addToCampaignAction =
      addToCampaign.tooltip != null ? (
        <Tooltip
          contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
          position='top-center'
          title={addToCampaign.tooltip}>
          <TooltipTrigger asChild>
            <span className='flex'>{addToCampaignButton}</span>
          </TooltipTrigger>
        </Tooltip>
      ) : (
        addToCampaignButton
      );
  }

  return (
    <SheetRoot onOpenChange={handleOpenChange} open={open}>
      <SheetContent
        closeLabel={translate('Action.Close')}
        largeScreenClassName='!max-width-[50vw] width-full'
        largeScreenVariant='side'
        onEscapeKeyDown={(event) => {
          if (isBusy) {
            event.preventDefault();
          }
        }}
        onInteractOutside={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}>
        <SheetTitle>
          <span className='flex items-center gap-small'>
            {translate('Heading.AiCreate')}
            <Badge label={translateCampaign('Label.Beta')} />
          </span>
        </SheetTitle>
        <SheetBody>
          {open ? (
            <AiCreateContent
              fixedUniverseId={fixedUniverseId}
              maxCampaignAddCount={maxCampaignAddCount}
              onAddToCampaign={onAddToCampaign}
              onBusyChange={handleBusyChange}
              onFooterStateChange={setFooterState}
              onRequestClose={handleRequestClose}
              onSaved={handleSaved}
              showGameSelector={showGameSelector}
            />
          ) : null}
        </SheetBody>
        <SheetActions className='relative z-10 bg-surface-100 flex flex-row wrap items-center gap-medium'>
          {footerState != null ? (
            <>
              {footerState.saveErrorMessage != null ? (
                <p
                  className='text-body-small content-system-alert margin-[0px] width-full'
                  role='alert'>
                  {footerState.saveErrorMessage}
                </p>
              ) : null}
              {addToCampaignAction}
              <Button
                isDisabled={footerState.addToLibrary.isDisabled}
                isLoading={footerState.addToLibrary.isLoading}
                onClick={footerState.addToLibrary.onClick}
                size='Medium'
                variant='Standard'>
                {footerState.addToLibrary.label}
              </Button>
            </>
          ) : null}
          <Button isDisabled={isBusy} onClick={handleClose} size='Medium' variant='Standard'>
            {translate('Action.Close')}
          </Button>
        </SheetActions>
      </SheetContent>
      {toastMessage != null ? (
        <GenericSnackBar
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          severity='success'
        />
      ) : null}
    </SheetRoot>
  );
};

export default AiCreateDrawer;
