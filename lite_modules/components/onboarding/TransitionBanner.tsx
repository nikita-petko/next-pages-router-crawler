import { IconButton } from '@rbx/foundation-ui';
import { Alert } from '@rbx/ui';
import { memo, useState } from 'react';

import { EventName, unifiedLogger } from '@clients/unifiedLogger';
import useTransitionBannerStyles from '@components/onboarding/TransitionBanner.styles';
import { TranslationNamespace } from '@constants/localization';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

const LEARN_MORE_URL =
  'https://devforum.roblox.com/t/ads-manager-updates-home-search-combined-new-benchmarks-and-sunsetting-the-classic-flow/4084863';

const TransitionBanner = memo(() => {
  const { translate: translateReport } = useNamespacedTranslation(TranslationNamespace.Report);
  const { translate: translateMisc } = useNamespacedTranslation(TranslationNamespace.Misc);
  const {
    classes: {
      bannerContainer,
      bannerContent,
      bannerTextContainer,
      bannerTitle,
      closeButton,
      learnMoreLink,
    },
  } = useTransitionBannerStyles();
  const [isVisible, setIsVisible] = useState<boolean>(true);

  if (!isVisible) {
    return null;
  }

  const handleLearnMoreClick = () => {
    unifiedLogger.logClickEvent({
      eventName: EventName.BannerNavigation,
      parameters: { linkTo: LEARN_MORE_URL },
    });
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <Alert className={bannerContainer} severity='info' variant='outlined'>
      <div className={bannerContent}>
        <div className={bannerTextContainer}>
          <span className={`text-body-large ${bannerTitle}`}>
            {translateReport('Heading.TransitionBannerTitle')}
          </span>
          <span className='text-body-medium'>
            {translateReport('Description.TransitionBannerBody')}
          </span>
        </div>
        <a
          className={learnMoreLink}
          href={LEARN_MORE_URL}
          onClick={handleLearnMoreClick}
          rel='noopener noreferrer'
          target='_blank'>
          {translateReport('Action.LearnMoreManage')}
        </a>
        <IconButton
          ariaLabel={translateMisc('Action.Close')}
          className={closeButton}
          icon='icon-regular-x'
          onClick={handleClose}
          size='Small'
          variant='Utility'
        />
      </div>
    </Alert>
  );
});

export default TransitionBanner;
