import type { TLink } from '../type';

type TLinkColumn = {
  title: string;
  links: TLink[];
};

const homeLink: TLink = {
  path: 'https://create.roblox.com',
  title: 'Heading.Home',
};

const dashboardLink: TLink = {
  path: 'https://create.roblox.com/dashboard/creations',
  title: 'Heading.Dashboard',
};

const learnLink: TLink = {
  path: 'https://create.roblox.com/docs',
  title: 'Heading.Learn',
};

const storeLink: TLink = {
  path: 'https://create.roblox.com/store',
  title: 'Heading.Store',
};

const roadmapLink: TLink = {
  path: 'https://create.roblox.com/roadmap',
  title: 'Heading.Roadmap',
};

export const creatorHubColumn: TLinkColumn = {
  title: 'Label.CreatorHub',
  links: [homeLink, dashboardLink, learnLink, storeLink, roadmapLink],
};

const forumLink: TLink = {
  path: 'https://devforum.roblox.com',
  title: 'Heading.Forums',
};

const creatorEventsLink: TLink = {
  path: 'https://events.roblox.com',
  title: 'Heading.CreatorEvents',
};

const announcementsLink: TLink = {
  path: 'https://devforum.roblox.com/c/updates/announcements/36',
  title: 'Label.Announcements',
};

const talentLink: TLink = {
  path: 'https://create.roblox.com/talent',
  title: 'Heading.Talent',
};

export const communityColumn: TLinkColumn = {
  title: 'Heading.Community',
  links: [forumLink, creatorEventsLink, announcementsLink, talentLink],
};

const robloxLink: TLink = {
  path: 'https://www.roblox.com',
  title: 'Label.RobloxWebsite',
};

const newsLink: TLink = {
  path: 'https://corp.roblox.com/newsroom',
  title: 'Label.News',
};

const careersLink: TLink = {
  path: 'https://careers.roblox.com',
  title: 'Label.Careers',
};

const aboutLink: TLink = {
  path: 'https://corp.roblox.com',
  title: 'Label.About',
};

export const robloxColumn: TLinkColumn = {
  title: 'Heading.Roblox',
  links: [robloxLink, newsLink, careersLink, aboutLink],
};

const helpCenterLink: TLink = {
  path: 'https://www.roblox.com/info/help',
  title: 'Label.HelpCenter',
};

const accessibilityLink: TLink = {
  path: 'https://www.roblox.com/info/accessibility',
  title: 'Label.Accessibility',
};

const safetyCivilityLink: TLink = {
  path: 'https://corp.roblox.com/safety-civility-resources',
  title: 'Label.SafetyCivility',
};

const contactLink: TLink = {
  path: 'https://corp.roblox.com/contact',
  title: 'Label.Contact',
};

export const supportColumn: TLinkColumn = {
  title: 'Label.Support',
  links: [helpCenterLink, accessibilityLink, safetyCivilityLink, contactLink],
};

const advertiseLink: TLink = {
  path: 'https://advertise.roblox.com',
  title: 'Label.Advertise',
};

const brandsLink: TLink = {
  path: 'https://brands.roblox.com',
  title: 'Label.Brands',
};

const educationLink: TLink = {
  path: 'https://education.roblox.com',
  title: 'Label.Education',
};

const licensesLink: TLink = {
  path: 'https://create.roblox.com/explore/licenses',
  title: 'Heading.Licenses',
};

export const exploreColumn: TLinkColumn = {
  title: 'Heading.Explore',
  links: [advertiseLink, brandsLink, educationLink, licensesLink],
};

export const columnLists: TLinkColumn[] = [
  creatorHubColumn,
  communityColumn,
  robloxColumn,
  supportColumn,
  exploreColumn,
];
