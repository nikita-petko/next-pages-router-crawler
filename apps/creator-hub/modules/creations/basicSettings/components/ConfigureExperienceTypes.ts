export enum Privacy {
  Private = 'Private',
  Public = 'Public',
  PublicConnections = 'PublicConnections',
}

export type ConfigureExperienceFormType = {
  name: string;
  description: string;
  genre: string;
  subgenre: string;
  privacy: Privacy;
  isStudioAccessToApisAllowed: boolean;
  isMeshTextureApiAccessAllowed: boolean;
  isReleaseStatusEnabled?: boolean;
};

export type UniverseConfiguration = ConfigureExperienceFormType & { id: number };
