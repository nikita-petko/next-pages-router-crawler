export const pluralize = <T extends string>(count: number, singular: T, plural: T): T => {
  return count === 1 ? singular : plural;
};
