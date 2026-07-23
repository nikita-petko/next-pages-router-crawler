import React from 'react';
import { Button, Card, Typography, Link, InfoOutlinedIcon } from '@rbx/ui';
import { useTranslation } from '@rbx/intl';
import { useCurrentGame } from '@modules/providers/game/GameProvider';
import { ThemedImage } from '@modules/miscellaneous/common/components';
import giftBoxIconDark from '@rbx/foundation-images/pictograms/gift_dark.svg';
import giftBoxIconLight from '@rbx/foundation-images/pictograms/gift_light.svg';
import { CONTENT_MUTED_COLOR, REFERRAL_SYSTEM_DOCS_URL } from '../utils/constants';

export const StudioReminder = () => {
  const { translate } = useTranslation();
  return (
    <Card
      variant='outlined'
      square={false}
      style={{
        marginTop: '32px',
        padding: '16px',
        width: '100%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
      <div style={{ display: 'inline-flex', alignItems: 'center' }}>
        <InfoOutlinedIcon style={{ marginRight: '5px', color: '#2bb1ff' }} />
        <Typography variant='h6'>{translate('ReferralRewards.StudioReminder')}</Typography>
      </div>
      <Button href={REFERRAL_SYSTEM_DOCS_URL} color='secondary' variant='contained'>
        {translate('ReferralRewards.LearnMore')}
      </Button>
    </Card>
  );
};

// TODO(npatel, 2025-03-04): Add translations for all copytext in this component.
const EmptyState = () => {
  const { translate } = useTranslation();
  const { gameDetails } = useCurrentGame();

  return (
    <React.Fragment>
      <Card
        square={false}
        variant='outlined'
        style={{
          margin: '0 auto',
          textAlign: 'center',
          padding: '48px',
        }}>
        <ThemedImage
          lightSrc={giftBoxIconLight}
          alt='giftBox'
          darkSrc={giftBoxIconDark}
          style={{
            margin: '0 auto',
            display: 'block',
          }}
        />
        <Typography variant='h1'>{translate('ReferralRewards.BannerHeader')}</Typography>
        <p>
          <Typography variant='body1' style={{ color: CONTENT_MUTED_COLOR }}>
            <span>{translate('ReferralRewards.BannerDescription')}</span>
            <br />
            <Link
              style={{ marginLeft: '5px' }}
              href={REFERRAL_SYSTEM_DOCS_URL}
              color='primary'
              target='_blank'>
              {translate('ReferralRewards.LearnMoreLowercase')}
            </Link>
          </Typography>
        </p>
        <Button
          color='primaryBrand'
          variant='contained'
          size='medium'
          href={`/dashboard/creations/experiences/${gameDetails?.id}/referral-reward-details/create`}>
          {translate('ReferralRewards.AddRewardDetails')}
        </Button>
      </Card>
      <StudioReminder />
    </React.Fragment>
  );
};

export default EmptyState;
