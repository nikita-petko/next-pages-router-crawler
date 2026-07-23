import { resolveUrl } from '@rbx/env-utils';

interface ExternalLink {
  key: string;
  nameKey: string;
  url: string;
}

export const externalLinks = {
  aboutUsURL: resolveUrl('aboutUsUrl', process.env.targetEnvironment, process.env.buildTarget),
  joinUsURL: resolveUrl('joinUsUrl', process.env.targetEnvironment, process.env.buildTarget),
  termsOfServiceURL: resolveUrl(
    'termsOfServiceUrl',
    process.env.targetEnvironment,
    process.env.buildTarget,
  ),
  privacyPolicyURL: resolveUrl(
    'privacyPolicyUrl',
    process.env.targetEnvironment,
    process.env.buildTarget,
  ),
  accessibilityPolicyURL: resolveUrl(
    'accessibilityPolicyUrl',
    process.env.targetEnvironment,
    process.env.buildTarget,
  ),
  devexPolicyURL: resolveUrl(
    'devexPolicyUrl',
    process.env.targetEnvironment,
    process.env.buildTarget,
  ),
};

const { aboutUsURL, joinUsURL, termsOfServiceURL, privacyPolicyURL, accessibilityPolicyURL } =
  externalLinks;

// TODO: Remove ternary expression when luobu has accessibility link
const allExternalLinks: ExternalLink[] =
  process.env.buildTarget === 'luobu'
    ? [
        {
          key: 'aboutUs',
          nameKey: 'Label.AboutUs',
          url: aboutUsURL,
        },
        {
          key: 'joinUs',
          nameKey: 'Label.JoinUs',
          url: joinUsURL,
        },
        {
          key: 'terms',
          nameKey: 'Label.Terms',
          url: termsOfServiceURL,
        },
        {
          key: 'privacy',
          nameKey: 'Label.Privacy',
          url: privacyPolicyURL,
        },
      ]
    : [
        {
          key: 'aboutUs',
          nameKey: 'Label.AboutUs',
          url: aboutUsURL,
        },
        {
          key: 'joinUs',
          nameKey: 'Label.JoinUs',
          url: joinUsURL,
        },
        {
          key: 'terms',
          nameKey: 'Label.Terms',
          url: termsOfServiceURL,
        },
        {
          key: 'privacy',
          nameKey: 'Label.Privacy',
          url: privacyPolicyURL,
        },
        {
          key: 'accessibility',
          nameKey: 'Label.Accessibility',
          url: accessibilityPolicyURL,
        },
      ];

export default allExternalLinks;
