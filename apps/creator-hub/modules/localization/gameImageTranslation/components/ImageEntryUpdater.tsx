import type { FunctionComponent } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@rbx/intl';
import { ChatBubbleIcon, Divider, Grid, IconButton, Typography } from '@rbx/ui';
import feedbackClient, { FeedbackContentType, ServiceSourceType } from '@modules/clients/feedback';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import useShowToastMessage from '../../common/hooks/useShowToastMessage';
import useEntryManagementMetadata from '../../translation/hooks/useEntryManagementMetadata';
import { imageTranslationFeedbackReasons } from '../constants';
import useTranslationHistory from '../hooks/useTranslationHistory';
import type { ImageTranslationInfo } from '../types';
import AssetImage from './AssetImage';
import useImageEntryUpdaterStyles from './ImageEntryUpdater.styles';
import type { ImageTranslationFeedbackPayload } from './ImageTranslationFeedbackDialog';
import ImageTranslationFeedbackDialog from './ImageTranslationFeedbackDialog';
import MoreInformation from './MoreInformation';
import TranslationHistory from './TranslationHistory';

export interface ImageEntryUpdaterProps {
  /** Mirrors strings updater: large table hydration. */
  isFullTableLoading: boolean;
  entryInfo: ImageTranslationInfo;
}

const ImageEntryUpdater: FunctionComponent<React.PropsWithChildren<ImageEntryUpdaterProps>> = ({
  entryInfo,
  isFullTableLoading,
}) => {
  const { translateWithNamespace } = useTranslation();
  const { gameId, entryTableId, currentLanguageOrLocaleCode } = useEntryManagementMetadata();
  const {
    translationHistory,
    isTranslationHistoryLoading,
    translationHistoryFetchingError,
    getFullTranslationHistory,
  } = useTranslationHistory();
  const {
    classes: {
      cardsRow,
      imageCard,
      imageCardMedia,
      imageInCard,
      emptyMedia,
      imageCardFooter,
      cardTitle,
      cardTitleContainer,
    },
  } = useImageEntryUpdaterStyles();
  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const { showSuccessToast, showFailureToast } = useShowToastMessage();

  const handleSubmitFeedback = useCallback(
    async ({ reasonId, additionalDetails }: ImageTranslationFeedbackPayload) => {
      const reason = imageTranslationFeedbackReasons.find((option) => option.id === reasonId);
      if (reason === undefined) {
        return;
      }
      try {
        await feedbackClient.createLocalizationFeedback({
          locale: currentLanguageOrLocaleCode,
          reasonType: reason.reasonType,
          comments: additionalDetails,
          feedbackTarget: {
            serviceSource: {
              externalId: `${gameId}:${entryInfo.sourceAssetId}`,
              type: ServiceSourceType.InGameUniverseAndImageAsset,
            },
            source: {
              contentType: FeedbackContentType.Image,
              value: String(entryInfo.sourceAssetId),
            },
            translation:
              entryInfo.translatedAssetId != null
                ? {
                    contentType: FeedbackContentType.Image,
                    value: String(entryInfo.translatedAssetId),
                  }
                : null,
          },
        });
        showSuccessToast(
          translateWithNamespace(
            TranslationNamespace.GameImageTranslation,
            'Message.FeedbackSubmitted',
          ),
        );
      } catch {
        showFailureToast(
          translateWithNamespace(
            TranslationNamespace.GameImageTranslation,
            'Message.FeedbackSubmitFailed',
          ),
        );
      }
    },
    [
      currentLanguageOrLocaleCode,
      gameId,
      entryInfo.sourceAssetId,
      entryInfo.translatedAssetId,
      showSuccessToast,
      showFailureToast,
      translateWithNamespace,
    ],
  );

  const getTranslationHistory = useCallback(
    async (info: ImageTranslationInfo) => {
      if (gameId && currentLanguageOrLocaleCode) {
        await getFullTranslationHistory(entryTableId, gameId, currentLanguageOrLocaleCode, info);
      }
    },
    [currentLanguageOrLocaleCode, entryTableId, gameId, getFullTranslationHistory],
  );

  useEffect(() => {
    if (!isFullTableLoading) {
      void getTranslationHistory(entryInfo);
    }
  }, [entryInfo, getTranslationHistory, isFullTableLoading]);

  return (
    <Grid>
      <Grid container className={cardsRow} direction='row' spacing={1}>
        <Grid item XSmall={6}>
          <Grid container className={imageCard} direction='column'>
            <Grid item className={imageCardMedia}>
              <AssetImage assetId={entryInfo.sourceAssetId} className={imageInCard} />
            </Grid>
            <Grid container direction='column' className={imageCardFooter}>
              <Grid item direction='row' className={cardTitleContainer}>
                <Typography className={cardTitle} variant='largeLabel1'>
                  {translateWithNamespace(
                    TranslationNamespace.GameImageTranslation,
                    'Label.SourceImage',
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        <Grid item XSmall={6}>
          <Grid container className={imageCard} direction='column'>
            <Grid item className={imageCardMedia}>
              {entryInfo.translatedAssetId != null ? (
                <AssetImage assetId={entryInfo.translatedAssetId} className={imageInCard} />
              ) : (
                <Typography className={emptyMedia} variant='largeLabel2'>
                  {translateWithNamespace(
                    TranslationNamespace.GameStringTranslation,
                    'Message.NoGlobalTranslation',
                  )}
                </Typography>
              )}
            </Grid>
            <Grid container direction='column' className={imageCardFooter}>
              <Grid container direction='row' className={cardTitleContainer}>
                <Grid item XSmall={11}>
                  <Typography className={cardTitle} variant='largeLabel1'>
                    {translateWithNamespace(
                      TranslationNamespace.GameImageTranslation,
                      'Label.TranslatedImage',
                    )}
                  </Typography>
                </Grid>
                {entryInfo.translatedAssetId != null && (
                  <Grid item XSmall={1}>
                    <IconButton
                      aria-label={translateWithNamespace(
                        TranslationNamespace.GameImageTranslation,
                        'Label.GiveRobloxFeedback',
                      )}
                      disabled={isFullTableLoading}
                      edge='end'
                      size='small'
                      onClick={() => setIsFeedbackDialogOpen(true)}>
                      <ChatBubbleIcon color='secondary' fontSize='small' />
                    </IconButton>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Divider />
      <MoreInformation translationLocation={entryInfo.gameLocationsForDisplay} />

      <Divider />
      <TranslationHistory
        error={translationHistoryFetchingError}
        isLoading={isFullTableLoading || isTranslationHistoryLoading}
        entries={translationHistory ?? []}
      />

      <ImageTranslationFeedbackDialog
        open={isFeedbackDialogOpen}
        onClose={() => setIsFeedbackDialogOpen(false)}
        onSubmitFeedback={handleSubmitFeedback}
      />
    </Grid>
  );
};

export default ImageEntryUpdater;
