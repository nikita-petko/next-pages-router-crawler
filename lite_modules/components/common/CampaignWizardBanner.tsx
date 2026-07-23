import { Alert } from '@rbx/ui';
import { useRouter } from 'next/router';
import { memo, ReactNode } from 'react';

import useTransitionBannerStyles from '@components/onboarding/TransitionBanner.styles';
import { TranslationNamespace } from '@constants/localization';
import Routes from '@constants/routes';
import useNamespacedTranslation from '@hooks/useNamespacedTranslation';

interface CampaignWizardBannerProps {
  textAfterLink: string | ReactNode;
  textBeforeLink: string;
}

const CampaignWizardBanner = memo(
  ({ textAfterLink, textBeforeLink }: CampaignWizardBannerProps) => {
    const { translate } = useNamespacedTranslation(TranslationNamespace.Navigation);
    const router = useRouter();
    const {
      classes: { classicCreationFlowBanner, hereText },
    } = useTransitionBannerStyles();

    return (
      <Alert className={classicCreationFlowBanner} severity='info'>
        <span className='text-body-large'>{textBeforeLink}</span>
        <span
          className={`text-body-large ${hereText}`}
          onClick={() => {
            router.push(Routes.NEW_CREATE_CAMPAIGN);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              router.push(Routes.NEW_CREATE_CAMPAIGN);
            }
          }}
          role='button'
          tabIndex={0}>
          {translate('Label.AdsManager')}
        </span>
        <span className='text-body-large'>{textAfterLink}</span>
      </Alert>
    );
  },
);

export default CampaignWizardBanner;
