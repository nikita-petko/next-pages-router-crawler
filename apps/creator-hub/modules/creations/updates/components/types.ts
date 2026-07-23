export type ExperienceUpdatesFormType = {
  update: string;
};
export enum PreviewType {
  Desktop = 'Desktop',
  Tablet = 'Tablet',
  Phone = 'Phone',
}
export const ExperienceUpdatesFormTextRule = {
  required: 'Error.Required',
  maxLength: 60,
};
