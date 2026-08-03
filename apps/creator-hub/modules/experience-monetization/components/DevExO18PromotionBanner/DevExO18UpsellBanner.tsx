import { useTranslation, withTranslation } from '@rbx/intl';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import BaseDevExO18Banner from './BaseDevExO18Banner';

type DevExO18UpsellBannerProps = {
  universeId: number;
  onClose: () => void;
  className?: string;
};

const upsellIllustrationSrc = `${process.env.assetPathPrefix}/devex-o18/upsell-banner-illustration.svg`;
const getDevExO18SettingsUrl = (universeId: number) =>
  `/settings/eligibility/us-o18-devex-rate?universeId=${universeId}`;

function DevExO18UpsellBanner({ universeId, onClose, className }: DevExO18UpsellBannerProps) {
  const { translate } = useTranslation();

  return (
    <BaseDevExO18Banner
      universeId={universeId}
      bannerType='Upsell'
      title={translate('Heading.DevExO18UpsellBanner' /* TranslationNamespace.DevEx */)}
      description={translate('Description.DevExO18UpsellBanner' /* TranslationNamespace.DevEx */)}
      primary={{
        label: translate('Action.LearnMoreDevExO18' /* TranslationNamespace.DevEx */),
        href: getDevExO18SettingsUrl(universeId),
      }}
      illustrationSrc={upsellIllustrationSrc}
      onClose={onClose}
      className={className}
    />
  );
}

export default withTranslation(DevExO18UpsellBanner, [TranslationNamespace.DevEx]);
