import React, { FunctionComponent } from 'react';
import { Typography, Button, Alert } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import type { AgreementCandidateResponse } from '@rbx/clients/contentLicensingApi/v1';

import { Flex } from '@modules/miscellaneous/common/components';
import Link from 'next/link';
import { useIpFamilyQuery } from '../../../ipFamilies/hooks/ipFamily';
import { NO_GAME_FOUND_FOR_ID, useDebouncedGameDetails } from '../hooks/games';
import useDebouncedContentMaturity, {
  NO_CONTENT_MATURITY_FOUND_FOR_ID,
} from '../hooks/experienceGuidelines';
import { EXTERNAL_EXPERIENCE_HREF, IPH_AGREEMENT_DETAILS_HREF } from '../../urls';
import { ContentTile, ContentType } from '../../components/ContentTile';
import MatchDrawerLayout from './MatchDrawerLayout';
import {
  getCreationDauRangeLabelFromEnum,
  getLifetimeVisitsRangeLabelFromEnum,
} from '../../utils/dauEnum';

interface MatchDetailsDrawerContentProps {
  candidate: AgreementCandidateResponse;
  onClose: () => void;
  onOfferLicense: () => void;
}

/**
 * Show details about a match to IPH along with button to progress to the send offer step
 */
const MatchDetailsDrawerContent: FunctionComponent<MatchDetailsDrawerContentProps> = ({
  candidate,
  onClose,
  onOfferLicense,
}) => {
  const { translate } = useTranslation();
  const experienceId = Number(candidate.candidateId);

  const gameRequest = useDebouncedGameDetails(experienceId);
  const maturityRequest = useDebouncedContentMaturity(experienceId);
  const ipFamilyRequest = useIpFamilyQuery(candidate.ipFamilyId ?? undefined);

  const isPending = gameRequest.isPending || maturityRequest.isPending || ipFamilyRequest.isPending;

  const hasError =
    gameRequest.error ||
    maturityRequest.error ||
    ipFamilyRequest.error ||
    gameRequest.data === NO_GAME_FOUND_FOR_ID;

  const title = translate('Heading.ViewMatch');

  if (isPending) {
    return <MatchDrawerLayout title={title} onClose={onClose} loading />;
  }

  const game = gameRequest.data;

  if (hasError) {
    return (
      <MatchDrawerLayout title={title} onClose={onClose}>
        <Typography color='error'>{translate('Error.LoadingData')}</Typography>
      </MatchDrawerLayout>
    );
  }

  const contentMaturity =
    maturityRequest.error || maturityRequest.data === NO_CONTENT_MATURITY_FOUND_FOR_ID
      ? translate('Label.MaturityRatingNoneAvailable')
      : maturityRequest.data;
  const ipFamily = ipFamilyRequest.data;

  if (!game || game === NO_GAME_FOUND_FOR_ID) {
    return (
      <MatchDrawerLayout title={title} onClose={onClose}>
        <Typography color='error'>
          {translate('Error.ExperienceNotAvailable', {
            id: `${experienceId}`,
          })}
        </Typography>
      </MatchDrawerLayout>
    );
  }

  const existingAgreementId = candidate.agreementId;

  const buttons = (
    <React.Fragment>
      <Button variant='outlined' color='secondary' size='large' onClick={onClose}>
        {translate('Action.Close')}
      </Button>
      {existingAgreementId ? (
        <Button
          variant='contained'
          color='primaryBrand'
          component={Link}
          href={IPH_AGREEMENT_DETAILS_HREF(existingAgreementId)}>
          {translate('Action.ViewAgreement')}
        </Button>
      ) : (
        <Button variant='contained' color='primaryBrand' size='large' onClick={onOfferLicense}>
          {translate('Action.OfferLicense')}
        </Button>
      )}
    </React.Fragment>
  );

  return (
    <MatchDrawerLayout title={title} onClose={onClose} buttons={buttons}>
      {existingAgreementId && (
        <Alert severity='info'>{translate('Description.OfferPreviouslySent')}</Alert>
      )}
      <Flex flexDirection='column' gap={12}>
        <div>
          <Typography variant='h5' component='h2' gutterBottom>
            {translate('Label.Creation')}
          </Typography>

          <div>
            <ContentTile
              header={game.name!}
              subheader={`@${game.creator?.name}`}
              thumbnailTargetId={game.id!}
              type={ContentType.Universe}
              link={EXTERNAL_EXPERIENCE_HREF(game.rootPlaceId!)}
            />
          </div>
        </div>

        <div>
          <Typography variant='h6' component='h3'>
            {translate('Label.Description')}
          </Typography>
          <Typography whiteSpace='pre-wrap'>
            {game.description || translate('Label.NoDescriptionAvailable')}
          </Typography>
        </div>

        <div>
          <Typography variant='h6' component='h3'>
            {translate('Label.ContentMaturity')}
          </Typography>
          <Typography component='p'>{contentMaturity}</Typography>
        </div>
        <div>
          <Typography variant='h6' component='h3'>
            {translate('Label.DauRange')}
          </Typography>
          <Typography component='p'>
            {translate(getCreationDauRangeLabelFromEnum(candidate.dau7DayBucket))}
          </Typography>
        </div>
        <div>
          <Typography variant='h6' component='h3'>
            {translate('Label.LifetimeVisitsRange')}
          </Typography>
          <Typography component='p'>
            {translate(
              getLifetimeVisitsRangeLabelFromEnum(
                candidate.creatorLifetimeVisitBucket ?? undefined,
              ),
            )}
          </Typography>
        </div>
        <div>
          <Typography variant='h6' component='h3'>
            {translate('Label.DetectedIpFamily')}
          </Typography>
          <Typography component='p'>{ipFamily?.name}</Typography>
        </div>
      </Flex>
    </MatchDrawerLayout>
  );
};

export default MatchDetailsDrawerContent;
