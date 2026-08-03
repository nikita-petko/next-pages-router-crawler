import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { dashboard } from '@modules/miscellaneous/urls/creatorHub';
import BaseDevExO18Banner from './BaseDevExO18Banner';

type DevExO18EligibleBannerProps = {
  universeId: number;
  onClose: () => void;
  className?: string;
};

const eligibleIllustrationSrc = `${process.env.assetPathPrefix}/devex-o18/upsell-banner-illustration.svg`;
const getDevExO18SettingsUrl = (universeId: number) =>
  `/settings/eligibility/us-o18-devex-rate?universeId=${universeId}`;

function DevExO18EligibleBanner({ universeId, onClose, className }: DevExO18EligibleBannerProps) {
  const { translate } = useTranslation();

  return (
    <BaseDevExO18Banner
      universeId={universeId}
      bannerType='Eligible'
      title={translate('Heading.DevExO18EligibleBanner' /* TranslationNamespace.DevEx */)}
      description={translate('Description.DevExO18EligibleBanner' /* TranslationNamespace.DevEx */)}
      primary={{
        label: translate('Action.ViewDevExO18Balance' /* TranslationNamespace.DevEx */),
        href: dashboard.getDevexUrl(),
      }}
      secondary={{
        label: translate('Action.LearnMoreDevExO18' /* TranslationNamespace.DevEx */),
        href: getDevExO18SettingsUrl(universeId),
      }}
      illustrationSrc={eligibleIllustrationSrc}
      onClose={onClose}
      className={className}
    />
  );
}

export default withTranslation(DevExO18EligibleBanner, [TranslationNamespace.DevEx]);
