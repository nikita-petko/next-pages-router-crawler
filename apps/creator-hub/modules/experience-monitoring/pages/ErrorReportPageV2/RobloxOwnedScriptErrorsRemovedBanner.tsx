import { useCallback, useMemo, type FC, type ReactElement } from 'react';
import { SystemBanner } from '@rbx/foundation-ui';
import { useTranslation } from '@rbx/intl';
import { useLocalStorage } from '@rbx/react-utilities';
import useTranslationWrapper from '@modules/analytics-translations/useTranslationWrapper';
import { translationKey } from '@modules/analytics-translations/wrapperFunctions';
import { useAuthentication } from '@modules/authentication/providers';
import { getCurrentDate } from '@modules/charts-generic/utils/dateUtils';
import { TranslationNamespace } from '@modules/miscellaneous/localization';

const BANNER_EXPIRATION_TIME = new Date('2026-09-01T00:00:00Z');

const RobloxOwnedScriptErrorsRemovedBannerContent: FC<{ onDismiss: () => void }> = ({
  onDismiss,
}) => {
  const { translate } = useTranslationWrapper(useTranslation());

  return (
    // oxlint-disable-next-line typescript/no-deprecated -- SystemBanner is the Foundation component for page-level informational banners.
    <SystemBanner
      className='width-full'
      title={translate(
        translationKey(
          'Title.RobloxOwnedScriptErrorsRemovedBanner',
          TranslationNamespace.Analytics,
        ),
      )}
      description={translate(
        translationKey(
          'Description.RobloxOwnedScriptErrorsRemovedBanner',
          TranslationNamespace.Analytics,
        ),
      )}
      severity='Info'
      variant='Standard'
      showIcon
      onDismiss={onDismiss}
      dismissIconAriaLabel={translate(
        translationKey('Action.Dismiss', TranslationNamespace.Controls),
      )}
    />
  );
};

export const useRobloxOwnedScriptErrorsRemovedBannerElement = (): ReactElement | undefined => {
  const { user } = useAuthentication();
  const dismissalKey = `errorReportsRobloxOwnedScriptErrorsRemovedBanner.${user?.id ?? 'anonymous'}`;
  const [isDismissed, setIsDismissed] = useLocalStorage(dismissalKey, false);
  const currentTime = useMemo(() => getCurrentDate().getTime(), []);
  const handleDismiss = useCallback(() => setIsDismissed(true), [setIsDismissed]);

  return useMemo(
    () =>
      isDismissed || currentTime >= BANNER_EXPIRATION_TIME.getTime() ? undefined : (
        <RobloxOwnedScriptErrorsRemovedBannerContent onDismiss={handleDismiss} />
      ),
    [currentTime, handleDismiss, isDismissed],
  );
};

const RobloxOwnedScriptErrorsRemovedBanner: FC = () =>
  useRobloxOwnedScriptErrorsRemovedBannerElement() ?? null;

export default RobloxOwnedScriptErrorsRemovedBanner;
