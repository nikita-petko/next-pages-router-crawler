import type { FC } from 'react';
import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings/SettingsProvider/SettingsProvider';
import GenericVerificationAlert from '../../verification/components/GenericVerificationAlert';

const Unification2D3DBanner: FC = () => {
  const { translate } = useTranslation();
  const { settings } = useSettings();

  if (!settings.enable2D3DUnificationBanner) {
    return null;
  }

  return (
    <div className='margin-bottom-[32px]'>
      <GenericVerificationAlert
        alertTitle={undefined}
        alertDescription={translate('Label.2D3DUnificationBanner')}
        severity='info'
        externalLink={settings.unification2D3DBannerLearnMoreUrl || undefined}
        linkLabel={translate('Label.LearnMore')}
        allowCloseDialog
      />
    </div>
  );
};

export default Unification2D3DBanner;
