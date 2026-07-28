import type { SocialLinksData } from '@modules/clients/games';

export const maxTitleLength = 70;
export const maxUrlLength = 256;

export type SocialLinkFormType = {
  socialLink: SocialLinksData[];
};

export const SocialLinkFormRules = {
  linkType: {
    required: '',
  },
  url: {
    required: '',
    maxLength: {
      value: maxUrlLength,
      message: '',
    },
  },
  title: {
    required: '',
    maxLength: {
      value: maxTitleLength,
      message: '',
    },
  },
};
