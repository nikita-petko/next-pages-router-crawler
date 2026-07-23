import { Link } from '@rbx/foundation-ui';
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
  'impersonated-group-id'?: string;
  'impersonated-owner-type'?: 'USER' | 'GROUP';
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

  const {
    impersonatedGroupId,
    impersonatedJwtId,
    impersonatedOwnerType,
    impersonatedUserId,
    initialFlagValues,
  } = useMemo(() => {
    if (!token) {
      return {
        impersonatedGroupId: undefined,
        impersonatedJwtId: '',
        impersonatedOwnerType: undefined,
        impersonatedUserId: '',
        initialFlagValues: buildFlagValuesFromToken(undefined),
      };
    }
    const decoded = jwtDecode<DecodedTokenType>(token);
    return {
      impersonatedGroupId: decoded['impersonated-group-id'],
      impersonatedJwtId: decoded['impersonated-ad-account-id'],
      impersonatedOwnerType: decoded['impersonated-owner-type'],
      impersonatedUserId: decoded['impersonated-user-id'],
      initialFlagValues: buildFlagValuesFromToken(decoded['config-overrides']),
    };
  }, [token]);

  const getBannerText = useCallback(() => {
    if (!impersonatedJwtId) {
      return 'You are able to impersonate an Ad Account. ';
    }

    if (impersonatedOwnerType === 'GROUP' && impersonatedGroupId) {
      return (
        <>
          You are impersonating Ad Account {impersonatedJwtId} (
          <Link
            href={`https://www.roblox.com/communities/${impersonatedGroupId}`}
            isExternal={false}
            target='_blank'>
            Link to Roblox Group
          </Link>
          ).
        </>
      );
    }

    if (!impersonatedUserId || impersonatedOwnerType === 'GROUP') {
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
  }, [impersonatedGroupId, impersonatedJwtId, impersonatedOwnerType, impersonatedUserId]);

  const handleEditClick = useCallback(() => {
    openImpersonationSwitchDialog(impersonatedJwtId, initialFlagValues);
  }, [impersonatedJwtId, initialFlagValues]);

  const handleEndImpersonationClick = useCallback(async () => {
    await setImpCookie('');
    router.reload();
  }, [router]);

  return (
    <div className={bannerContainer}>
      <span className={`text-body-large ${banner}`}>{getBannerText()}</span>
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
