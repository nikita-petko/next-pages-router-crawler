import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslationWithNamespace } from '@rbx/intl';
import { useNeutralIpSnackbar } from '@modules/ip/hooks/useIpSnackbar';
import type { InspectorImage } from '@modules/ip/license-manager/agreements/components/ImageInspector';
import { useAssetImageUrlsQuery } from '@modules/ip/license-manager/agreements/hooks/useAssetImageUrlsQuery';
import useQueryParams, {
  normalizeSingleQueryParam,
} from '@modules/miscellaneous/hooks/useQueryParams';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { CreatorPitchAttachmentStatus } from '../utils/constants';
import type { CreatorPitchAttachment } from '../utils/creatorPitchAttachmentTypes';

interface UsePitchImageAttachmentsInspectorParams {
  attachments: CreatorPitchAttachment[];
  imgSharingBaseUrl?: string;
  accessContext?: string;
}

const usePitchImageAttachmentsInspector = ({
  attachments,
  imgSharingBaseUrl,
  accessContext,
}: UsePitchImageAttachmentsInspectorParams) => {
  const { translate: translateAgreements } = useTranslationWithNamespace(
    TranslationNamespace.AgreementsManager,
  );
  const enqueueNeutralSnackbar = useNeutralIpSnackbar();
  const [inspectQueryParams, setInspectQueryParams] = useQueryParams(['inspect']);
  const [inspectedAssetId, setInspectedAssetId] = useState<number | null>(null);
  const canShare = imgSharingBaseUrl != null && imgSharingBaseUrl !== '';
  const imageAssetIds = useMemo(
    () =>
      attachments.flatMap((attachment) =>
        attachment.status === CreatorPitchAttachmentStatus.Ready && attachment.assetId != null
          ? [attachment.assetId]
          : [],
      ),
    [attachments],
  );
  const { data: imageUrls, isLoading: areImageUrlsLoading } = useAssetImageUrlsQuery(
    imageAssetIds,
    true,
    accessContext,
  );
  const inspectorImages = useMemo<InspectorImage[]>(
    () =>
      imageAssetIds.flatMap((assetId) => {
        const src = imageUrls?.get(assetId);
        return src != null ? [{ key: String(assetId), assetId, src }] : [];
      }),
    [imageAssetIds, imageUrls],
  );
  const inspectAssetIdParam = normalizeSingleQueryParam(inspectQueryParams.inspect);
  const clickedInspectorIndex =
    inspectedAssetId == null
      ? -1
      : inspectorImages.findIndex((image) => image.assetId === inspectedAssetId);
  const deepLinkImage =
    inspectAssetIdParam == null || areImageUrlsLoading
      ? undefined
      : inspectorImages.find((image) => String(image.assetId) === inspectAssetIdParam);
  const activeInspectorImages =
    clickedInspectorIndex >= 0 ? inspectorImages : deepLinkImage != null ? [deepLinkImage] : null;
  const initialInspectorIndex = Math.max(clickedInspectorIndex, 0);

  const handleInspectorClose = useCallback(() => {
    setInspectedAssetId(null);
    setInspectQueryParams({ inspect: null }, { skipHistory: true });
  }, [setInspectQueryParams]);
  const getShareUrl = useCallback(
    (image: InspectorImage) => {
      if (!canShare || typeof window === 'undefined') {
        return '';
      }
      const url = new URL(imgSharingBaseUrl, window.location.origin);
      url.searchParams.set('inspect', String(image.assetId));
      return url.toString();
    },
    [canShare, imgSharingBaseUrl],
  );
  const linkCopiedLabel = translateAgreements('Label.LinkCopied');
  const handleLinkCopied = useCallback(() => {
    enqueueNeutralSnackbar(linkCopiedLabel);
  }, [enqueueNeutralSnackbar, linkCopiedLabel]);
  const pitchImageUnavailableLabel = translateAgreements('Label.ScreenshotNoLongerAvailable');
  const notifiedUnavailableAssetIdRef = useRef<string | null>(null);
  const handleAttachmentClick = useCallback(
    (assetId: number) => {
      if (!areImageUrlsLoading && imageUrls?.get(assetId) == null) {
        enqueueNeutralSnackbar(pitchImageUnavailableLabel);
        return;
      }
      setInspectedAssetId(assetId);
    },
    [areImageUrlsLoading, enqueueNeutralSnackbar, imageUrls, pitchImageUnavailableLabel],
  );

  useEffect(() => {
    if (inspectAssetIdParam == null || areImageUrlsLoading) {
      return;
    }
    if (notifiedUnavailableAssetIdRef.current === inspectAssetIdParam || deepLinkImage != null) {
      return;
    }
    notifiedUnavailableAssetIdRef.current = inspectAssetIdParam;
    enqueueNeutralSnackbar(pitchImageUnavailableLabel);
    setInspectQueryParams({ inspect: null }, { skipHistory: true });
  }, [
    areImageUrlsLoading,
    deepLinkImage,
    enqueueNeutralSnackbar,
    inspectAssetIdParam,
    pitchImageUnavailableLabel,
    setInspectQueryParams,
  ]);

  return {
    activeInspectorImages,
    canShare,
    getShareUrl,
    handleAttachmentClick,
    handleInspectorClose,
    handleLinkCopied,
    initialInspectorIndex,
  };
};

export default usePitchImageAttachmentsInspector;
