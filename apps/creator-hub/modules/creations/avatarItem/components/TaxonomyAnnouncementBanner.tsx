import React, { FunctionComponent } from 'react';
import { useTranslation } from '@rbx/intl';
import { useSettings } from '@modules/settings';
import { useLocalStorage } from '@rbx/react-utilities';
import GenericVerificationAlert from '../../verification/components/GenericVerificationAlert';

const hasDismissedTaxonomyAnnouncementBannerKey = 'hasDismissedTaxonomyAnnouncementBanner';

const TaxonomyAnnouncementBanner: FunctionComponent = () => {
  const { translate } = useTranslation();
  const { settings } = useSettings();

  const [isDismissed, setIsDismissed] = useLocalStorage<true | null>(
    hasDismissedTaxonomyAnnouncementBannerKey,
    null,
  );

  const showBanner = !isDismissed && settings.showTaxonomyAnnouncementBanner;

  if (showBanner) {
    return (
      <GenericVerificationAlert
        allowCloseDialog
        onDismiss={() => setIsDismissed(true)}
        linkLabel={translate('Label.LearnMore')}
        externalLink={settings.taxonomyDocumentationUrl}
        severity='info'
        alertTitle={translate('Heading.TaxonomyAnnouncement')}
        alertDescription={translate('Description.TaxonomyAnnouncement')}
      />
    );
  }

  return null;
};

export default TaxonomyAnnouncementBanner;
