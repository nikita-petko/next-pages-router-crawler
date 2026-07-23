import type { FC } from 'react';
import { useMemo } from 'react';
import { withTranslation } from '@rbx/intl';
import { InfoOutlinedIcon } from '@rbx/ui';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import GenericAnalyticsNUXBanner from '@modules/experience-analytics-shared/components/Banners/GenericAnalyticsNUXBanner';
import { TranslationNamespace } from '@modules/miscellaneous/localization';
import { creatorHub } from '@modules/miscellaneous/urls';

const FORWARD_LOOKING_RETENTION_NAME = 'ForwardLookingRetention';
const expirationTime = new Date('2025-09-24'); // 3 months from launch date

const ForwardRetentionNUXBanner: FC = () => {
  const { titleKey, descriptionKey, primaryButtonLabelKey, closeButtonLabelKey } = useMemo(() => {
    return {
      titleKey: translationKey('Title.ForwardRetentionNUXBanner', TranslationNamespace.Analytics),
      descriptionKey: translationKey(
        'Description.ForwardRetentionNUXBanner',
        TranslationNamespace.Analytics,
      ),
      primaryButtonLabelKey: translationKey(
        'Message.Alert.LearnMore',
        TranslationNamespace.Analytics,
      ),
      closeButtonLabelKey: translationKey('Action.Dismiss', TranslationNamespace.Creations),
    };
  }, []);

  const passesUrl = useMemo(() => {
    return creatorHub.docs.getAnalyticsRetentionGuideUrl();
  }, []);

  return (
    <GenericAnalyticsNUXBanner
      newUserExperienceName={FORWARD_LOOKING_RETENTION_NAME}
      titleKey={titleKey}
      descriptionKey={descriptionKey}
      primaryButtonLabelKey={primaryButtonLabelKey}
      closeButtonLabelKey={closeButtonLabelKey}
      linkOnPrimaryButtonClick={passesUrl}
      expirationTime={expirationTime}
      icon={InfoOutlinedIcon}
    />
  );
};

export default withTranslation(ForwardRetentionNUXBanner, [
  TranslationNamespace.Analytics,
  TranslationNamespace.Creations,
]);
