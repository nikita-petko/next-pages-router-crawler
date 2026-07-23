import { XIcon, FacebookIcon, LinkedInIcon, InstagramIcon, YouTubeIcon } from '@rbx/ui';
import type { TLink, TIconLink } from '../type';

const termsLink: TLink = {
  path: 'https://www.roblox.com/info/terms',
  title: 'Label.Terms',
};

const privacyLink: TLink = {
  path: 'https://www.roblox.com/info/privacy',
  title: 'Label.Privacy',
};

const accessibilityLink: TLink = {
  path: 'https://www.roblox.com/info/accessibility',
  title: 'Label.Accessibility',
};

const supportLink: TLink = {
  path: 'https://www.roblox.com/info/help',
  title: 'Label.Support',
};

const impressumLink: TLink = {
  path: 'https://en.help.roblox.com/hc/de/articles/4401758349844-Impressum',
  title: 'Label.Impressum',
};

export const companyInfoLinks: TLink[] = [termsLink, privacyLink, accessibilityLink, supportLink];
export const companyInfoLinksInGermany: TLink[] = [...companyInfoLinks, impressumLink];

const xLink: TIconLink = {
  path: 'https://x.com/Roblox',
  title: 'X',
  icon: XIcon,
};

const facebookLink: TIconLink = {
  path: 'https://www.facebook.com/Roblox/',
  title: 'Facebook',
  icon: FacebookIcon,
};

const linkedInLink: TIconLink = {
  path: 'https://www.linkedin.com/company/roblox',
  title: 'LinkedIn',
  icon: LinkedInIcon,
};

const instagramLink: TIconLink = {
  path: 'https://www.instagram.com/roblox/',
  title: 'Instagram',
  icon: InstagramIcon,
};

export const youTubeLink: TIconLink = {
  path: 'https://www.youtube.com/Roblox',
  title: 'YouTube',
  icon: YouTubeIcon,
};

export const socialLinks: TIconLink[] = [
  xLink,
  facebookLink,
  linkedInLink,
  instagramLink,
  youTubeLink,
];
