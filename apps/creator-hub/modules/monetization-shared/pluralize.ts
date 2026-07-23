// eslint-disable-next-line import/prefer-default-export -- no, keep it named
export const pluralize = (count: number, singular: string, plural: string) => {
  return count === 1 ? singular : plural;
};
