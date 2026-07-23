import { SubjectType } from '@rbx/clients/assetPermissionsApi';

export enum PermissionAccessLevel {
  USE = 'Use',
  EDIT = 'Edit',
  NONE = 'None',
}

export enum PermissionProcessType {
  Grant = 'Grant',
  Revoke = 'Revoke',
}

export enum PermissionTab {
  COLLABORATORS = 'Collaborators',
  EXPERIENCES = 'Experiences',
}

export type PermissionToastMessage = { isSuccess: boolean; title: string; description: string };

export type SharedSubjectDetails = {
  proposedAccessLevel: PermissionAccessLevel;
  storedAccessLevel: PermissionAccessLevel;
  subjectId: number;
  subjectName: string;
  // This is optional as it is only used for the subject type of User
  // For groups and experiences, only the name is needed
  subjectUsername?: string;
  subjectType: SubjectType;
};
