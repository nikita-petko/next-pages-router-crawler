import { Link } from '@rbx/foundation-ui';
import { Typography } from '@rbx/ui';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/router';
import { memo, useCallback, useMemo } from 'react';

import { openImpersonationSwitchDialog } from '@components/common/dialog/impersonationSwitchDialog';
import useImpersonationBannerStyles from '@components/common/ImpersonationBanner.styles';
import { DEFAULT_FLAG_VALUE, IMPERSONATION_FLAGS } from '@constants/impersonation';
import type { FlagValues } from '@constants/impersonation';
import { setImpCookie } from '@services/ads/adAccountService';

interface DecodedTokenType {
  'config-overrides'?: string;
  'impersonated-ad-account-id': string;
  'impersonated-user-id': string;
  'impersonator-email': string;
  'impersonator-user-id': string;
  'session-id': string;
}

const buildFlagValuesFromToken = (configOverridesClaim?: string): FlagValues => {
  const parsed: Record<string, string> = {};
  if (configOverridesClaim) {
    configOverridesClaim.split(',').forEach((pair) => {
      const [key, value] = pair.split(':');
      if (key && value) {
        parsed[key.trim()] = value.trim();
      }
    });
  }
  return IMPERSONATION_FLAGS.reduce<FlagValues>(
    (acc, { configKey }) => ({ ...acc, [configKey]: parsed[configKey] || DEFAULT_FLAG_VALUE }),
    {},
  );
};

const ImpersonationBanner = memo(() => {
  const {
    classes: { banner, bannerContainer, impersonationButton },
  } = useImpersonationBannerStyles();
  const router = useRouter();

  const token = Cookies.get('ad-account-imp-info');

  const { impersonatedJwtId, impersonatedUserId, initialFlagValues } = useMemo(() => {
    if (!token) {
      return {
        impersonatedJwtId: '',
        impersonatedUserId: '',
        initialFlagValues: buildFlagValuesFromToken(undefined),
      };
    }
    const decoded = jwtDecode<DecodedTokenType>(token);
    return {
      impersonatedJwtId: decoded['impersonated-ad-account-id'],
      impersonatedUserId: decoded['impersonated-user-id'],
      initialFlagValues: buildFlagValuesFromToken(decoded['config-overrides']),
    };
  }, [token]);

  const getBannerText = useCallback(() => {
    if (!impersonatedJwtId) {
      return 'You are able to impersonate an Ad Account. ';
    }

    if (!impersonatedUserId) {
      return `You are impersonating Ad Account ${impersonatedJwtId}.`;
    }

    return (
      <>
        You are impersonating Ad Account {impersonatedJwtId} (
        <Link
          href={`https://www.roblox.com/users/${impersonatedUserId}/profile`}
          isExternal={false}
          target='_blank'>
          Link to Roblox Profile
        </Link>
        ).
      </>
    );
  }, [impersonatedJwtId, impersonatedUserId]);

  const handleEditClick = useCallback(() => {
    openImpersonationSwitchDialog(impersonatedJwtId, initialFlagValues);
  }, [impersonatedJwtId, initialFlagValues]);

  const handleEndImpersonationClick = useCallback(async () => {
    await setImpCookie('');
    router.reload();
  }, [router]);

  return (
    <div className={bannerContainer}>
      <Typography className={banner}>{getBannerText()}</Typography>
      <button className={impersonationButton} onClick={handleEditClick} type='button'>
        Edit
      </button>
      {impersonatedJwtId && (
        <button className={impersonationButton} onClick={handleEndImpersonationClick} type='button'>
          End Session
        </button>
      )}
    </div>
  );
});

export default ImpersonationBanner;
