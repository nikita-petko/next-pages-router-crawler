import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AgreementCandidateResponse } from '@rbx/client-content-licensing-api/v1';
import { Checkbox, Icon } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { Button, CircularProgress, Skeleton, Typography } from '@rbx/ui';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import type { UniverseResponse } from '@modules/clients/develop';
import { useQueryParams } from '@modules/miscellaneous/hooks';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useIpSnackbar from '../../../hooks/useIpSnackbar';
import { EXTERNAL_EXPERIENCE_HREF } from '../../urls';
import MatchDetailsTabs from '../enums/MatchDetailsTabs';
import { useGetPlacefileImagesQuery } from '../hooks/useGetPlacefileImagesQuery';
import { usePlacefileImageUrlsQuery } from '../hooks/usePlacefileImageUrlsQuery';
import type { InspectorImage } from './ScreenshotInspector';
import ScreenshotInspector from './ScreenshotInspector';

const galleryGridClassName =
  'grid gap-medium items-start [grid-template-columns:repeat(auto-fill,184px)]';
const galleryCellFillClassName = 'absolute inset-0 width-full height-full';
const galleryCellClassName = 'width-full relative clip radius-medium [aspect-ratio:4/3]';
const galleryImageClassName = `[object-fit:cover] ${galleryCellFillClassName}`;

const CHECKBOX_OVERLAY_CLASS = 'absolute [top:8px] [left:8px]';
const EMPTY_STATE_CLASS =
  'grow flex flex-col justify-center items-center gap-large min-height-[480px] padding-x-medium';
const EMPTY_STATE_TITLE_CLASS = 'text-heading-medium content-emphasis margin-none max-width-[28ch]';
const EMPTY_STATE_TEXT_CLASS = 'flex flex-col items-center text-align-x-center gap-small';
const EMPTY_STATE_ICON_CLASS = 'content-emphasis width-[80px] height-[80px]';
const LOADING_STATE_CLASS = 'grow flex justify-center items-center min-height-[480px]';

const NEUTRAL_TOAST_CLASS =
  '[background-color:#fff] [color:#1b1b1f] radius-medium padding-y-medium padding-x-large text-body-medium text-align-x-center [box-shadow:0px_6px_16px_rgba(0,0,0,0.24)]';

interface GalleryCell {
  key: string;
  src: string;
  assetId: number;
}

interface GalleryTabContentProps {
  candidate: AgreementCandidateResponse;
  universe: UniverseResponse;
}

/**
 * Gallery tab content for the experience preview page: a header showing the (selected/total) image
 * count and Inspect/Clear actions, plus a grid of the detected screenshots. Each cell can be toggled
 * via a hover-revealed checkbox; selections persist and are stored in the order clicked so a
 * downstream inspector can honor that order. When no screenshots resolve, an empty state is shown.
 */
const GalleryTabContent: FunctionComponent<GalleryTabContentProps> = ({ candidate, universe }) => {
  const translation = useTranslation();
  const { tPendingTranslation } = useTranslationWrapper(translation);
  const { enqueueWithDefaults } = useIpSnackbar();

  const inspectorTitle = universe.name?.trim() ? universe.name : '';
  const inspectorRootPlaceId =
    universe.rootPlaceId != null && universe.rootPlaceId > 0 ? universe.rootPlaceId : undefined;
  const inspectorHref =
    inspectorRootPlaceId != null ? EXTERNAL_EXPERIENCE_HREF(inspectorRootPlaceId) : undefined;

  const placefileImagesQuery = useGetPlacefileImagesQuery({
    agreementCandidateId: candidate.id ?? undefined,
    enabled: true,
  });
  const placefileAssetIds = placefileImagesQuery.data ?? [];
  const placefileImageUrlsQuery = usePlacefileImageUrlsQuery(placefileAssetIds);

  // Show a spinner until we know the actual resolvable screenshot URLs. The detected asset-id count
  // can over-count (moderated assets don't resolve to a URL), so we can't render an accurate grid
  // until resolution finishes. Once resolved, each tile shows its own skeleton until the image loads.
  const isLoading =
    placefileImagesQuery.isLoading ||
    (placefileAssetIds.length > 0 && placefileImageUrlsQuery.isLoading);

  // Resolve detected asset ids to loadable URLs (moderated assets won't resolve and are dropped),
  // preserving asset-id order. Each cell keeps its (stable) asset id so a screenshot can be referenced
  // by id in shareable deep links, independent of grid position or the (signed/expiring) image URL.
  // Keyed on the stable query-data references so the grid only recomputes when the data changes.
  const cells = useMemo<GalleryCell[]>(() => {
    const assetIds = placefileImagesQuery.data ?? [];
    const urlsByAssetId = placefileImageUrlsQuery.data;
    return assetIds
      .map((assetId) => ({ assetId, src: urlsByAssetId?.get(assetId) }))
      .filter((entry): entry is { assetId: number; src: string } => Boolean(entry.src))
      .map(({ assetId, src }, index) => ({ key: `real-${index}`, assetId, src }));
  }, [placefileImagesQuery.data, placefileImageUrlsQuery.data]);
  const totalCount = cells.length;

  // Selected cell keys stored in the order clicked (not sorted) so a downstream inspector view can
  // present the selection in that same order.
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Tracks which resolved images have finished loading so each tile shows a skeleton until its image
  // is ready (per-image, so the grid renders at the correct resolved count with no flash/jump).
  const [loadedKeys, setLoadedKeys] = useState<ReadonlySet<string>>(() => new Set());
  const selectedCount = selectedKeys.length;
  const hasSelection = selectedCount > 0;

  const markImageLoaded = useCallback((key: string) => {
    setLoadedKeys((prev) => {
      if (prev.has(key)) {
        return prev;
      }
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, []);

  const toggleSelection = useCallback((key: string) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((selectedKey) => selectedKey !== key) : [...prev, key],
    );
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedKeys([]);
  }, []);

  // Deep link: `?tab=Gallery&inspect=<assetId>` opens the inspector on just that screenshot once the
  // grid resolves.
  const [inspectQueryParams, setInspectQueryParams] = useQueryParams(['inspect']);
  const rawInspect = inspectQueryParams.inspect;
  const inspectAssetIdParam = Array.isArray(rawInspect) ? rawInspect[0] : (rawInspect ?? undefined);

  // Button-initiated inspector: holds the ordered snapshot (all/selected) taken when it was opened.
  const [inspectorImages, setInspectorImages] = useState<InspectorImage[] | null>(null);
  // A valid `?inspect=<assetId>` shows just that screenshot. Derived in render (not stored via an
  // effect) so opening from a deep link doesn't require a setState-in-effect.
  const deepLinkImages = useMemo<InspectorImage[] | null>(() => {
    if (!inspectAssetIdParam || isLoading) {
      return null;
    }
    const matchingCell = cells.find((cell) => String(cell.assetId) === inspectAssetIdParam);
    return matchingCell ? [matchingCell] : null;
  }, [cells, inspectAssetIdParam, isLoading]);
  const activeInspectorImages = inspectorImages ?? deepLinkImages;
  const isInspectorOpen = activeInspectorImages !== null;
  // Also drop the `inspect` param on close so a deep-linked view doesn't persist in the URL (a refresh
  // then lands on the gallery instead of reopening the inspector). No-ops when the param is absent.
  const closeInspector = useCallback(() => {
    setInspectorImages(null);
    setInspectQueryParams({ inspect: null }, { skipHistory: true });
  }, [setInspectQueryParams]);

  // Images to inspect from the header button, ordered to match what the user asked for: all screenshots
  // in grid order, or — when a selection exists — only the selected ones in the order they were clicked.
  const orderedInspectorImages = useMemo(() => {
    if (selectedKeys.length === 0) {
      return cells;
    }
    const cellsByKey = new Map(cells.map((cell) => [cell.key, cell]));
    return selectedKeys
      .map((key) => cellsByKey.get(key))
      .filter((cell): cell is GalleryCell => cell != null);
  }, [cells, selectedKeys]);

  const openInspector = useCallback(
    () => setInspectorImages(orderedInspectorImages),
    [orderedInspectorImages],
  );

  const getShareUrl = useCallback((image: InspectorImage) => {
    if (typeof window === 'undefined') {
      return '';
    }
    const params = new URLSearchParams();
    params.set('tab', MatchDetailsTabs.Gallery);
    params.set('inspect', String(image.assetId));
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }, []);

  const showNeutralToast = useCallback(
    (message: string) => {
      enqueueWithDefaults({
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
        children: (
          <div role='alert' className={NEUTRAL_TOAST_CLASS}>
            {message}
          </div>
        ),
      });
    },
    [enqueueWithDefaults],
  );

  // TODO: Add pending translations. Ticket: EXP-40. Owner: vkakar
  const screenshotUnavailableLabel = tPendingTranslation(
    'Screenshot no longer available',
    'Bottom popup shown when a shared screenshot deep link points to an image that no longer resolves for Experience Preview.',
    translationKey('Label.ScreenshotNoLongerAvailable', TranslationNamespace.AgreementsManager),
  );
  const notifyScreenshotUnavailable = useCallback(
    () => showNeutralToast(screenshotUnavailableLabel),
    [showNeutralToast, screenshotUnavailableLabel],
  );

  // TODO: Add pending translations. Ticket: EXP-40. Owner: vkakar
  const linkCopiedLabel = tPendingTranslation(
    'Link copied',
    'Bottom popup shown after copying a deep link to a screenshot from the inspector in Experience Preview.',
    translationKey('Label.LinkCopied', TranslationNamespace.AgreementsManager),
  );
  const notifyLinkCopied = useCallback(
    () => showNeutralToast(linkCopiedLabel),
    [showNeutralToast, linkCopiedLabel],
  );

  // An unresolvable `?inspect=<assetId>` (once data has settled) can't be shown: surface a popup and
  // drop the param so a refresh stays on the gallery. Only side effects here (toast + URL change, no
  // React state), and the ref makes it fire once per bad id.
  const notifiedUnavailableAssetIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!inspectAssetIdParam || isLoading) {
      return;
    }
    if (notifiedUnavailableAssetIdRef.current === inspectAssetIdParam) {
      return;
    }
    const matchingCell = cells.find((cell) => String(cell.assetId) === inspectAssetIdParam);
    if (matchingCell) {
      return;
    }
    notifiedUnavailableAssetIdRef.current = inspectAssetIdParam;
    notifyScreenshotUnavailable();
    setInspectQueryParams({ inspect: null }, { skipHistory: true });
  }, [cells, inspectAssetIdParam, isLoading, notifyScreenshotUnavailable, setInspectQueryParams]);

  // TODO: Add pending translations. Ticket: EXP-39. Owner: vkakar
  let imageCountLabel: string;
  if (hasSelection) {
    imageCountLabel = tPendingTranslation(
      '{selected}/{total} images',
      'Screenshot count in the experience preview gallery when some are selected; {selected} images of {total} images are selected.',
      translationKey('Label.GallerySelectedImageCount', TranslationNamespace.AgreementsManager),
      { selected: String(selectedCount), total: String(totalCount) },
    );
  } else if (totalCount === 1) {
    imageCountLabel = tPendingTranslation(
      '1 image',
      'Screenshot count shown in the top-left of the experience preview gallery when there is one image.',
      translationKey('Label.GalleryImageCountSingular', TranslationNamespace.AgreementsManager),
    );
  } else {
    imageCountLabel = tPendingTranslation(
      '{count} images',
      'Screenshot count shown in the top-left of the experience preview gallery; {count} is the number of images.',
      translationKey('Label.GalleryImageCount', TranslationNamespace.AgreementsManager),
      { count: String(totalCount) },
    );
  }

  // TODO: Add pending translations. Ticket: EXP-39. Owner: vkakar
  const inspectLabel = hasSelection
    ? tPendingTranslation(
        'Inspect screenshots',
        'Button that opens the inspector for the currently selected screenshots in Experience Preview Gallery tab.',
        translationKey('Action.InspectScreenshots', TranslationNamespace.AgreementsManager),
      )
    : tPendingTranslation(
        'Inspect all screenshots',
        'Button that opens the inspector for all screenshots when none are selected in Experience Preview Gallery tab.',
        translationKey('Action.InspectAllScreenshots', TranslationNamespace.AgreementsManager),
      );

  // TODO: Add pending translations. Ticket: EXP-39. Owner: vkakar
  const clearSelectionLabel = tPendingTranslation(
    'Clear selection',
    'Button that clears all currently selected screenshots in the experience preview gallery.',
    translationKey('Action.ClearSelection', TranslationNamespace.AgreementsManager),
  );

  // TODO: Add pending translations. Ticket: EXP-39. Owner: vkakar
  const toggleSelectionLabel = tPendingTranslation(
    'Select screenshot',
    'Accessible label for the checkbox that toggles selection of a screenshot in the Experience Preview gallery.',
    translationKey('Action.SelectScreenshot', TranslationNamespace.AgreementsManager),
  );

  if (isLoading) {
    return (
      <div className={LOADING_STATE_CLASS}>
        <CircularProgress />
      </div>
    );
  }

  if (totalCount === 0) {
    // TODO: Add pending translations. Ticket: EXP-39. Owner: vkakar
    const emptyStateTitle = tPendingTranslation(
      'Images are not available for this experience',
      'Heading of the empty state shown on the gallery tab when no screenshots were detected.',
      translationKey('Label.GalleryImagesUnavailableTitle', TranslationNamespace.AgreementsManager),
    );
    // TODO: Add pending translations. Ticket: EXP-39. Owner: vkakar
    const emptyStateDescription = tPendingTranslation(
      'Please check back later.',
      'Body text of the empty state shown on the gallery tab when no screenshots were detected.',
      translationKey(
        'Label.GalleryImagesUnavailableDescription',
        TranslationNamespace.AgreementsManager,
      ),
    );

    return (
      <div className={EMPTY_STATE_CLASS} data-testid='gallery-empty-state'>
        <Icon name='icon-regular-triangle-exclamation' className={EMPTY_STATE_ICON_CLASS} />
        <div className={EMPTY_STATE_TEXT_CLASS}>
          <Typography className={EMPTY_STATE_TITLE_CLASS}>{emptyStateTitle}</Typography>
          <Typography className='text-body-medium content-muted margin-none'>
            {emptyStateDescription}
          </Typography>
        </div>
      </div>
    );
  }

  const renderCell = (cell: GalleryCell) => {
    const isSelected = selectedKeys.includes(cell.key);
    const showCheckbox = isSelected || hoveredKey === cell.key;
    const isImageLoaded = loadedKeys.has(cell.key);
    return (
      <div
        key={cell.key}
        className={galleryCellClassName}
        onMouseEnter={() => setHoveredKey(cell.key)}
        onMouseLeave={() => setHoveredKey((current) => (current === cell.key ? null : current))}>
        <img
          className={galleryImageClassName}
          src={cell.src}
          alt=''
          onLoad={() => markImageLoaded(cell.key)}
          onError={() => markImageLoaded(cell.key)}
        />
        {!isImageLoaded && (
          <Skeleton animate variant='rectangular' className={galleryCellFillClassName} />
        )}
        {showCheckbox && (
          <div className={CHECKBOX_OVERLAY_CLASS}>
            <Checkbox
              size='Medium'
              placement='End'
              aria-label={toggleSelectionLabel}
              isChecked={isSelected}
              onCheckedChange={() => toggleSelection(cell.key)}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='flex flex-col gap-large'>
      <div className='flex justify-between items-center gap-medium'>
        <Typography
          className='text-body-large content-muted margin-none'
          data-testid='gallery-image-count'>
          {imageCountLabel}
        </Typography>
        <div className='flex items-center gap-small'>
          <Button
            variant='contained'
            color='secondary'
            onClick={openInspector}
            data-testid='gallery-inspect-button'>
            {inspectLabel}
          </Button>
          {hasSelection && (
            <Button
              variant='text'
              color='secondary'
              onClick={clearSelection}
              data-testid='gallery-clear-selection-button'>
              {clearSelectionLabel}
            </Button>
          )}
        </div>
      </div>

      <div className={galleryGridClassName}>{cells.map(renderCell)}</div>

      {isInspectorOpen && activeInspectorImages && (
        <ScreenshotInspector
          images={activeInspectorImages}
          title={inspectorTitle}
          experienceHref={inspectorHref}
          getShareUrl={getShareUrl}
          onLinkCopied={notifyLinkCopied}
          onClose={closeInspector}
        />
      )}
    </div>
  );
};

export default GalleryTabContent;
