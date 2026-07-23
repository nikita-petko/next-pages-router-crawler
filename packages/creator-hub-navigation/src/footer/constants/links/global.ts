import { TLink } from '../type';

const aboutUsLink: TLink = {
  path: 'https://corp.roblox.com/',
  title: 'Label.AboutRoblox',
};
const accessibilityLink: TLink = {
  path: 'https://www.roblox.com/info/accessibility',
  title: 'Label.Accessibility',
};
const careersLink: TLink = {
  path: 'https://corp.roblox.com/careers/',
  title: 'Label.Careers',
};
const technologyLink: TLink = {
  path: 'https://corp.roblox.com/technology/',
  title: 'Label.Technology',
};
const termsOfServiceLink: TLink = {
  path: 'https://www.roblox.com/info/terms',
  title: 'Label.TermsOfService',
};
const privatePolicyLink: TLink = {
  path: 'https://www.roblox.com/info/privacy',
  title: 'Label.PrivatePolicy',
};
const parentsLink: TLink = {
  path: 'https://corp.roblox.com/parents/',
  title: 'Label.Parents',
};
const dashboardLink: TLink = {
  path: 'https://create.roblox.com',
  title: 'Label.CreatorHub',
};
const communityLink: TLink = {
  path: 'https://devforum.roblox.com/',
  title: 'Label.Community',
};
const announcementsLink: TLink = {
  path: 'https://devforum.roblox.com/c/updates/announcements/36',
  title: 'Label.Announcements',
};
const twitterLink: TLink = {
  path: 'https://twitter.com/robloxdevrel',
  title: 'Label.Twitter',
};
const facebookLink: TLink = {
  path: 'https://www.facebook.com/Roblox',
  title: 'Label.Facebook',
};
const linkedInLink: TLink = {
  path: 'https://www.linkedin.com/company/roblox/',
  title: 'Label.LinkedIn',
};
const instagramLink: TLink = {
  path: 'https://www.instagram.com/Roblox/',
  title: 'Label.Instagram',
};
const youTubeLink: TLink = {
  path: 'https://www.youtube.com/Roblox',
  title: 'Label.YouTube',
};
const companyLinks: TLink[] = [
  aboutUsLink,
  accessibilityLink,
  careersLink,
  technologyLink,
  termsOfServiceLink,
  privatePolicyLink,
  parentsLink,
];

// Jira ticket: https://jira.rbx.com/browse/DSR-3428
const creatorLinks: TLink[] = [dashboardLink, communityLink, announcementsLink];
const socialMediaLinks: TLink[] = [
  twitterLink,
  facebookLink,
  linkedInLink,
  instagramLink,
  youTubeLink,
];

const globalColumnList = [
  { title: 'Label.Company', linkList: companyLinks },
  { title: 'Label.Creator', linkList: creatorLinks },
  { title: 'Label.SocialMedia', linkList: socialMediaLinks },
];

export default globalColumnList;
