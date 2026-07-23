import {
  Button,
  Divider,
  FeedbackBanner,
  IconButton,
  Link,
  ProgressCircle,
  Tooltip,
  TooltipTrigger,
} from '@rbx/foundation-ui';
import { Skeleton } from '@rbx/ui';
import { useMutation } from '@tanstack/react-query';
import {
  type ChangeEvent,
  type FC,
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { EventName, logNativeClickEvent, logNativeImpressionEvent } from '@clients/unifiedLogger';
import contentStyles from '@components/common/creative/AiCreateContent.module.css';
import {
  type AiCreativeFeedbackSubmitPayload,
  openAiCreativeFeedbackDialog,
} from '@components/common/creative/AiCreativeFeedbackDialog';
import {
  AiCreativeReferenceAddControl,
  AiCreativeReferenceThumbnailsRow,
} from '@components/common/creative/AiCreativeReferenceImagePicker';
import AiGeneratedImageTile from '@components/common/creative/AiGeneratedImageTile';
import GameUniverseDropdown from '@components/common/creative/GameUniverseDropdown';
import { openReportSentDialog } from '@components/common/creative/ReportSentDialog';
import { FOUNDATION_TOOLTIP_BODY_SMALL_CLASS } from '@components/common/creative/tooltipStyles';
import GenericSnackBar from '@components/common/GenericSnackBar';
import { DEFAULT_GEN_AI_CREATIVES_USER_PROMPT_MAX_LENGTH } from '@constants/aiCreatives';
import { TranslationNamespace } from '@constants/localization';
import { useAuthenticatedUser } from '@hooks/useAuthenticatedUser';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';
import useUniverseOptionsForAdCreation from '@hooks/useUniverseOptionsForAdCreation';
import {
  generateAdCreative,
  GenerateAdCreativeError,
  type GeneratedImageReportContext,
  reportAiGeneratedCreative,
  saveGeneratedCreativesToLibrary,
} from '@services/ads/generateAdCreativeService';
import {
  type AiCreateSessionSnapshot,
  type GeneratedImageBatch,
  useAiCreateSessionStore,
} from '@stores/aiCreateSessionStoreProvider';
import { type AppStoreType, useAppStore } from '@stores/appStoreProvider';
import { useThumbnailStore } from '@stores/thumbnailStoreProvider';
import { type AppStoreStateType } from '@type/appStore';
import { getHttpStatusFromError } from '@type/errorResponse';
import {
  hasAcceptedGenAiCreativesAgreement,
  setGenAiCreativesAgreementAccepted,
} from '@utils/aiCreativesAgreementStorage';
import { CaptureException } from '@utils/error';

const GENERATING_SKELETON_COUNT = 3;

// Synthetic batch id used when folding React Query's in-flight batch into the
// persisted campaign session at close (the mutation cache doesn't survive the
// drawer unmount, so its images are archived alongside the regeneration history).
const PERSISTED_CURRENT_BATCH_ID = 'persisted-current-batch';

// Rotating placeholder hints shown in the empty, unfocused prompt field. The
// fallback `Label.DescribeImagePrompt` leads so it shows first; the others nudge
// the user toward richer prompts (style/color/lighting). Keys that don't resolve
// to a real string are skipped, so the rotation degrades gracefully. The cadence
// is owned by the CSS (promptHintCycle duration); rotation advances on each
// fade-out (animationend) rather than a JS timer, so the two never drift.
const PROMPT_HINT_CANDIDATE_KEYS = [
  'Label.DescribeImagePrompt',
  'Label.DescribeImagePromptHintStyle',
  'Label.DescribeImagePromptHintColorPalette',
  'Label.DescribeImagePromptHintLightingMood',
] as const;

const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_TOO_MANY_REQUESTS = 429;

// Maps the generate request's failure HTTP status to a specific, actionable
// error message. A 400 means the prompt was rejected by content/IP validation
// (tell the user to change it); a 429 means they've hit the rate limit. Any
// other failure (5xx/network) falls back to the generic retry message. A 403
// (GenAI not enabled / no universe permission) deliberately falls through to the
// generic message too: the UI gates access before the generate button renders,
// so a 403 here is not an expected, user-recoverable state worth its own copy.
const GENERATE_ERROR_MESSAGE_KEY_BY_STATUS: Record<number, string> = {
  [HTTP_STATUS_BAD_REQUEST]: 'Message.GenerateCreativeInvalidPrompt',
  [HTTP_STATUS_TOO_MANY_REQUESTS]: 'Message.GenerateCreativeRateLimited',
};

interface AiCreateFooterButton {
  isDisabled: boolean;
  isLoading: boolean;
  label: string;
  onClick: () => void;
  /**
   * Optional tooltip shown on hover (e.g. why a disabled button is disabled).
   * The drawer wraps the button in a `Tooltip` only when this is set.
   */
  tooltip?: string;
}

/**
 * Save actions lifted out of the scrollable body so the drawer can render them
 * in its sticky footer (`SheetActions`) alongside Close. `null` means there are
 * no actionable creatives yet (nothing generated, or a generation in flight).
 */
export interface AiCreateFooterState {
  /** Present only in the campaign flow; primary "Add to campaign" action. */
  addToCampaign?: AiCreateFooterButton;
  /** Secondary "Add to library" (campaign) or "Save selected" (standalone). */
  addToLibrary: AiCreateFooterButton;
  /** Save-specific failure rendered by the drawer footer near save actions. */
  saveErrorMessage?: string;
}

interface AiCreateContentProps {
  /** Campaign builder: scope generation to this universe; hides the game picker. */
  fixedUniverseId?: number;
  /** Campaign drawer: max creatives that still fit in the campaign right now. */
  maxCampaignAddCount?: number;
  onAddToCampaign?: (registered: Array<{ assetId: number; file: File }>) => void;
  onBusyChange?: (busy: boolean) => void;
  /** Reports the save actions so the drawer can render them in its footer. */
  onFooterStateChange?: (state: AiCreateFooterState | null) => void;
  /**
   * Campaign flow: close the drawer after "Add to library" succeeds (the saved
   * creatives live in the library, so there's nothing left to do in the drawer).
   */
  onRequestClose?: (options?: { showAddedToLibraryToast?: boolean }) => void;
  onSaved?: (registered: Array<{ assetId: number; file: File }>) => void;
  /** Library standalone flow: show the advertisable-universe picker. */
  showGameSelector?: boolean;
}

enum AiCreateStep {
  AGREEMENT = 'agreement',
  CREATE = 'create',
}

// Distinguishes which save action is in flight so only the clicked button shows
// the spinner (both buttons share a single save mutation).
type PendingSaveAction = 'campaign' | 'library' | null;

interface ReportToastState {
  message: string;
  severity: 'error' | 'success';
}

const AiCreateContent: FC<AiCreateContentProps> = ({
  fixedUniverseId,
  maxCampaignAddCount,
  onAddToCampaign,
  onBusyChange,
  onFooterStateChange,
  onRequestClose,
  onSaved,
  showGameSelector = false,
}) => {
  const { translate, translateHTML } = useNamespacedTranslation(
    TranslationNamespace.CreativeLibrary,
  );
  const user = useAuthenticatedUser();
  const isGenAiCreativesEnabled = useAppStore(
    (state: AppStoreStateType) => state.appMetadataState?.data?.isGenAiCreativesEnabled ?? false,
  );
  const isGenAiCreativesUserReferenceEnabled = useAppStore(
    (state: AppStoreStateType) =>
      state.appMetadataState?.data?.isGenAiCreativesUserReferenceEnabled ?? false,
  );
  const maxPromptLength = useAppStore(
    (state: AppStoreStateType) =>
      state.appMetadataState?.data?.maxGenAiCreativesUserPromptLength ??
      DEFAULT_GEN_AI_CREATIVES_USER_PROMPT_MAX_LENGTH,
  );
  // Per-ad-account generation quota seeded at page load. Undefined when rate
  // limiting is off, the account is bypassed, or the backend couldn't read the
  // counter — in which case we render no quota display and don't gate generate.
  const genAiCreativesQuota = useAppStore(
    (state: AppStoreStateType) => state.appMetadataState?.data?.genAiCreativesQuota,
  );
  const setGenAiCreativesQuota = useAppStore((state: AppStoreType) => state.setGenAiCreativesQuota);
  const recordGenAiCreativeGenerated = useAppStore(
    (state: AppStoreType) => state.recordGenAiCreativeGenerated,
  );
  const adAccountId = useAppStore((state: AppStoreStateType) => state.appData.adAccountInfo?.id);

  // Persisted campaign generation session (see aiCreateSessionStore). Only the
  // campaign drawer reads/writes it: it restores previously generated creatives
  // on reopen and snapshots them on close. The standalone library flow always
  // starts fresh.
  const setAiCreateSession = useAiCreateSessionStore((state) => state.setAiCreateSession);
  const clearAiCreateSession = useAiCreateSessionStore((state) => state.clearAiCreateSession);
  const persistedReviewBannerDismissed = useAiCreateSessionStore(
    (state) => state.isReviewBannerDismissed,
  );
  const setAiCreateReviewBannerDismissed = useAiCreateSessionStore(
    (state) => state.setAiCreateReviewBannerDismissed,
  );
  // Snapshot captured once at mount. A snapshot generated for a different
  // universe is ignored so switching the campaign experience starts clean.
  const initialSessionRef = useRef<AiCreateSessionSnapshot | null | undefined>(undefined);
  if (initialSessionRef.current === undefined) {
    const persisted = showGameSelector ? null : useAiCreateSessionStore.getState().session;
    initialSessionRef.current =
      persisted != null &&
      persisted.universeId === fixedUniverseId &&
      persisted.adAccountId === adAccountId
        ? persisted
        : null;
  }
  const initialSession = initialSessionRef.current;

  const [step, setStep] = useState<AiCreateStep>(AiCreateStep.AGREEMENT);
  const [selectedUniverseId, setSelectedUniverseId] = useState<number | undefined>(undefined);
  const [userPrompt, setUserPrompt] = useState<string>(() => initialSession?.userPrompt ?? '');
  const [referenceAssetIds, setReferenceAssetIds] = useState<number[]>(
    () => initialSession?.referenceAssetIds ?? [],
  );
  const [activePromptHintIndex, setActivePromptHintIndex] = useState<number>(0);
  const [isPromptFocused, setIsPromptFocused] = useState<boolean>(false);
  const [previousGeneratedBatches, setPreviousGeneratedBatches] = useState<GeneratedImageBatch[]>(
    () => initialSession?.batches ?? [],
  );
  const [selectedImageUrls, setSelectedImageUrls] = useState<Set<string>>(
    () => new Set(initialSession?.selectedImageUrls ?? []),
  );
  const [pendingSaveAction, setPendingSaveAction] = useState<PendingSaveAction>(null);
  const [hiddenImageUrls, setHiddenImageUrls] = useState<Set<string>>(
    () => new Set(initialSession?.hiddenImageUrls ?? []),
  );
  // Generation metadata (generationId/imageIndex) keyed by image URL, accumulated
  // across batches so a report from any visible batch can resolve its source image.
  const [reportContextByImageUrl, setReportContextByImageUrl] = useState<
    Record<string, GeneratedImageReportContext>
  >(() => initialSession?.reportContextByImageUrl ?? {});
  const [toast, setToast] = useState<ReportToastState | null>(null);
  // Per-session dismissal of the "AI media is reviewed + saved to library" info
  // banner (matches the Figma FeedbackAlert's close affordance).
  const [isReviewBannerDismissed, setIsReviewBannerDismissed] = useState<boolean>(() =>
    showGameSelector ? false : persistedReviewBannerDismissed,
  );
  const generationIdRef = useRef(0);
  // Focus targets used to keep focus inside the drawer when starting/finishing a
  // generation disables the focused control (see the focus-restoration layout
  // effect below).
  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const generatedSectionRef = useRef<HTMLDivElement>(null);
  const actionButtonRef = useRef<HTMLButtonElement>(null);
  // Latest committed campaign session, mirrored from render so the unmount
  // writer persists exactly what was on screen at close. Null in the library
  // flow (and after a successful save) so the store is never written then.
  const sessionSnapshotRef = useRef<AiCreateSessionSnapshot | null>(null);
  const setBlobByAssetId = useThumbnailStore((state) => state.setBlobByAssetId);
  const setPreviewUrlByAssetId = useThumbnailStore((state) => state.setPreviewUrlByAssetId);

  const effectiveUniverseId = fixedUniverseId ?? selectedUniverseId;
  const isCampaignContext = !showGameSelector;

  const invalidateInFlightGeneration = () => {
    generationIdRef.current += 1;
  };

  const {
    groupId: creativeLibraryGroupId,
    isError: isUniversesError,
    isLoading: isUniversesLoading,
    universeOptions: advertisableUniverses,
  } = useUniverseOptionsForAdCreation({ enabled: showGameSelector });

  useEffect(() => {
    const hasAgreement = hasAcceptedGenAiCreativesAgreement(user?.id);
    setStep(hasAgreement ? AiCreateStep.CREATE : AiCreateStep.AGREEMENT);
  }, [user?.id]);

  useEffect(() => {
    if (fixedUniverseId != null) {
      setSelectedUniverseId(fixedUniverseId);
    }
  }, [fixedUniverseId]);

  const handleAcceptAgreement = () => {
    if (user?.id != null) {
      setGenAiCreativesAgreementAccepted(user.id);
    }
    setStep(AiCreateStep.CREATE);
  };

  const generateMutation = useMutation({
    mutationFn: () => {
      if (effectiveUniverseId == null) {
        throw new Error('Missing universe id');
      }
      return generateAdCreative({
        universeId: effectiveUniverseId,
        userPrompt: userPrompt.trim(),
        ...(isGenAiCreativesUserReferenceEnabled &&
          referenceAssetIds.length > 0 && { referenceAssetIds }),
      });
    },
    // A 429 (rate limit) and any transient 5xx/network/timeout failure must stay
    // resubmittable — see `isInvalidPromptError` and `canGenerate`. We no longer
    // zero the quota on a 429: doing so disabled the prompt/button and left the
    // user stuck with no way to retry short of reloading the page. The proactive
    // gate still blocks when the server-reported quota actually reaches zero.
  });

  const resetGenerationSession = useCallback(() => {
    setPreviousGeneratedBatches([]);
    setSelectedImageUrls(new Set());
    setHiddenImageUrls(new Set());
    setReportContextByImageUrl({});
    invalidateInFlightGeneration();
    generateMutation.reset();
    // Drop any persisted campaign session so a reopen starts fresh, and null the
    // snapshot so the unmount writer can't re-persist the just-cleared images.
    clearAiCreateSession();
    sessionSnapshotRef.current = null;
  }, [clearAiCreateSession, generateMutation]);

  const reportMutation = useMutation({
    mutationFn: async (payload: AiCreativeFeedbackSubmitPayload) => {
      if (effectiveUniverseId == null) {
        throw new Error('Missing universe id for report');
      }
      const reportContext = reportContextByImageUrl[payload.imageUrl];
      if (reportContext == null) {
        throw new Error('Missing generation metadata for report');
      }
      await reportAiGeneratedCreative({
        generationId: reportContext.generationId,
        imageIndex: reportContext.imageIndex,
        policyViolations: [payload.reason],
        reasonText: payload.details,
        universeId: effectiveUniverseId,
      });
    },
    onError: (error, variables) => {
      logNativeImpressionEvent(EventName.AiCreativeReportSubmitFailed, {
        firstViolation: String(variables.reason),
        policyViolationCount: '1',
        statusCode: String(getHttpStatusFromError(error) ?? 'unknown'),
      });
      // Report the failure for backend debugging — the toast below only tells the
      // user, leaving us blind to systemic report-submission breakage otherwise.
      CaptureException(error, { context: 'reportAiGeneratedCreative' });
      // The report didn't go through, so undo the optimistic hide and put the image
      // back in the grid — otherwise the user sees a failure toast while the creative
      // has silently vanished with no way to retry.
      setHiddenImageUrls((current) => {
        if (!current.has(variables.imageUrl)) {
          return current;
        }
        const next = new Set(current);
        next.delete(variables.imageUrl);
        return next;
      });
      setToast({
        message: translate('Message.ReportSubmitFailed'),
        severity: 'error',
      });
    },
    onSuccess: (_response, variables) => {
      logNativeImpressionEvent(EventName.AiCreativeReportSubmitSuccess, {
        firstViolation: String(variables.reason),
        policyViolationCount: '1',
      });
      // Confirmation is a dialog (per Figma "Report has been sent"), not a toast:
      // it surfaces the follow-up Terms of Use / Roblox Safety links the success
      // toast couldn't carry.
      openReportSentDialog();
    },
  });

  const startGenerate = useCallback(() => {
    generationIdRef.current += 1;
    const generationId = generationIdRef.current;
    generateMutation.reset();
    generateMutation.mutate(undefined, {
      onError: (error) => {
        logNativeImpressionEvent(EventName.AiCreativeGenerateFailed, {
          statusCode: String(getHttpStatusFromError(error) ?? 'unknown'),
        });
      },
      onSuccess: (response) => {
        if (generationId !== generationIdRef.current) {
          return;
        }
        logNativeImpressionEvent(EventName.AiCreativeGenerateSuccess, {
          generatedCount: String(response.generatedImages.length),
        });
        // Prefer the server-reported quota from the generate response; fall back
        // to a local decrement when AMA omits quota (record failure / limit off).
        if (response.quota != null) {
          setGenAiCreativesQuota(response.quota);
        } else {
          recordGenAiCreativeGenerated();
        }
        // Generated images start unselected; the user opts in per tile before the
        // footer "Add" actions enable. Accumulate report context so reports from
        // previous batches still resolve.
        setReportContextByImageUrl((current) => ({
          ...current,
          ...response.reportContextByImageUrl,
        }));
      },
    });
  }, [generateMutation, recordGenAiCreativeGenerated, setGenAiCreativesQuota]);

  // Single mutation behind both "Add to campaign" and "Add to library"; each
  // button supplies its own onSuccess to branch the post-save behaviour.
  const saveMutation = useMutation({
    mutationFn: () => {
      if (effectiveUniverseId == null || user?.id == null) {
        throw new Error('Missing save prerequisites');
      }
      return saveGeneratedCreativesToLibrary({
        groupId: creativeLibraryGroupId,
        imageUrls: [...selectedImageUrls],
        reportContextByImageUrl,
        universeId: effectiveUniverseId,
        userId: user.id,
      });
    },
    onError: (error) => {
      logNativeImpressionEvent(EventName.AiCreativeSavedToLibraryFailed, {
        statusCode: String(getHttpStatusFromError(error) ?? 'unknown'),
      });
      // The inline "save failed" alert tells the user; this reports the failure
      // so we can debug save-to-library backend issues that the UI alone hides.
      CaptureException(error, { context: 'saveGeneratedCreativesToLibrary' });
    },
    onSettled: () => {
      setPendingSaveAction(null);
    },
  });

  const isGenerating = generateMutation.isPending;
  const isSaving = saveMutation.isPending;
  const isBusy = isGenerating || isSaving;
  const generateError =
    generateMutation.isError && generateMutation.error instanceof GenerateAdCreativeError
      ? generateMutation.error
      : null;
  const generateErrorStatus = generateMutation.isError
    ? (generateError?.httpStatus ?? getHttpStatusFromError(generateMutation.error))
    : undefined;
  // Detect reference-asset-specific errors so we can route them to the picker
  // rather than showing them as prompt errors. Both the missing/unsupported-type
  // rejection (400) and the ownership/USE-permission denial (403) are surfaced
  // near the picker with a message specific to the failure.
  const isReferenceAssetError =
    generateError?.code === 'ReferenceAssetRejected' ||
    generateError?.code === 'ReferenceAssetPermissionDenied';
  const referenceAssetErrorMessageKey =
    generateError?.code === 'ReferenceAssetPermissionDenied'
      ? 'Message.AssetLoadErrorCheckOwnership'
      : 'Message.UnsupportedReferenceAssetType';
  let generateErrorMessageKey = 'Message.GenerateCreativeFailed';
  if (generateError?.code === 'InvalidPrompt') {
    generateErrorMessageKey = GENERATE_ERROR_MESSAGE_KEY_BY_STATUS[HTTP_STATUS_BAD_REQUEST];
  } else if (generateError?.code === 'RateLimited') {
    generateErrorMessageKey = GENERATE_ERROR_MESSAGE_KEY_BY_STATUS[HTTP_STATUS_TOO_MANY_REQUESTS];
  } else if (!isReferenceAssetError && generateErrorStatus != null) {
    generateErrorMessageKey =
      GENERATE_ERROR_MESSAGE_KEY_BY_STATUS[generateErrorStatus] ?? 'Message.GenerateCreativeFailed';
  }
  // Only an invalid-prompt (400) failure locks the generate button: the same
  // prompt would just fail again, so the user must edit it first. Every other
  // failure — a 429 rate limit, a reference-asset rejection, or a transient
  // 5xx/network/timeout — stays resubmittable so the user is never stranded.
  const isInvalidPromptError =
    generateError?.code === 'InvalidPrompt' ||
    (generateMutation.isError &&
      generateError == null &&
      generateErrorStatus === HTTP_STATUS_BAD_REQUEST &&
      !isReferenceAssetError);
  // Prompt-level inline error: show for all generate failures EXCEPT when the
  // error is exclusively from a reference-asset rejection (routed to the picker).
  const hasInlineGenerateError = generateMutation.isError && !isReferenceAssetError;
  // The current batch is owned by React Query; we never mirror it into local state.
  // Hidden/selection are UI-only deltas layered on top via the filter + selection set.
  // Memoized so its array identity is stable for the callbacks that depend on it.
  const currentBatchImageUrls = useMemo(
    () => generateMutation.data?.generatedImages ?? [],
    [generateMutation.data],
  );
  const filterVisibleImageUrls = (imageUrls: string[]) =>
    imageUrls.filter((imageUrl) => !hiddenImageUrls.has(imageUrl));
  const hasCurrentGeneratedImages = filterVisibleImageUrls(currentBatchImageUrls).length > 0;
  // All generated images render in a single "Generated image" section, newest
  // first: the latest batch (owned by React Query) followed by every archived
  // batch from earlier regenerations. There is no separate "previously
  // generated" section — regenerations accumulate into this one grid.
  const visibleGeneratedImageUrls = filterVisibleImageUrls([
    ...currentBatchImageUrls,
    ...previousGeneratedBatches.flatMap((batch) => batch.imageUrls),
  ]);
  const hasGenerationResults = visibleGeneratedImageUrls.length > 0;

  // Mirror the latest committed session into the ref so the unmount writer below
  // persists exactly what was on screen at close. Campaign context only — the
  // library flow leaves this null so it never writes the store.
  useEffect(() => {
    if (!isCampaignContext) {
      sessionSnapshotRef.current = null;
      return;
    }
    sessionSnapshotRef.current = {
      adAccountId,
      batches: [
        ...(currentBatchImageUrls.length > 0
          ? [{ id: PERSISTED_CURRENT_BATCH_ID, imageUrls: currentBatchImageUrls }]
          : []),
        ...previousGeneratedBatches,
      ],
      hiddenImageUrls: [...hiddenImageUrls],
      referenceAssetIds: referenceAssetIds.length > 0 ? referenceAssetIds : undefined,
      reportContextByImageUrl,
      selectedImageUrls: [...selectedImageUrls],
      universeId: effectiveUniverseId,
      userPrompt,
    };
  }, [
    adAccountId,
    currentBatchImageUrls,
    effectiveUniverseId,
    hiddenImageUrls,
    isCampaignContext,
    previousGeneratedBatches,
    referenceAssetIds,
    reportContextByImageUrl,
    selectedImageUrls,
    userPrompt,
  ]);

  // Persist the campaign session on unmount (drawer close) so reopening restores
  // the previously generated creatives. A successful save clears the store
  // first, so a snapshot with no generated images is never written back.
  const persistSessionRef = useRef(setAiCreateSession);
  persistSessionRef.current = setAiCreateSession;
  const clearSessionRef = useRef(clearAiCreateSession);
  clearSessionRef.current = clearAiCreateSession;
  useEffect(
    () => () => {
      const snapshot = sessionSnapshotRef.current;
      if (snapshot == null) {
        return;
      }
      // Only persist when at least one *visible* (non-hidden) generated image
      // remains. After "Add to campaign" hides the just-added tiles, a session
      // whose images are now all hidden shouldn't resurrect an empty grid on
      // reopen.
      const hidden = new Set(snapshot.hiddenImageUrls);
      const hasVisibleImage = snapshot.batches.some((batch) =>
        batch.imageUrls.some((imageUrl) => !hidden.has(imageUrl)),
      );
      if (hasVisibleImage) {
        persistSessionRef.current(snapshot);
      } else {
        // If everything is hidden, clear any older persisted snapshot so the next
        // reopen starts fresh instead of resurrecting stale images.
        clearSessionRef.current();
      }
    },
    [],
  );

  // Keep focus inside the drawer across generate start/stop. Enter-to-submit
  // disables the focused prompt, and a finished generation can disable Generate
  // (quota hit 0); the browser blurs the disabled control and the Sheet's focus
  // trap then rings the whole dialog. On each transition, if focus escaped to the
  // body/dialog root, pull it back — leaving deliberate moves (e.g. close) alone.
  const wasGeneratingRef = useRef(isGenerating);
  useLayoutEffect(() => {
    const wasGenerating = wasGeneratingRef.current;
    wasGeneratingRef.current = isGenerating;
    if (wasGenerating === isGenerating) {
      return;
    }
    const active = document.activeElement;
    const focusEscaped =
      active == null ||
      active === document.body ||
      (active instanceof HTMLElement && active.getAttribute('role') === 'dialog');
    if (!focusEscaped) {
      return;
    }
    if (isGenerating) {
      // Park focus on the ring-less results region (tabIndex=-1 + outline:none),
      // not the Stop button — its focus-visible ring reads as a stray highlight.
      // Button is the fallback if the region hasn't mounted yet.
      if (generatedSectionRef.current != null) {
        generatedSectionRef.current.focus({ preventScroll: true });
      } else {
        actionButtonRef.current?.focus({ preventScroll: true });
      }
      return;
    }
    // Generation finished: prefer the prompt, falling back to the results region
    // when the prompt is still disabled (quota exhausted).
    const promptTextarea = promptTextareaRef.current;
    if (promptTextarea != null && !promptTextarea.disabled) {
      promptTextarea.focus({ preventScroll: true });
      return;
    }
    generatedSectionRef.current?.focus({ preventScroll: true });
  }, [isGenerating]);

  const trimmedPrompt = userPrompt.trim();
  // Build the rotation list once per locale: keep only keys that resolve to a
  // real (non-key) string and de-dupe, so missing translations don't leave the
  // overlay flashing a raw key or a duplicate hint.
  const rotatingPromptHints = useMemo<string[]>(() => {
    const hints: string[] = [];
    const seen = new Set<string>();
    PROMPT_HINT_CANDIDATE_KEYS.forEach((hintKey) => {
      const translatedHint = translate(hintKey);
      if (translatedHint === hintKey || seen.has(translatedHint)) {
        return;
      }
      seen.add(translatedHint);
      hints.push(translatedHint);
    });
    return hints;
  }, [translate]);
  const activePromptHint = rotatingPromptHints[activePromptHintIndex] ?? '';
  // Only show the animated hint while the field is empty, unfocused, and idle so
  // it never competes with the user's own text or the disabled/generating state.
  const showPromptHintOverlay = !isBusy && !isPromptFocused && trimmedPrompt.length === 0;

  useEffect(() => {
    onBusyChange?.(isBusy);
  }, [isBusy, onBusyChange]);

  useEffect(
    () => () => {
      onBusyChange?.(false);
    },
    [onBusyChange],
  );

  // Keep the active index in range if the hint list shrinks (e.g. locale swap).
  useEffect(() => {
    if (activePromptHintIndex < rotatingPromptHints.length) {
      return undefined;
    }
    setActivePromptHintIndex(0);
    return undefined;
  }, [activePromptHintIndex, rotatingPromptHints.length]);

  const selectedCount = selectedImageUrls.size;
  // The campaign already holds the maximum number of creatives (no room left),
  // so nothing the user generates can be added to the campaign — only saved to
  // the library. Surfaced as a persistent warning banner at the top of the
  // drawer. The remaining-room count is global: it's derived from the campaign
  // form's selected thumbnails, so it already accounts for everything added via
  // the upload, library, and AI drawers.
  const isCampaignFull =
    isCampaignContext && maxCampaignAddCount != null && maxCampaignAddCount === 0;
  // Campaign can't fit every selected image (existing creatives leave less room
  // than the user picked). Gate "Add to campaign" so only "Add to library" works.
  const isOverCampaignLimit =
    isCampaignContext && maxCampaignAddCount != null && selectedCount > maxCampaignAddCount;

  // Save the selected images to the library. In the campaign flow this closes
  // the drawer afterwards (the saved creatives now live in the library, so the
  // user is done here); in the standalone library flow we stay open so the user
  // can keep generating. Shared by the campaign "Add to library" secondary
  // action and the standalone "Save selected" button.
  const handleAddToLibrary = useCallback(() => {
    if (selectedImageUrls.size === 0 || isBusy) {
      return;
    }
    const savedImageUrls = [...selectedImageUrls];
    setPendingSaveAction('library');
    saveMutation.mutate(undefined, {
      onSuccess: (registered) => {
        logNativeImpressionEvent(EventName.AiCreativeSavedToLibrary, {
          savedCount: String(registered.length),
        });
        onSaved?.(registered);
        // Seed thumbnail caches so library tiles render instantly before the
        // thumbnails service catches up to the freshly registered assets.
        registered.forEach(({ assetId, file }, index) => {
          setBlobByAssetId(assetId, file);
          const previewUrl = savedImageUrls[index];
          if (previewUrl) {
            setPreviewUrlByAssetId(assetId, previewUrl);
          }
        });
        saveMutation.reset();
        if (isCampaignContext) {
          // Close the drawer — like "Add to campaign", this ends the session.
          // Clear the persisted session (and null the snapshot) so reopening
          // doesn't resurrect the just-saved creatives. The drawer owns
          // post-close feedback, so request the success snackbar at close time
          // instead of rendering one in-drawer.
          clearAiCreateSession();
          sessionSnapshotRef.current = null;
          onRequestClose?.({ showAddedToLibraryToast: true });
          return;
        }
        setToast({ message: translate('Message.AddedToLibrary'), severity: 'success' });
        // Standalone flow stays open so the user can keep generating, so we
        // preserve the prompt and any *unsaved* generated images. The images we
        // just saved now live in the library, so drop them from the generated
        // grid by hiding them and clearing them from the selection.
        setHiddenImageUrls((current) => {
          const next = new Set(current);
          savedImageUrls.forEach((imageUrl) => next.add(imageUrl));
          return next;
        });
        setSelectedImageUrls((current) => {
          const next = new Set(current);
          savedImageUrls.forEach((imageUrl) => next.delete(imageUrl));
          return next;
        });
      },
    });
  }, [
    clearAiCreateSession,
    isBusy,
    isCampaignContext,
    onRequestClose,
    onSaved,
    saveMutation,
    selectedImageUrls,
    setBlobByAssetId,
    setPreviewUrlByAssetId,
    translate,
  ]);

  // Register the selected images to the library, then hand them to the campaign.
  // Disabled when the selection can't fit the campaign (see `isOverCampaignLimit`).
  const handleAddToCampaign = useCallback(() => {
    if (selectedImageUrls.size === 0 || isBusy || isOverCampaignLimit) {
      return;
    }
    const savedImageUrls = [...selectedImageUrls];
    setPendingSaveAction('campaign');
    saveMutation.mutate(undefined, {
      onSuccess: (registered) => {
        onSaved?.(registered);
        registered.forEach(({ assetId, file }, index) => {
          setBlobByAssetId(assetId, file);
          const previewUrl = savedImageUrls[index];
          if (previewUrl) {
            setPreviewUrlByAssetId(assetId, previewUrl);
          }
        });

        // Keep the generated session alive so reopening the campaign drawer
        // shows the creatives the user *didn't* add: hide + deselect just the
        // added tiles and persist the remainder. The drawer closes in this same
        // handler, and pending state updates on an unmounting component are
        // dropped — so we write the store directly (and mirror it into the
        // snapshot ref) instead of relying on a re-render + the unmount writer.
        // When nothing visible remains, clear the session so a reopen is clean.
        const savedUrlSet = new Set(savedImageUrls);
        const nextHiddenImageUrls = new Set([...hiddenImageUrls, ...savedImageUrls]);
        const remainingBatches: GeneratedImageBatch[] = [
          ...(currentBatchImageUrls.length > 0
            ? [{ id: PERSISTED_CURRENT_BATCH_ID, imageUrls: currentBatchImageUrls }]
            : []),
          ...previousGeneratedBatches,
        ];
        const hasRemainingVisible = remainingBatches.some((batch) =>
          batch.imageUrls.some((imageUrl) => !nextHiddenImageUrls.has(imageUrl)),
        );

        setHiddenImageUrls(nextHiddenImageUrls);
        setSelectedImageUrls((current) => {
          const next = new Set(current);
          savedImageUrls.forEach((imageUrl) => next.delete(imageUrl));
          return next;
        });

        if (hasRemainingVisible) {
          const remainingSession: AiCreateSessionSnapshot = {
            adAccountId,
            batches: remainingBatches,
            hiddenImageUrls: [...nextHiddenImageUrls],
            referenceAssetIds: referenceAssetIds.length > 0 ? referenceAssetIds : undefined,
            reportContextByImageUrl,
            selectedImageUrls: [...selectedImageUrls].filter(
              (imageUrl) => !savedUrlSet.has(imageUrl),
            ),
            universeId: effectiveUniverseId,
            userPrompt,
          };
          setAiCreateSession(remainingSession);
          sessionSnapshotRef.current = remainingSession;
        } else {
          setUserPrompt('');
          clearAiCreateSession();
          sessionSnapshotRef.current = null;
        }

        saveMutation.reset();
        onAddToCampaign?.(registered);
      },
    });
  }, [
    adAccountId,
    clearAiCreateSession,
    currentBatchImageUrls,
    effectiveUniverseId,
    hiddenImageUrls,
    isBusy,
    isOverCampaignLimit,
    onAddToCampaign,
    onSaved,
    previousGeneratedBatches,
    referenceAssetIds,
    reportContextByImageUrl,
    saveMutation,
    selectedImageUrls,
    setAiCreateSession,
    setBlobByAssetId,
    setPreviewUrlByAssetId,
    userPrompt,
  ]);

  // `handleAddToCampaign`/`handleAddToLibrary` get a fresh identity every render
  // (their deps include React Query's per-render mutation objects), so they
  // can't go straight into the footer effect's dep array without re-firing it on
  // every render. Wrap them in stable callbacks that read the latest handler
  // from a ref; the footer effect then depends only on the display primitives.
  const saveHandlersRef = useRef({ handleAddToCampaign, handleAddToLibrary });
  useEffect(() => {
    saveHandlersRef.current = { handleAddToCampaign, handleAddToLibrary };
  }, [handleAddToCampaign, handleAddToLibrary]);
  const stableAddToCampaign = useCallback(() => {
    saveHandlersRef.current.handleAddToCampaign();
  }, []);
  const stableAddToLibrary = useCallback(() => {
    saveHandlersRef.current.handleAddToLibrary();
  }, []);

  // Lift the save actions up to the drawer footer. Pushes `null` while there's
  // nothing to act on (no results, or a generation in flight) so the footer
  // falls back to just Close. Depends only on stable callbacks + display
  // primitives so it fires only when the footer's appearance actually changes —
  // depending on the unstable save handlers would loop (effect → setFooterState
  // → re-render → new handlers → effect …) once results exist.
  useEffect(() => {
    if (onFooterStateChange == null) {
      return;
    }
    if (!hasGenerationResults || isGenerating) {
      onFooterStateChange(null);
      return;
    }
    onFooterStateChange({
      addToCampaign: isCampaignContext
        ? {
            isDisabled: selectedCount === 0 || isSaving || isOverCampaignLimit,
            isLoading: isSaving && pendingSaveAction === 'campaign',
            label: translate('Action.AddToCampaign'),
            onClick: stableAddToCampaign,
            // Explain the disabled state only when it's the creative limit (not an
            // empty selection): the campaign can't fit the current selection.
            tooltip: isOverCampaignLimit
              ? translate('Description.CreativeLimitReachedTooltip')
              : undefined,
          }
        : undefined,
      addToLibrary: {
        isDisabled: selectedCount === 0 || isSaving,
        isLoading: isCampaignContext ? isSaving && pendingSaveAction === 'library' : isSaving,
        label: isCampaignContext
          ? translate('Action.AddToLibrary')
          : translate('Action.SaveSelected'),
        onClick: stableAddToLibrary,
      },
      saveErrorMessage: saveMutation.isError
        ? translate('Message.SaveGeneratedCreativeFailed')
        : undefined,
    });
  }, [
    hasGenerationResults,
    isCampaignContext,
    isGenerating,
    isOverCampaignLimit,
    isSaving,
    onFooterStateChange,
    pendingSaveAction,
    saveMutation.isError,
    selectedCount,
    stableAddToCampaign,
    stableAddToLibrary,
    translate,
  ]);

  useEffect(
    () => () => {
      onFooterStateChange?.(null);
    },
    [onFooterStateChange],
  );

  if (!isGenAiCreativesEnabled) {
    return null;
  }

  // Remaining generations for display + proactive gating, read from the store
  // quota (seeded by metadata, decremented per successful generation). Null when
  // no quota was provided (rate limiting off / account bypassed / backend
  // unavailable), in which case we render nothing and never gate on it. The 429
  // path stays as the backstop for a stale seed (e.g. usage from another tab).
  const remainingRequests = genAiCreativesQuota?.remaining ?? null;
  const quotaLimit = genAiCreativesQuota?.limit ?? null;
  // Circle fill tracks remaining quota (full at start, drains as requests are used).
  const quotaRemainingPercent =
    quotaLimit != null && quotaLimit > 0 && remainingRequests != null
      ? Math.min(100, (remainingRequests / quotaLimit) * 100)
      : 0;
  const showRequestsQuota = genAiCreativesQuota != null;
  const isQuotaExhausted = remainingRequests === 0;

  const canGenerate =
    effectiveUniverseId != null &&
    trimmedPrompt.length > 0 &&
    trimmedPrompt.length <= maxPromptLength &&
    !isQuotaExhausted &&
    // Only an invalid prompt locks the button (see isInvalidPromptError); rate
    // limits and transient failures stay resubmittable so a one-off error can't
    // strand the user.
    !isInvalidPromptError &&
    !isBusy;
  const isGameMissingForGenerate = effectiveUniverseId == null;
  const isPromptMissingForGenerate = trimmedPrompt.length === 0;
  const shouldShowGenerateRequirementsTooltip =
    !isGenerating &&
    !canGenerate &&
    !isQuotaExhausted &&
    !isInvalidPromptError &&
    (isGameMissingForGenerate || isPromptMissingForGenerate);

  const handlePromptChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setUserPrompt(event.target.value.slice(0, maxPromptLength));
    // Any prompt edit is a new user action, so clear stale inline failures.
    if (generateMutation.isError) {
      generateMutation.reset();
    }
    if (saveMutation.isError) {
      saveMutation.reset();
    }
  };

  // Advance to the next hint when the current one finishes its fade-out. Driving
  // rotation from the animation (not a JS interval) keeps the cadence defined
  // solely by the CSS and lands the swap exactly as the fade-out completes.
  // Single-hint lists don't rotate (and reduced-motion disables the animation,
  // so it intentionally stops rotating too).
  const handleHintAnimationEnd = () => {
    if (rotatingPromptHints.length <= 1) {
      return;
    }
    setActivePromptHintIndex((currentIndex) => (currentIndex + 1) % rotatingPromptHints.length);
  };

  const handleToggleGeneratedImage = (imageUrl: string) => {
    if (saveMutation.isError) {
      saveMutation.reset();
    }
    setSelectedImageUrls((current) => {
      const next = new Set(current);
      if (next.has(imageUrl)) {
        next.delete(imageUrl);
      } else {
        next.add(imageUrl);
      }
      return next;
    });
  };

  // "Clear all" next to the selection count deselects every generated image; it
  // doesn't remove them from the grid. Disabled when nothing is selected.
  const handleClearSelection = () => {
    if (saveMutation.isError) {
      saveMutation.reset();
    }
    setSelectedImageUrls(new Set());
  };

  const handleHideGeneratedImage = (imageUrl: string) => {
    if (saveMutation.isError) {
      saveMutation.reset();
    }
    setHiddenImageUrls((current) => {
      const next = new Set(current);
      next.add(imageUrl);
      return next;
    });
    setSelectedImageUrls((current) => {
      if (!current.has(imageUrl)) {
        return current;
      }
      const next = new Set(current);
      next.delete(imageUrl);
      return next;
    });
  };

  const handleDontShowGeneratedImage = (imageUrl: string) => {
    logNativeClickEvent(EventName.AiCreativeDontShowClicked);
    handleHideGeneratedImage(imageUrl);
  };

  const handleSubmitCreativeFeedback = (payload: AiCreativeFeedbackSubmitPayload) => {
    // Optimistically remove the reported image from the selection flow so it can't be
    // saved or added while the report request is in flight. On success it stays hidden;
    // on failure the mutation's onError restores it to the grid so the user can retry.
    handleHideGeneratedImage(payload.imageUrl);
    reportMutation.mutate(payload);
  };

  const handleOpenReportDialog = (imageUrl: string) => {
    logNativeClickEvent(EventName.AiCreativeReportClicked);
    openAiCreativeFeedbackDialog(imageUrl, handleSubmitCreativeFeedback);
  };

  const handleRegenerate = () => {
    // Snapshot the current batch straight from the cache before startGenerate's
    // reset() clears it, archiving it into the "previously generated" history.
    const current = generateMutation.data?.generatedImages ?? [];
    if (current.length > 0) {
      setPreviousGeneratedBatches((previous) => [
        { id: crypto.randomUUID(), imageUrls: current },
        ...previous,
      ]);
    }
    startGenerate();
  };

  // Bottom-of-card primary control: kicks off the first generation, or archives
  // the current batch and regenerates once results already exist.
  const handleGenerateOrRegenerate = () => {
    if (saveMutation.isError) {
      saveMutation.reset();
    }
    logNativeClickEvent(EventName.AiCreativeGenerateClicked, {
      isRegenerate: String(hasCurrentGeneratedImages),
    });
    if (isCampaignContext) {
      logNativeClickEvent(EventName.CampaignCreativeSourceSelected, {
        source: 'ai',
      });
    }
    if (hasCurrentGeneratedImages) {
      handleRegenerate();
    } else {
      startGenerate();
    }
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter') {
      return;
    }
    // Shift+Enter stays as newline; plain Enter submits generation.
    if (event.shiftKey) {
      return;
    }
    event.preventDefault();
    if (canGenerate) {
      handleGenerateOrRegenerate();
    }
  };

  const handleStopGenerate = () => {
    invalidateInFlightGeneration();
    generateMutation.reset();
  };

  const handleUniverseChange = (value: string) => {
    if (saveMutation.isError) {
      saveMutation.reset();
    }
    const nextUniverseId = Number(value);
    const shouldClearGenerationResults =
      showGameSelector &&
      hasGenerationResults &&
      (selectedUniverseId == null || nextUniverseId !== selectedUniverseId);
    if (shouldClearGenerationResults) {
      resetGenerationSession();
    }
    setSelectedUniverseId(nextUniverseId);
  };

  if (step === AiCreateStep.AGREEMENT) {
    return (
      <div className='flex flex-col gap-large width-full'>
        <div className='flex flex-col gap-xsmall'>
          <p className='text-title-large content-default margin-[0px]'>
            {translate('Heading.AiGeneratedThumbnails')}
          </p>
          <p className='text-body-medium content-default margin-[0px]'>
            {translateHTML('Description.AiCreativesAgreement', [
              {
                closing: 'communityStandardsLinkEnd',
                content: (chunks) => (
                  <Link
                    href='https://en.help.roblox.com/hc/articles/203313410'
                    isExternal={false}
                    rel='noopener noreferrer'
                    target='_blank'>
                    {chunks}
                  </Link>
                ),
                opening: 'communityStandardsLinkStart',
              },
              {
                closing: 'privacyPolicyLinkEnd',
                content: (chunks) => (
                  <Link
                    href='https://www.roblox.com/info/privacy'
                    isExternal={false}
                    rel='noopener noreferrer'
                    target='_blank'>
                    {chunks}
                  </Link>
                ),
                opening: 'privacyPolicyLinkStart',
              },
              {
                closing: 'termsOfUseLinkEnd',
                content: (chunks) => (
                  <Link
                    href='https://www.roblox.com/info/terms'
                    isExternal={false}
                    rel='noopener noreferrer'
                    target='_blank'>
                    {chunks}
                  </Link>
                ),
                opening: 'termsOfUseLinkStart',
              },
            ])}
          </p>
        </div>
        <div className='flex'>
          <Button
            className='min-width-[96px]'
            onClick={handleAcceptAgreement}
            size='Medium'
            variant='Emphasis'>
            {translate('Action.OK')}
          </Button>
        </div>
      </div>
    );
  }

  // Top-of-drawer banner: the campaign-full warning takes priority over the
  // dismissible "saved to your library" info banner (only one shows at a time).
  let topBanner: ReactNode = null;
  if (isCampaignFull) {
    topBanner = (
      <FeedbackBanner
        className={contentStyles.feedbackBanner}
        description={translate('Description.CampaignCreativeLimitReachedBanner')}
        severity='Warning'
        showIcon
        title={translate('Heading.CampaignCreativeLimitReached')}
      />
    );
  } else if (!isReviewBannerDismissed) {
    topBanner = (
      <FeedbackBanner
        className={contentStyles.feedbackBanner}
        dismissIconAriaLabel={translate('Action.Close')}
        onDismiss={() => {
          setIsReviewBannerDismissed(true);
          if (isCampaignContext) {
            setAiCreateReviewBannerDismissed(true);
          }
        }}
        severity='Info'
        showIcon
        // The design renders this as regular-weight body text, not the
        // banner's default bold (label-medium) title — pass a body-medium
        // node so it isn't bolded.
        title={
          <span className='text-body-medium content-default'>
            {translate('Message.GeneratedImagesAddedToLibrary')}
          </span>
        }
        // Design uses the blue "emphasis" FeedbackAlert (system-emphasis border
        // + tinted fill + blue info icon), not the muted Standard variant.
        variant='Emphasis'
      />
    );
  }

  // Helper line under the prompt card. Priority: a reactive request failure
  // (red alert) > a proactive "out of generations" notice (muted, expected, the
  // input is already disabled) > the standard AI disclaimer.
  let promptHelperMessage: ReactNode;
  if (hasInlineGenerateError) {
    promptHelperMessage = (
      <p className='text-caption-small content-system-alert margin-[0px]' role='alert'>
        {translate(generateErrorMessageKey)}
      </p>
    );
  } else if (isQuotaExhausted) {
    promptHelperMessage = (
      <p className='text-caption-small content-muted margin-[0px]'>
        {translate('Message.GenerateCreativeRateLimited')}
      </p>
    );
  } else {
    promptHelperMessage = (
      <p className='text-caption-small content-default opacity-[0.5] margin-[0px]'>
        {translate('Description.AiCreativesDisclaimer')}
      </p>
    );
  }

  return (
    <>
      <div className={`${contentStyles.drawerScrollContent} flex flex-col gap-large width-full`}>
        {topBanner}
        <div className='flex flex-col gap-xsmall'>
          <p className='text-title-large content-default margin-[0px]'>
            {translate('Heading.GenerateAiImages')}
          </p>
          <p className='text-body-medium content-default margin-[0px]'>
            {translate('Description.GenerateAiImages')}
          </p>
        </div>

        {showGameSelector && advertisableUniverses.length > 0 ? (
          <GameUniverseDropdown
            advertisableUniverses={advertisableUniverses}
            isDisabled={isBusy}
            label={translate('Label.Game')}
            onValueChange={handleUniverseChange}
            placeholder={translate('Label.SelectAGame')}
            value={selectedUniverseId != null ? String(selectedUniverseId) : undefined}
          />
        ) : null}

        {fixedUniverseId == null && !showGameSelector ? (
          <p className='text-body-small content-muted margin-[0px]'>
            {translate('Description.SelectExperienceForAiCreate')}
          </p>
        ) : null}

        {/* Standalone (library) flow: when there's no experience to generate for
            we keep the prompt visible but explain why the generate action is
            disabled, distinguishing a fetch failure from an empty list. */}
        {showGameSelector && !isUniversesLoading && advertisableUniverses.length === 0 ? (
          <p className='text-body-small content-system-alert margin-[0px]' role='alert'>
            {translate(
              isUniversesError
                ? 'Message.AiCreateExperiencesUnavailable'
                : 'Message.AiCreateNoExperiences',
            )}
          </p>
        ) : null}

        <div className='flex flex-col gap-small width-full'>
          <div
            className={`${contentStyles.promptCard} ${
              hasInlineGenerateError ? contentStyles.promptCardError : ''
            } flex flex-col gap-medium radius-medium`}>
            <div
              className={`${contentStyles.promptInputSection} ${
                isGenerating || isQuotaExhausted ? contentStyles.promptInputSectionDisabled : ''
              } flex flex-col gap-xsmall`}>
              {isGenAiCreativesUserReferenceEnabled ? (
                <AiCreativeReferenceThumbnailsRow
                  disabled={isBusy || isQuotaExhausted}
                  onChange={(nextIds) => {
                    setReferenceAssetIds(nextIds);
                    if (generateMutation.isError) {
                      generateMutation.reset();
                    }
                  }}
                  selectedAssetIds={referenceAssetIds}
                />
              ) : null}
              <div className={contentStyles.promptInputContainer}>
                <textarea
                  aria-label={translate('Label.DescribeImagePrompt')}
                  className={contentStyles.promptTextarea}
                  disabled={isBusy || isQuotaExhausted}
                  maxLength={maxPromptLength}
                  onBlur={() => setIsPromptFocused(false)}
                  onChange={handlePromptChange}
                  onFocus={() => setIsPromptFocused(true)}
                  onKeyDown={handlePromptKeyDown}
                  placeholder={
                    showPromptHintOverlay && activePromptHint !== ''
                      ? ''
                      : translate('Label.DescribeImagePrompt')
                  }
                  ref={promptTextareaRef}
                  rows={3}
                  value={userPrompt}
                />
                {showPromptHintOverlay && activePromptHint !== '' ? (
                  <div aria-hidden className={contentStyles.promptHintOverlay}>
                    <span
                      className={`${contentStyles.promptHintText} ${
                        rotatingPromptHints.length > 1
                          ? contentStyles.promptHintTextCycle
                          : contentStyles.promptHintTextEnter
                      }`}
                      key={`${activePromptHintIndex}-${activePromptHint}`}
                      onAnimationEnd={handleHintAnimationEnd}>
                      {activePromptHint}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className='flex items-center justify-between gap-large width-full'>
              {isGenAiCreativesUserReferenceEnabled ? (
                <AiCreativeReferenceAddControl
                  disabled={isBusy || isQuotaExhausted}
                  error={
                    isReferenceAssetError ? translate(referenceAssetErrorMessageKey) : undefined
                  }
                  groupId={creativeLibraryGroupId}
                  onChange={(nextIds) => {
                    setReferenceAssetIds(nextIds);
                    if (generateMutation.isError) {
                      generateMutation.reset();
                    }
                  }}
                  selectedAssetIds={referenceAssetIds}
                />
              ) : (
                <span />
              )}
              <div className='flex items-center gap-large shrink-0'>
                {showRequestsQuota ? (
                  <Tooltip
                    contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
                    position='top-center'
                    title={translate('Label.GenAiTokensLeftToday')}>
                    <TooltipTrigger asChild>
                      <div
                        className={`${contentStyles.requestsQuotaIndicator} flex items-center gap-small shrink-0`}
                        data-testid='gen-ai-requests-quota'>
                        <ProgressCircle
                          ariaLabel={translate(
                            remainingRequests === 1
                              ? 'Label.GenAiRequestsRemainingOne'
                              : 'Label.GenAiRequestsRemainingOther',
                            { remaining: String(remainingRequests ?? 0) },
                          )}
                          size='Small'
                          value={quotaRemainingPercent}
                          variant='Determinate'
                        />
                        <span className='text-body-small content-muted whitespace-nowrap'>
                          {`${remainingRequests ?? 0}/${quotaLimit ?? 0}`}
                        </span>
                      </div>
                    </TooltipTrigger>
                  </Tooltip>
                ) : null}
                {isGenerating ? (
                  <IconButton
                    ariaLabel={translate('Action.StopGenerate')}
                    icon='icon-regular-stop-small'
                    isCircular
                    onClick={handleStopGenerate}
                    ref={actionButtonRef}
                    size='Medium'
                    variant='Standard'
                  />
                ) : (
                  <>
                    {shouldShowGenerateRequirementsTooltip ? (
                      <Tooltip
                        contentClassName={FOUNDATION_TOOLTIP_BODY_SMALL_CLASS}
                        position='left-center'
                        title={translate(
                          'Description.GenerateCreativeDisabledRequirementsTooltip',
                        )}>
                        <TooltipTrigger asChild>
                          <span className='inline-flex shrink-0'>
                            <IconButton
                              ariaLabel={translate(
                                hasCurrentGeneratedImages ? 'Action.Regenerate' : 'Action.Generate',
                              )}
                              icon='icon-regular-arrow-medium-up'
                              isCircular
                              isDisabled={!canGenerate}
                              onClick={handleGenerateOrRegenerate}
                              ref={actionButtonRef}
                              size='Medium'
                              variant='Standard'
                            />
                          </span>
                        </TooltipTrigger>
                      </Tooltip>
                    ) : (
                      <IconButton
                        ariaLabel={translate(
                          hasCurrentGeneratedImages ? 'Action.Regenerate' : 'Action.Generate',
                        )}
                        icon='icon-regular-arrow-medium-up'
                        isCircular
                        isDisabled={!canGenerate}
                        onClick={handleGenerateOrRegenerate}
                        ref={actionButtonRef}
                        size='Medium'
                        variant='Standard'
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className={contentStyles.promptHelperMessage}>{promptHelperMessage}</div>
        </div>

        {isGenerating || hasGenerationResults ? (
          <div
            className={`${contentStyles.generatedSection} flex flex-col gap-large width-full`}
            ref={generatedSectionRef}
            // tabIndex=-1 keeps this out of the tab order; it's only a
            // programmatic focus fallback (see the focus layout effect above).
            tabIndex={-1}>
            <Divider />
            <div className='flex flex-col gap-small width-full'>
              <div className='flex flex-col gap-xxsmall'>
                <p className='text-title-large content-default margin-[0px]'>
                  {translate('Heading.GeneratedImages')}
                </p>
              </div>
              <div className='flex items-center gap-small'>
                <span className='text-body-small content-muted'>
                  {translate('Label.SelectedCount', { count: String(selectedCount) })}
                </span>
                <Button
                  isDisabled={selectedCount === 0 || isSaving}
                  onClick={handleClearSelection}
                  size='XSmall'
                  variant='Utility'>
                  {translate('Action.ClearAll')}
                </Button>
              </div>
            </div>
            <div className={contentStyles.generatedTileGrid}>
              {isGenerating
                ? Array.from({ length: GENERATING_SKELETON_COUNT }, (_, index) => (
                    <div
                      className={contentStyles.generatingSkeleton}
                      key={`generating-skeleton-${index}`}>
                      <Skeleton animate height='100%' variant='rectangular' width='100%' />
                    </div>
                  ))
                : null}
              {visibleGeneratedImageUrls.map((imageUrl) => (
                <AiGeneratedImageTile
                  imageUrl={imageUrl}
                  isDisabled={isSaving}
                  isSelected={selectedImageUrls.has(imageUrl)}
                  key={imageUrl}
                  onHide={handleDontShowGeneratedImage}
                  onReport={handleOpenReportDialog}
                  onToggleSelect={handleToggleGeneratedImage}
                  showActionsMenu
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {toast != null ? (
        <GenericSnackBar
          message={toast.message}
          onClose={() => setToast(null)}
          severity={toast.severity}
        />
      ) : null}
    </>
  );
};

export default AiCreateContent;
