import { AdCreativeAssetSource } from '@rbx/client-ads-management-api/v1';
import {
  Button,
  FeedbackBanner,
  Tabs as FoundationTabs,
  TabsContent as FoundationTabsContent,
  TabsList as FoundationTabsList,
  TabsTrigger as FoundationTabsTrigger,
  Icon,
  SheetActions,
  SheetBody,
  SheetTitle,
} from '@rbx/foundation-ui';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';
import { useWatch } from 'react-hook-form';

import { EventName, logNativeImpressionEvent } from '@clients/unifiedLogger';
import CreativeActiveTab from '@components/campaignBuilder/common/creative/CreativeActiveTab';
import CreativeImportTab, {
  type CreativeImportFooterAction,
} from '@components/campaignBuilder/common/creative/CreativeImportTab';
import CreativeUploadTab, {
  type CreativeUploadFooterActions,
  CreativeUploadFooterActionsContent,
  type CreativeUploadPersistedEntry,
} from '@components/common/creative/CreativeUploadTab';
import { FormField } from '@constants/campaignBuilder';
import { TranslationNamespace } from '@constants/localization';
import type { FormType } from '@hooks/campaignBuilder/baseFormSchema';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import { useAiCreateSessionStore } from '@stores/aiCreateSessionStoreProvider';
import type { AspectRatioValidation } from '@type/fileUpload';
import { countSelectedCreatives } from '@utils/campaignBuilder';

enum DrawerTab {
  ACTIVE = 'active',
  IMPORT = 'import',
  UPLOAD = 'upload',
}

interface CreativeLibrarySheetBodyProps {
  /**
   * Optional aspect-ratio gate forwarded to the Upload tab. Logo drawer
   * passes `LOGO_ASPECT_RATIO_VALIDATION` so off-ratio sources fail the
   * client-side validator with the same tolerance as the library filter
   * (avoids round-tripping through the asset registry just to be rejected
   * by the server).
   */
  aspectRatioValidation?: AspectRatioValidation;
  /** THUMBNAILS or LOGO_ASSETS — picks which form field both tabs write to. */
  formField: typeof FormField.THUMBNAILS | typeof FormField.LOGO_ASSETS;
  /**
   * At-capacity flag. When true:
   *  - The Upload tab trigger is disabled and shows a lock affordance.
   *  - The Upload tab body's `Select media` button is disabled.
   * Both gates use the same committed-selection count so the trigger and
   * the inside-tab control flip together.
   */
  isSelectMediaDisabled: boolean;
  /** Cap on selectable items, used by both tabs. */
  maxAllowedSelections: number;
  /** Optional cap on Upload-table rows (logo drawer caps to 1, thumbnail to N). */
  maxUploadFiles?: number;
  /** Footer Close click. */
  onClose: () => void;
  onPersistedUploadEntriesChange?: (entries: CreativeUploadPersistedEntry[]) => void;
  onRegistered: (registered: Array<{ assetId: number; file: File }>) => void;
  onRemoveUploadedAsset: (assetId: number) => void;
  onUploadInProgressChange: (inProgress: boolean) => void;
  persistedUploadEntries?: CreativeUploadPersistedEntry[];
  /**
   * When true, prepend a read-only "Active" tab that lists creatives already
   * attached to the live campaign. Only the edit-campaign flow passes this
   * (thumbnail drawer only); create flow has no concept of active creatives.
   */
  showActiveTab?: boolean;
  /** Used to disambiguate test ids (e.g. 'thumbnail' vs 'logo'). */
  testIdPrefix: 'thumbnail' | 'logo';
  universeId?: number;
}

type CreativeLibraryScrollContentProps = Omit<CreativeLibrarySheetBodyProps, 'onClose'> & {
  onActiveTabChange: (tab: DrawerTab) => void;
  onImportFooterActionChange: (action: CreativeImportFooterAction | null) => void;
  onUploadFooterActionsChange: (actions: CreativeUploadFooterActions | null) => void;
};

type CreativeLibrarySheetFooterProps = {
  activeTabRef: MutableRefObject<DrawerTab>;
  importFooterRef: MutableRefObject<CreativeImportFooterAction | null>;
  onClose: () => void;
  subscribe: (listener: () => void) => () => void;
  uploadFooterRef: MutableRefObject<CreativeUploadFooterActions | null>;
};

// Scrollable tab body lives in its own component so import-tab tile clicks
// only re-render this subtree (plus the isolated footer bridge below), not
// the whole sheet shell. Footer action state is stored in refs and pushed
// through a tiny subscriber so enabling "Add creatives" never re-renders
// SheetBody and snaps scroll back to the top.
const CreativeLibraryScrollContent = ({
  aspectRatioValidation,
  formField,
  isSelectMediaDisabled,
  maxAllowedSelections,
  maxUploadFiles,
  onActiveTabChange,
  onImportFooterActionChange,
  onPersistedUploadEntriesChange,
  onRegistered,
  onRemoveUploadedAsset,
  onUploadFooterActionsChange,
  onUploadInProgressChange,
  persistedUploadEntries,
  showActiveTab = false,
  testIdPrefix,
  universeId,
}: CreativeLibraryScrollContentProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { translate: translateCampaign } = useNamespacedTranslation(TranslationNamespace.Campaign);
  const isUploadDrawerBannerDismissed = useAiCreateSessionStore(
    (state) => state.isUploadDrawerBannerDismissed,
  );
  const setUploadDrawerBannerDismissed = useAiCreateSessionStore(
    (state) => state.setUploadDrawerBannerDismissed,
  );
  const [activeTab, setActiveTab] = useState<DrawerTab>(
    showActiveTab ? DrawerTab.ACTIVE : DrawerTab.IMPORT,
  );
  // Persist upload-banner dismissal only for thumbnail campaign flow.
  // Logo/reach drawers keep their existing per-open behavior.
  const shouldPersistUploadBannerDismissal = formField === FormField.THUMBNAILS;
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(
    shouldPersistUploadBannerDismissal ? isUploadDrawerBannerDismissed : false,
  );
  // Owned here (not lifted) because only the upload tab's committed-count math
  // reads it, and a ref keeps import-tab tile clicks from re-rendering anything
  // above this subtree.
  const importPendingDeltaRef = useRef<number>(0);
  const sheetBodyRef = useRef<HTMLDivElement | null>(null);
  const sheetScrollTopRef = useRef(0);

  // Both tabs should show — and gate against — the same "X / max" total:
  // committed form selections + import-tab pending toggles + upload-tab
  // pending (non-complete) entries. Each tab knows its own pending
  // contribution; the sheet body derives the other two pieces and feeds
  // each tab the slice it can't see.
  const draftItems = useWatch<FormType>({ name: formField }) as
    | Array<{ assetId: number; isSelected?: boolean }>
    | undefined;
  // Every selected creative on the draft counts toward the "X / max" total,
  // including existing ones that may be paused. The count comes from the form
  // selection (not the async, date-filtered ad list), so it's stable and
  // instant. Active/paused awareness is being reworked in a follow-up PR.
  const committedSelectedCount = useMemo(() => countSelectedCreatives(draftItems), [draftItems]);
  const pendingUploadCount = useMemo(
    () => (persistedUploadEntries ?? []).filter((entry) => entry.status !== 'complete').length,
    [persistedUploadEntries],
  );
  const handleImportPendingDeltaChange = useCallback((delta: number) => {
    importPendingDeltaRef.current = delta;
  }, []);
  const externalCommittedCount = committedSelectedCount + importPendingDeltaRef.current;

  useEffect(() => {
    onActiveTabChange(activeTab);
  }, [activeTab, onActiveTabChange]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as DrawerTab);
  }, []);

  const persistScrollTop = useCallback(() => {
    if (sheetBodyRef.current != null) {
      sheetScrollTopRef.current = sheetBodyRef.current.scrollTop;
    }
  }, []);

  // Callback ref: Foundation's SheetBody only exposes its scroll node after
  // mount (a plain ref is null on the first effect pass), so we attach the
  // scroll listener the moment the node arrives.
  const setSheetBodyRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (sheetBodyRef.current != null) {
        sheetBodyRef.current.removeEventListener('scroll', persistScrollTop);
      }
      sheetBodyRef.current = node;
      node?.addEventListener('scroll', persistScrollTop, { passive: true });
    },
    [persistScrollTop],
  );

  // Import-tab tile clicks re-render this subtree; restore the user's scroll
  // position so the library grid doesn't snap back to the top.
  useLayoutEffect(() => {
    if (activeTab !== DrawerTab.IMPORT || sheetBodyRef.current == null) {
      return;
    }
    sheetBodyRef.current.scrollTop = sheetScrollTopRef.current;
  });

  return (
    <SheetBody ref={setSheetBodyRef}>
      <FoundationTabs
        className='flex flex-col gap-large'
        onValueChange={handleTabChange}
        value={activeTab}>
        <FoundationTabsList>
          {showActiveTab && (
            <FoundationTabsTrigger
              className='content-default data-[state=active]:content-emphasis'
              data-testid={`${testIdPrefix}-active-tab`}
              value={DrawerTab.ACTIVE}>
              {translate('Label.ActiveCreatives')}
            </FoundationTabsTrigger>
          )}
          <FoundationTabsTrigger
            className='content-default data-[state=active]:content-emphasis'
            data-testid={`${testIdPrefix}-import-tab`}
            value={DrawerTab.IMPORT}>
            {translate('Action.SelectFromLibrary')}
          </FoundationTabsTrigger>
          <FoundationTabsTrigger
            className='content-default data-[state=active]:content-emphasis'
            data-testid={`${testIdPrefix}-upload-tab`}
            isDisabled={isSelectMediaDisabled}
            value={DrawerTab.UPLOAD}>
            <span className='flex items-center gap-xsmall'>
              {translateCampaign('Action.UploadMedia')}
              {isSelectMediaDisabled && (
                <Icon
                  aria-hidden
                  className='content-muted'
                  name='icon-filled-lock-closed'
                  size='Small'
                />
              )}
            </span>
          </FoundationTabsTrigger>
        </FoundationTabsList>
        {showActiveTab && (
          <FoundationTabsContent value={DrawerTab.ACTIVE}>
            <CreativeActiveTab maxAllowedSelections={maxAllowedSelections} />
          </FoundationTabsContent>
        )}
        <FoundationTabsContent value={DrawerTab.IMPORT}>
          <CreativeImportTab
            formField={formField}
            maxAllowedSelections={maxAllowedSelections}
            onFooterActionChange={onImportFooterActionChange}
            onPendingDeltaChange={handleImportPendingDeltaChange}
            pendingUploadCount={pendingUploadCount}
          />
        </FoundationTabsContent>
        <FoundationTabsContent value={DrawerTab.UPLOAD}>
          <CreativeUploadTab
            aspectRatioValidation={aspectRatioValidation}
            assetSource={AdCreativeAssetSource.AdCreativeAssetSourceUpload}
            autoUploadOnSelect
            banner={
              isBannerDismissed ? null : (
                <FeedbackBanner
                  dismissIconAriaLabel={translate('Action.Close')}
                  onDismiss={() => {
                    setIsBannerDismissed(true);
                    if (shouldPersistUploadBannerDismissal) {
                      setUploadDrawerBannerDismissed(true);
                    }
                  }}
                  severity='Info'
                  title={
                    <span className='text-body-medium'>
                      {translate('Description.UploadReviewedAndSaved')}
                    </span>
                  }
                  variant='Emphasis'
                />
              )
            }
            deferRegisteredUntilAdd
            externalCommittedCount={externalCommittedCount}
            isCampaignCreativeSource
            isSelectMediaDisabled={isSelectMediaDisabled}
            maxFiles={maxUploadFiles}
            onBatchInProgressChange={onUploadInProgressChange}
            onFooterActionsChange={onUploadFooterActionsChange}
            onPersistedEntriesChange={onPersistedUploadEntriesChange}
            onRegistered={onRegistered}
            onRemoveUploadedAsset={onRemoveUploadedAsset}
            persistedEntries={persistedUploadEntries}
            universeId={universeId}
          />
        </FoundationTabsContent>
      </FoundationTabs>
    </SheetBody>
  );
};

const CreativeLibrarySheetFooter = ({
  activeTabRef,
  importFooterRef,
  onClose,
  subscribe,
  uploadFooterRef,
}: CreativeLibrarySheetFooterProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const [, forceFooterUpdate] = useReducer((revision: number) => revision + 1, 0);

  useEffect(() => subscribe(forceFooterUpdate), [subscribe]);

  const activeTab = activeTabRef.current;
  const importFooterAction = importFooterRef.current;
  const uploadFooterActions = uploadFooterRef.current;

  return (
    <SheetActions className='flex flex-row wrap items-center gap-small'>
      {activeTab === DrawerTab.IMPORT && importFooterAction != null ? (
        <Button
          isDisabled={importFooterAction.isDisabled}
          onClick={() => {
            importFooterAction.onClick();
            onClose();
          }}
          size='Medium'
          variant='Standard'>
          {importFooterAction.label}
        </Button>
      ) : null}
      {activeTab === DrawerTab.UPLOAD && uploadFooterActions != null ? (
        <CreativeUploadFooterActionsContent actions={uploadFooterActions} />
      ) : null}
      <Button onClick={onClose} size='Medium' variant='Standard'>
        {translate('Action.Close')}
      </Button>
    </SheetActions>
  );
};

// Foundation Sheet body shared by the campaign-builder thumbnail and logo
// drawers when the creative-library flag is on. Renders the Select-from-
// library + Upload tabs (and the Active tab in edit mode) with a shared
// FeedbackBanner. The selected-count helper lives on the campaign form
// below the drawer, not here — keeping it out also avoids a parent
// re-render on every tile click, which previously snapped the sheet
// back to the top.
const CreativeLibrarySheetBody = (props: CreativeLibrarySheetBodyProps) => {
  const { translate } = useNamespacedTranslation(TranslationNamespace.CreativeLibrary);
  const { onClose, showActiveTab = false } = props;
  const importFooterRef = useRef<CreativeImportFooterAction | null>(null);
  const uploadFooterRef = useRef<CreativeUploadFooterActions | null>(null);
  const activeTabRef = useRef<DrawerTab>(showActiveTab ? DrawerTab.ACTIVE : DrawerTab.IMPORT);
  const footerListenersRef = useRef(new Set<() => void>());

  const subscribeFooter = useCallback((listener: () => void) => {
    footerListenersRef.current.add(listener);
    return () => {
      footerListenersRef.current.delete(listener);
    };
  }, []);

  const notifyFooter = useCallback(() => {
    footerListenersRef.current.forEach((listener) => listener());
  }, []);

  useEffect(() => {
    logNativeImpressionEvent(EventName.CreativeLibraryOpened, {
      context: 'campaign_builder',
    });
  }, []);

  const handleImportFooterActionChange = useCallback(
    (action: CreativeImportFooterAction | null) => {
      importFooterRef.current = action;
      notifyFooter();
    },
    [notifyFooter],
  );

  const handleUploadFooterActionsChange = useCallback(
    (actions: CreativeUploadFooterActions | null) => {
      if (actions == null) {
        uploadFooterRef.current = null;
        notifyFooter();
        return;
      }
      uploadFooterRef.current = {
        ...actions,
        onUpload: () => {
          actions.onUpload();
          onClose();
        },
      };
      notifyFooter();
    },
    [notifyFooter, onClose],
  );

  const handleActiveTabChange = useCallback(
    (tab: DrawerTab) => {
      activeTabRef.current = tab;
      notifyFooter();
    },
    [notifyFooter],
  );

  return (
    <>
      <SheetTitle>{translate('Heading.AddCreatives')}</SheetTitle>
      <CreativeLibraryScrollContent
        {...props}
        onActiveTabChange={handleActiveTabChange}
        onImportFooterActionChange={handleImportFooterActionChange}
        onUploadFooterActionsChange={handleUploadFooterActionsChange}
      />
      <CreativeLibrarySheetFooter
        activeTabRef={activeTabRef}
        importFooterRef={importFooterRef}
        onClose={onClose}
        subscribe={subscribeFooter}
        uploadFooterRef={uploadFooterRef}
      />
    </>
  );
};

export default CreativeLibrarySheetBody;
