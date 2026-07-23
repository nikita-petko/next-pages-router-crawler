import { TLink } from '../type';

const aboutUsLink: TLink = {
  path: 'https://corp.robloxdev.cn/',
  title: 'Label.AboutRoblox'
};
const careersLink: TLink = {
  path: 'https://corp.robloxdev.cn/career',
  title: 'Label.Careers'
};
const termsOfServiceLink: TLink = {
  path: 'https://robloxdev.cn/dev-terms.html',
  title: 'Label.TermsOfService'
};
const privatePolicyLink: TLink = {
  path: 'https://robloxdev.cn/dev-privacy-policy.html',
  title: 'Label.PrivatePolicy'
};
const dashboardLink: TLink = {
  path: 'https://create.robloxdev.cn',
  title: 'Label.CreatorHub'
};
const communityLink: TLink = {
  path: 'http://forum.robloxdev.cn/',
  title: 'Label.Community'
};
const announcementsLink: TLink = {
  path: 'https://forum.robloxdev.cn/c/updates/announcements/6',
  title: 'Label.Announcements'
};
const bilibiliLink: TLink = {
  path: 'https://space.bilibili.com/402416759',
  title: 'Label.Bilibili'
};
const companyLinks: TLink[] = [aboutUsLink, careersLink, termsOfServiceLink, privatePolicyLink];
const creatorLinks: TLink[] = [dashboardLink, communityLink, announcementsLink];
const socialMediaLinks: TLink[] = [bilibiliLink];
const luobuColumnList = [
  { title: 'Label.Company', linkList: companyLinks },
  { title: 'Label.Creator', linkList: creatorLinks },
  { title: 'Label.SocialMedia', linkList: socialMediaLinks }
];

export default luobuColumnList;
