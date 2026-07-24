import type { FunctionComponent } from 'react';
import React from 'react';
import type { AgreementCandidateResponse } from '@rbx/client-content-licensing-api/v1';
import { Locale, useLocalization, useTranslation } from '@rbx/intl';
import { Thumbnail2d, ThumbnailTypes, UniverseThumbnailSize } from '@rbx/thumbnails';
import { Skeleton, Typography } from '@rbx/ui';
import type { UniverseResponse } from '@modules/clients/develop';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import AmDivider from '../../components/AmDivider';
import { KeyValuePair, KeyValuePairContainer } from '../../components/KeyValuePair';
import {
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';
import { getContentMaturityLabelFromEnum } from '../../utils/maturityRating';
import useDebouncedContentMaturity, {
  NO_CONTENT_MATURITY_FOUND_FOR_ID,
} from '../hooks/experienceGuidelines';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import formatDate from '../utils/formatDate';

// Details tab: 75% of the content area on normal layouts; compresses with the page, whitespace grows wider.
const DETAILS_COLUMN_CLASS = 'width-full max-width-[75%] min-width-0';
const DISCLAIMER_BODY_CLASS = 'text-body-medium content-muted margin-none';
const DISCLAIMER_LABEL_CLASS = 'text-body-large content-emphasis !font-weight-bold';
// Same shimmer placeholder pattern as DetectedScreenshotsGrid (modal placefile screenshots).
const THUMBNAIL_FILL_CLASS = 'absolute inset-0 width-full height-full';
const THUMBNAIL_WRAPPER_CLASS = 'relative overflow-hidden radius-none aspect-16-9 [width:480px]';
const THUMBNAIL_CONTAINER_CLASS =
  '!absolute [inset:0] !width-full !height-full !padding-none !padding-top-none radius-none';
const THUMBNAIL_IMG_CLASS = `${THUMBNAIL_FILL_CLASS} [object-fit:cover]`;

interface MatchDetailsTabContentProps {
  candidate: AgreementCandidateResponse;
  universe: UniverseResponse;
}

/**
 * Details tab content for the experience preview page: a preview disclaimer, the experience thumbnail,
 * and key metadata (detected IP family, content maturity, DAU/visit ranges, and dates).
 */
const MatchDetailsTabContent: FunctionComponent<MatchDetailsTabContentProps> = ({
  candidate,
  universe,
}) => {
  const { translate } = useTranslation();
  const { locale } = useLocalization();
  const resolvedLocale = locale ?? Locale.English;

  const experienceId = Number(candidate.candidateId);
  const gameRequest = useDebouncedGameDetails(experienceId);
  const game = gameRequest.data;
  const thumbnailTargetId =
    game != null && game !== NO_GAME_FOUND_FOR_ID ? (game.id ?? experienceId) : experienceId;
  const isThumbnailLoading = gameRequest.isPending;
  const experienceDescription =
    game != null && game !== NO_GAME_FOUND_FOR_ID ? (game.description?.trim() ?? '') : '';

  const maturityRequest = useDebouncedContentMaturity(experienceId);
  const ipFamilyQuery = useIpFamilyQuery(candidate.ipFamilyId ?? undefined);
  const ipFamily = ipFamilyQuery.data;

  let contentMaturity: string;
  if (candidate.universeContentMaturity !== undefined) {
    contentMaturity = translate(getContentMaturityLabelFromEnum(candidate.universeContentMaturity));
  } else if (maturityRequest.isPending) {
    contentMaturity = translate('Label.Unknown');
  } else if (
    maturityRequest.error != null ||
    maturityRequest.data === NO_CONTENT_MATURITY_FOUND_FOR_ID
  ) {
    contentMaturity = translate('Label.MaturityRatingNoneAvailable');
  } else {
    contentMaturity = maturityRequest.data ?? translate('Label.MaturityRatingNoneAvailable');
  }

  const dauRange = translate(getCreationDauRangeLabelFromEnum(candidate.dau7DayBucket));
  const lifetimeVisitsRange = translate(
    getLifetimeVisitsRangeLabelFromEnum(candidate.creatorLifetimeVisitBucket ?? undefined),
  );

  const createdDate = universe.created
    ? formatDate(universe.created, resolvedLocale)
    : translate('Label.Unknown');
  const updatedDate = universe.updated
    ? formatDate(universe.updated, resolvedLocale)
    : translate('Label.Unknown');
  const matchDate = candidate.discoveredAt
    ? formatDate(candidate.discoveredAt, resolvedLocale)
    : translate('Label.Unknown');

  const disclaimerLabel = translate('Label.ExperiencePreviewDisclaimerLabel');
  const disclaimerBody = translate('Label.ExperiencePreviewDisclaimerBody');
  const thumbnailLabel = translate('Label.Thumbnail');
  const createdDateLabel = translate('Label.DateCreated');
  const updatedDateLabel = translate('Label.DateUpdated');

  return (
    <div className={DETAILS_COLUMN_CLASS}>
      <div className='flex flex-col gap-xxlarge'>
        <Typography className={DISCLAIMER_BODY_CLASS}>
          <strong className={DISCLAIMER_LABEL_CLASS}>{disclaimerLabel}</strong> {disclaimerBody}
        </Typography>

        <div className='flex flex-col gap-small'>
          <Typography variant='h6' component='h3'>
            {thumbnailLabel}
          </Typography>
          <div className={THUMBNAIL_WRAPPER_CLASS}>
            {isThumbnailLoading ? (
              <Skeleton animate variant='rectangular' className={THUMBNAIL_FILL_CLASS} />
            ) : (
              <Thumbnail2d
                targetId={thumbnailTargetId}
                containerClass={THUMBNAIL_CONTAINER_CLASS}
                imgClassName={THUMBNAIL_IMG_CLASS}
                skeletonVariant='rectangular'
                alt={translate('Label.CreationThumbnail')}
                type={ThumbnailTypes.universeThumbnail}
                // eslint-disable-next-line no-underscore-dangle -- Swagger generated enum has underscore
                size={UniverseThumbnailSize._576x324}
              />
            )}
          </div>
        </div>

        <AmDivider />

        <KeyValuePairContainer>
          <KeyValuePair
            label={translate('Label.Description')}
            value={
              isThumbnailLoading ? (
                <Skeleton animate variant='text' />
              ) : (
                // Preserve the author's line breaks, matching the modal and agreement details page.
                <Typography whiteSpace='pre-wrap'>
                  {experienceDescription || translate('Label.NoDescriptionAvailable')}
                </Typography>
              )
            }
          />
          <KeyValuePair label={translate('Label.DetectedIpFamily')} value={ipFamily?.name} />
          <KeyValuePair label={translate('Label.ContentMaturity')} value={contentMaturity} />
          <KeyValuePair label={translate('Label.DauRange')} value={dauRange} />
          <KeyValuePair
            label={translate('Label.LifetimeVisitsRange')}
            value={lifetimeVisitsRange}
          />
          <KeyValuePair label={createdDateLabel} value={createdDate} />
          <KeyValuePair label={updatedDateLabel} value={updatedDate} />
          <KeyValuePair label={translate('Label.DateMatched')} value={matchDate} />
        </KeyValuePairContainer>
      </div>
    </div>
  );
};

export default MatchDetailsTabContent;
