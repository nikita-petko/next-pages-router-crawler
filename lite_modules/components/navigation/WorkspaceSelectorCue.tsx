import { useWorkspaces } from '@rbx/creator-hub-navigation';
import { CueCallout, CueProvider } from '@rbx/cueing/react';
import {
  EducationalTooltip,
  EducationalTooltipBody,
  EducationalTooltipContent,
  EducationalTooltipDescription,
  EducationalTooltipFullWidthFooter,
  EducationalTooltipTitle,
  EducationalTooltipTrigger,
} from '@rbx/foundation-ui';
import { useRouter } from 'next/router';
import { type ReactElement, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useDialogStore } from '@components/common/dialog/store';
import { CUE_MODAL_IDS } from '@constants/cueModalIds';
import { getGroupRolesUrl } from '@constants/groupPermissionsUrls';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useAdAccountAutoCreateModalGate from '@hooks/account/useAdAccountAutoCreateModalGate';
import useMediaQuery from '@hooks/useMediaQuery';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useShouldUseWorkspaceUniverseFiltering from '@hooks/useShouldUseWorkspaceUniverseFiltering';
import { useAppStore } from '@stores/appStoreProvider';
import { useNewFlowStore } from '@stores/newFlowStoreProvider';

const DESKTOP_ANCHOR_VERTICAL_OFFSET_PX = 16;
const COMPACT_ANCHOR_VERTICAL_OFFSET_PX = 32;
const MOBILE_NAVIGATION_TRIGGER_QUERY = 'button[aria-label="menu"]';
const WORKSPACE_SELECTOR_QUERY = [
  '[role="combobox"][aria-haspopup="listbox"]',
  '[role="button"][aria-haspopup="listbox"]',
].join(', ');

const findCueTarget = (isDesktop: boolean): HTMLElement | null =>
  document.querySelector<HTMLElement>(
    isDesktop ? WORKSPACE_SELECTOR_QUERY : MOBILE_NAVIGATION_TRIGGER_QUERY,
  );

type ActiveWorkspaceSelectorCueProps = {
  cueTargetElement: HTMLElement;
  descriptionKey: string;
  dismiss: () => void;
  position: 'bottom-start' | 'right-center';
};

const ActiveWorkspaceSelectorCue = ({
  cueTargetElement,
  descriptionKey,
  dismiss,
  position,
}: ActiveWorkspaceSelectorCueProps): ReactElement => {
  const { translate: translateCreativeLibrary } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const { translate: translateLanding } = useNamespacedTranslation(TranslationNamespace.Landing);
  const { translate: translateNavigation } = useNamespacedTranslation(
    TranslationNamespace.Navigation,
  );
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);

  const handleManageGroupRoles = (): void => {
    window.open(getGroupRolesUrl(), '_blank', 'noopener,noreferrer');
    dismiss();
  };

  useEffect(() => {
    cueTargetElement.addEventListener('click', dismiss);

    return () => {
      cueTargetElement.removeEventListener('click', dismiss);
    };
  }, [cueTargetElement, dismiss]);

  return (
    <EducationalTooltip onOpenChange={() => undefined} open>
      <EducationalTooltipTrigger asChild>
        <span aria-hidden className='block height-full width-full' />
      </EducationalTooltipTrigger>
      <EducationalTooltipContent
        onOpenAutoFocus={(event) => event.preventDefault()}
        position={position}>
        <EducationalTooltipBody>
          <EducationalTooltipTitle>
            {translateLanding('Heading.GroupsCueStep1')}
          </EducationalTooltipTitle>
          <EducationalTooltipDescription>
            {translateNavigation(descriptionKey)}
          </EducationalTooltipDescription>
        </EducationalTooltipBody>
        <EducationalTooltipFullWidthFooter
          primaryAction={{
            label: translateCreativeLibrary('Action.OK'),
            onClick: dismiss,
          }}
          secondaryAction={{
            label: translateMisc('Action.ManageGroupRoles'),
            onClick: handleManageGroupRoles,
          }}
        />
      </EducationalTooltipContent>
    </EducationalTooltip>
  );
};

type ActiveWorkspaceSelectorCuePortalProps = {
  descriptionKey: string;
  dismiss: () => void;
  isDesktop: boolean;
};

const ActiveWorkspaceSelectorCuePortal = ({
  descriptionKey,
  dismiss,
  isDesktop,
}: ActiveWorkspaceSelectorCuePortalProps): ReactElement | null => {
  const [cueTargetElement, setCueTargetElement] = useState<HTMLElement | null>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const updateCueTargetElement = () => {
      const nextCueTargetElement = findCueTarget(isDesktop);
      setCueTargetElement((currentCueTargetElement) =>
        currentCueTargetElement === nextCueTargetElement
          ? currentCueTargetElement
          : nextCueTargetElement,
      );
    };

    updateCueTargetElement();
    const observer = new MutationObserver(updateCueTargetElement);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [isDesktop]);

  useEffect(() => {
    if (!cueTargetElement) {
      setPortalContainer(null);
      return undefined;
    }

    const anchor = document.createElement('span');
    anchor.className = 'pointer-events-none fixed';
    anchor.dataset.workspaceSelectorCueAnchor = '';
    let animationFrameId: number | null = null;

    const syncAnchorBounds = (): void => {
      animationFrameId = null;
      const { height, left, top, width } = cueTargetElement.getBoundingClientRect();
      const anchorVerticalOffset = isDesktop
        ? DESKTOP_ANCHOR_VERTICAL_OFFSET_PX
        : COMPACT_ANCHOR_VERTICAL_OFFSET_PX;

      anchor.style.height = `${height}px`;
      anchor.style.left = `${left}px`;
      anchor.style.top = `${top + anchorVerticalOffset}px`;
      anchor.style.width = `${width}px`;
    };
    const scheduleAnchorBoundsSync = (): void => {
      if (animationFrameId === null) {
        animationFrameId = window.requestAnimationFrame(syncAnchorBounds);
      }
    };

    syncAnchorBounds();
    document.body.appendChild(anchor);
    setPortalContainer(anchor);

    const resizeObserver = new ResizeObserver(scheduleAnchorBoundsSync);
    resizeObserver.observe(cueTargetElement);
    window.addEventListener('resize', scheduleAnchorBoundsSync);
    window.addEventListener('scroll', scheduleAnchorBoundsSync, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', scheduleAnchorBoundsSync);
      window.removeEventListener('scroll', scheduleAnchorBoundsSync, true);
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
      anchor.remove();
      setPortalContainer(null);
    };
  }, [cueTargetElement, isDesktop]);

  if (!cueTargetElement || !portalContainer) {
    return null;
  }

  return createPortal(
    <ActiveWorkspaceSelectorCue
      cueTargetElement={cueTargetElement}
      descriptionKey={descriptionKey}
      dismiss={dismiss}
      position={isDesktop ? 'right-center' : 'bottom-start'}
    />,
    portalContainer,
  );
};

const WorkspaceSelectorCue = (): ReactElement | null => {
  const router = useRouter();
  const { currentWorkspace, isLoading: isWorkspaceLoading } = useWorkspaces();
  const isMetadataError = useAppStore((state) => state.appMetadataState.isError);
  const isMetadataLoading = useAppStore((state) => state.appMetadataState.isLoading);
  const isAdAccountAutoCreateEnabled = useAppStore(
    (state) => state.appMetadataState.data?.isAdAccountAutoCreateEnabled ?? false,
  );
  const hasNewFlowCampaign = useAppStore((state) => state.hasNewFlowCampaign);
  const workspaceCampaignsState = useNewFlowStore((state) => state.campaignsState);
  const shouldUseWorkspaceView = useShouldUseWorkspaceUniverseFiltering();
  const isDialogOpen = useDialogStore((state) => state.isOpen);
  const autoCreateModalGateStatus = useAdAccountAutoCreateModalGate((state) => state.status);
  const { isLarge: isDesktop } = useMediaQuery();
  const isAutoCreateModalResolved =
    autoCreateModalGateStatus === 'dismissed' || autoCreateModalGateStatus === 'willNotShow';
  const isUserWorkspace = currentWorkspace?.creatorType === 'User';
  const shouldUseWorkspaceCampaignState =
    router.pathname === Routes.MANAGE && hasNewFlowCampaign.data === true;
  const isCampaignEligibilityLoading =
    hasNewFlowCampaign.isLoading ||
    (shouldUseWorkspaceCampaignState && workspaceCampaignsState.isLoading);
  const shouldShowMissingCampaignsGuidance =
    isUserWorkspace &&
    !hasNewFlowCampaign.isError &&
    !workspaceCampaignsState.isError &&
    !isCampaignEligibilityLoading &&
    (shouldUseWorkspaceCampaignState
      ? workspaceCampaignsState.data?.length === 0
      : hasNewFlowCampaign.data === false);
  const descriptionKey = shouldShowMissingCampaignsGuidance
    ? 'Description.GroupWorkspaceSelectorCue'
    : 'Description.GroupFundsCampaignFundingCue';
  const enabled =
    !isMetadataError &&
    !isMetadataLoading &&
    isAdAccountAutoCreateEnabled &&
    shouldUseWorkspaceView &&
    isAutoCreateModalResolved &&
    !isWorkspaceLoading &&
    currentWorkspace != null &&
    (!isUserWorkspace || !isCampaignEligibilityLoading) &&
    !isDialogOpen;

  if (!enabled) {
    return null;
  }

  return (
    <CueProvider modalId={CUE_MODAL_IDS.WORKSPACE_SELECTOR_CUE}>
      <CueCallout>
        {(state) =>
          state.isActive ? (
            <ActiveWorkspaceSelectorCuePortal
              descriptionKey={descriptionKey}
              dismiss={state.dismiss}
              isDesktop={isDesktop}
            />
          ) : null
        }
      </CueCallout>
    </CueProvider>
  );
};

export default WorkspaceSelectorCue;
