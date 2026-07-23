export const socialLinksExperienceGuidelinesUrl =
  'https://en.help.roblox.com/hc/en-us/articles/360000910966-Social-Media-Links-for-Experiences';
export const ageVerificationRedirectPath = `https://www.${process.env.robloxSiteDomain}/my/account?ageVerification`;

export enum SocialLinksVerificationStatus {
  None = 0,
  VerifiedForCommunity = 1,
  VerifiedForExperiences = 2,
  VerifiedForAll = 3,
}

export const socialLinksUpsellCopy = {
  experiences: {
    ownerAndLocked: {
      title: 'Header.SocialLinkVisibility',
      description: 'Description.ExperienceSocialLinksVisibility',
    },
    managerOrUnlocked: {
      title: 'Header.ManageSocialLinks',
      description: 'Description.ExperienceSocialLinksManagement',
    },
  },
  community: {
    ownerAndLocked: {
      title: 'Header.SocialLinkVisibility',
      description: 'Description.ConfirmYourAge',
    },
    managerOrUnlocked: {
      title: 'Header.ManageSocialLinks',
      description: 'Description.ManageSocialLinksRequirement',
    },
  },
};
