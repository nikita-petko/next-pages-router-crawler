import type { ReactNode } from 'react';
import { Link as MuiLink } from '@rbx/ui';
import useLocale from '@modules/charts-generic/context/useLocale';

// localized link to Roblox's Privacy Policy page
export const PrivacyPolicyLink = ({ children }: { children: ReactNode }) => {
  return (
    <MuiLink href={`https://www.${process.env.robloxSiteDomain}/info/privacy`} target='_blank'>
      {children}
    </MuiLink>
  );
};

// localized link to Rights Manager's Terms of Use page
export const TermsOfUseLink = ({ children }: { children: ReactNode }) => {
  return (
    <MuiLink
      href={`https://${process.env.robloxSiteDomain}/info/rights-manager/terms`}
      target='_blank'>
      {children}
    </MuiLink>
  );
};

// localized link to Roblox's Community Standards page
export const CommunityStandardsLink = ({ children }: { children: ReactNode }) => {
  const locale = useLocale();
  return (
    <MuiLink href={`https://en.help.roblox.com/hc/${locale}/articles/203313410`} target='_blank'>
      {children}
    </MuiLink>
  );
};

// localized link to License Manager Legal Agreement
export const LicenseManagerLegalAgreement = ({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) => {
  const locale = useLocale();
  return (
    <MuiLink
      href={`https://en.help.roblox.com/hc/${locale}/articles/42542704086548`}
      color='primary'
      aria-label='legalAgreement'
      onClick={onClick}
      target='_blank'>
      {children}
    </MuiLink>
  );
};

// localized link to Roblox's Terms of Use page
export const RobloxTermsOfUseLink = ({ children }: { children: ReactNode }) => {
  return (
    <MuiLink href={`https://${process.env.robloxSiteDomain}/info/terms`} target='_blank'>
      {children}
    </MuiLink>
  );
};

// link to Roblox's IP Policy (DMCA guidelines) documentation
export const IpPolicyLink = ({ children }: { children: ReactNode }) => {
  return (
    <MuiLink
      href='https://create.roblox.com/docs/production/publishing/dmca-guidelines'
      target='_blank'>
      {children}
    </MuiLink>
  );
};

// link to Roblox's IP Licensing documentation
export const IpLicensingLink = ({ children }: { children: ReactNode }) => {
  return (
    <MuiLink href='https://create.roblox.com/docs/ip-licensing/get-started' target='_blank'>
      {children}
    </MuiLink>
  );
};
