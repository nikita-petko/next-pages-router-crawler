import { Audience } from '../../common/audiences';

export { Audience };

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
  audiences?: Audience[];
  isStudioAccessToApisAllowed: boolean;
  isMeshTextureApiAccessAllowed: boolean;
  isReleaseStatusEnabled?: boolean;
};

export type UniverseConfiguration = ConfigureExperienceFormType & { id: number };
