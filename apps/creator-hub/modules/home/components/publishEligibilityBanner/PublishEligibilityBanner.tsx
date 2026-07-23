import React, { useCallback, useRef, useEffect } from 'react';
import { Button, clsx } from '@rbx/foundation-ui';
import NextLink from 'next/link';
import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { useSettings } from '@modules/settings';
import unifiedLoggerClient from '@modules/eventStream/unifiedLoggerClient';
import CreatorDashboardEventType from '@modules/eventStream/enum/CreatorDashboardEventType';
import styles from './PublishEligibilityBanner.module.css';
import Section from '../common/Section';

const BANNER_IMAGE = `${process.env.assetPathPrefix}/home/publish_eligibility_banner.webp`;

const PublishEligibilityBanner: React.FC = () => {
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const impressionLogged = useRef(false);
  useEffect(() => {
    if (impressionLogged.current) return;
    impressionLogged.current = true;
    unifiedLoggerClient.logImpressionEvent({
      eventName: CreatorDashboardEventType.PublishEligibilityBannerImpression,
      parameters: { page: 'home' },
    });
  }, []);

  const trackClick = useCallback((action: string) => {
    unifiedLoggerClient.logClickEvent({
      eventName: CreatorDashboardEventType.PublishEligibilityBannerClick,
      parameters: { page: 'home', action },
    });
  }, []);

  return (
    <Section>
      <div
        className={clsx(
          styles.heroBanner,
          'relative width-full flex items-center surface-200 radius-large',
        )}>
        <img
          src={BANNER_IMAGE}
          alt=''
          aria-hidden
          className={clsx('block absolute inset-0 width-full height-full')}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <div
          className={clsx(
            styles.heroTextContent,
            'dark-theme relative flex flex-col gap-medium padding-[32px]',
          )}>
          <div>
            <div className='text-heading-medium content-emphasis'>
              {translate('Heading.NewPublishingEligibilityRequirements')}
            </div>
            <div className='text-body-medium content-emphasis'>
              {translate('Description.NewPublishingEligibilityRequirements')}
            </div>
          </div>
          <div className='flex flex-col medium:flex-row gap-small'>
            <NextLink
              href='/settings/eligibility/publishing-permissions'
              className='no-underline flex-grow'
              onClick={() => trackClick('viewRequirements')}>
              <Button size='Medium' className='width-full medium:width-auto'>
                <span>{translate('Action.ViewRequirements')}</span>
              </Button>
            </NextLink>
            <a
              href={settings.publishEligibilityDevForumUrl}
              className='no-underline'
              onClick={() => trackClick('viewAnnouncement')}>
              <Button variant='Standard' size='Medium' className='width-full medium:width-auto'>
                <span>{translate('Action.ViewAnnouncement')}</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default withTranslation(PublishEligibilityBanner, [
  TranslationNamespace.Home,
  TranslationNamespace.Creations,
]);
