import { Alert, Typography } from '@rbx/ui';
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
        <Typography variant='body1'>{textBeforeLink}</Typography>
        <Typography
          className={hereText}
          onClick={() => {
            router.push(Routes.NEW_CREATE_CAMPAIGN);
          }}
          variant='body1'>
          {translate('Label.AdsManager')}
        </Typography>
        <Typography variant='body1'>{textAfterLink}</Typography>
      </Alert>
    );
  },
);

export default CampaignWizardBanner;
